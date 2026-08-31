const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const envFile = path.resolve(__dirname, '../../../.env')
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
}
const port = Number(process.env.API_PORT || 3000)
const aiBaseUrl = (process.env.AI_API_BASE_URL || '').replace(/\/$/, '')
const aiKey = process.env.AI_API_KEY || ''
const visionModel = process.env.AI_VISION_MODEL || ''
const appId = process.env.WECHAT_APP_ID || ''
const appSecret = process.env.WECHAT_APP_SECRET || ''
const dataFile = path.resolve(__dirname, '../../../data/local-learning-data.json')
const sessions = new Map()
function loadDatabase() { try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')) } catch { return { users: {}, records: {} } } }
let database = loadDatabase()
function saveDatabase() { fs.mkdirSync(path.dirname(dataFile), { recursive: true }); fs.writeFileSync(dataFile, JSON.stringify(database, null, 2)) }
function send(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }); res.end(JSON.stringify(body)) }
function readBody(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', part => { raw += part; if (raw.length > 12 * 1024 * 1024) req.destroy() }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}) } catch { reject(new Error('请求内容不是合法 JSON。')) } }); req.on('error', reject) }) }
function requireUser(req) { const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const openid = sessions.get(token); if (!openid) { const error = new Error('登录已失效，请重新进入小程序。'); error.status = 401; throw error } return openid }
function prompt() { return `你是面向中国九年级学生的数学与物理辅导老师。请识别图片中的一题题目并解答。只返回合法 JSON，不要 Markdown 代码块，也不要额外文字：{"problem":"完整题目","subject":"数学或物理","knowledgePoints":["知识点"],"answer":"最终答案，公式使用 LaTex","steps":[{"title":"步骤标题","content":"详细推导，公式使用 LaTex"}],"commonMistake":"易错点"}。要求：答案和解析分开；最多 3 个 steps，每步只保留关键推导，每步不超过 55 个汉字；answer 不超过 80 个汉字；commonMistake 不超过 45 个汉字。不要输出 Markdown（不要 **、#、列表符号或反引号）。数学公式只用简洁 LaTex，不要使用 \\text{}，中文直接写在公式外。不猜测看不清的条件；若无法清晰识别，problem 写“图片不清晰，无法可靠识别题目”，并在 commonMistake 说明需要重拍。` }
function extractJson(text) { return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) }
async function solve(imageBase64, mimeType = 'image/jpeg') {
  if (!aiBaseUrl || !aiKey || !visionModel) { const error = new Error('AI 服务尚未配置。'); error.status = 503; throw error }
  const response = await fetch(`${aiBaseUrl}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiKey}` }, body: JSON.stringify({ model: visionModel, temperature: 0.2, enable_thinking: false, max_tokens: 1200, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: [{ type: 'text', text: prompt() }, { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }] }] }) })
  const data = await response.json().catch(() => ({})); if (!response.ok) { const error = new Error(data?.error?.message || `模型服务请求失败（${response.status}）`); error.status = 502; throw error }
  if (!data?.choices?.[0]?.message?.content) throw new Error('模型没有返回解题内容。'); return extractJson(data.choices[0].message.content)
}
async function textCompletion(instruction, maxTokens = 800) {
  const response = await fetch(`${aiBaseUrl}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiKey}` }, body: JSON.stringify({ model: visionModel, temperature: 0.25, enable_thinking: false, max_tokens: maxTokens, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: [{ type: 'text', text: instruction }] }] }) })
  const data = await response.json().catch(() => ({})); if (!response.ok) { const error = new Error(data?.error?.message || `模型服务请求失败（${response.status}）`); error.status = 502; throw error }
  if (!data?.choices?.[0]?.message?.content) throw new Error('模型没有返回内容。'); return extractJson(data.choices[0].message.content)
}
async function generatePractice(source) {
  const instruction = `你是九年级数学物理练习题编写老师。基于以下原题和解析，生成一道“同解题方法、换成易算数据”的变式题。禁止照抄原题；避免小数、无理数和超纲知识；计算量与原题相近。只返回合法 JSON：{"question":"题目，公式可使用 LaTex","hint":"不超过35字的提示","answer":"最终答案","solution":"不超过90字的简洁解析","knowledgePoints":["知识点"]}。不要 Markdown，不要 \\text{}。原题：${JSON.stringify(source)}`
  return textCompletion(instruction, 700)
}
async function checkPractice(practice, studentAnswer) {
  const instruction = `你是九年级数学物理辅导老师。判断学生答案是否与标准答案等价。只返回合法 JSON：{"correct":true,"feedback":"不超过55字的鼓励性反馈，公式可用LaTex","idealAnswer":"标准答案"}。不要 Markdown。题目：${practice.question}。标准答案：${practice.answer}。学生答案：${studentAnswer}`
  return textCompletion(instruction, 400)
}
async function wechatLogin(code) {
  if (!appId || !appSecret) { const error = new Error('微信登录尚未配置。'); error.status = 503; throw error }
  const query = new URLSearchParams({ appid: appId, secret: appSecret, js_code: code, grant_type: 'authorization_code' })
  const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${query}`); const data = await response.json()
  if (!data.openid) { const error = new Error(data.errmsg || '微信登录失败。'); error.status = 502; throw error }
  if (!database.users[data.openid]) { database.users[data.openid] = { createdAt: new Date().toISOString() }; database.records[data.openid] = []; saveDatabase() }
  const token = crypto.randomUUID(); sessions.set(token, data.openid); return { token, isNewUser: database.records[data.openid].length === 0 }
}
function overview(openid) { const records = database.records[openid] || []; const count = {}; for (const record of records) for (const item of record.knowledgePoints || []) count[item] = (count[item] || 0) + 1; const knowledgePoints = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, value]) => ({ name, value })); return { solvedCount: records.length, knowledgePoints, recent: records.slice(0, 5) } }
http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {})
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname
  try {
    if (req.method === 'GET' && pathname === '/health') return send(res, 200, { ok: true, configured: Boolean(aiBaseUrl && aiKey && visionModel), wechatConfigured: Boolean(appId && appSecret) })
    if (req.method === 'POST' && pathname === '/api/auth/wechat') { const { code } = await readBody(req); if (!code) return send(res, 400, { error: '缺少微信登录凭证。' }); return send(res, 200, { data: await wechatLogin(code) }) }
    if (req.method === 'POST' && pathname === '/api/solve') { const { imageBase64, mimeType } = await readBody(req); if (!imageBase64) return send(res, 400, { error: '请先上传题目图片。' }); return send(res, 200, { data: await solve(imageBase64, mimeType) }) }
    if (req.method === 'POST' && pathname === '/api/practice/generate') { const { source } = await readBody(req); if (!source?.problem) return send(res, 400, { error: '请先完成一道题目的 AI 解答。' }); return send(res, 200, { data: await generatePractice(source) }) }
    if (req.method === 'POST' && pathname === '/api/practice/check') { const { practice, answer } = await readBody(req); if (!practice?.question || !answer?.trim()) return send(res, 400, { error: '请先写下答案。' }); return send(res, 200, { data: await checkPractice(practice, answer) }) }
    if (req.method === 'GET' && pathname === '/api/overview') return send(res, 200, { data: overview(requireUser(req)) })
    if (req.method === 'GET' && pathname === '/api/records') return send(res, 200, { data: database.records[requireUser(req)] || [] })
    if (req.method === 'POST' && pathname === '/api/records') { const openid = requireUser(req); const { result } = await readBody(req); if (!result?.problem) return send(res, 400, { error: '没有可保存的解题记录。' }); const knowledgePoints = result.knowledgePoints || []; const record = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), problem: result.problem, subject: result.subject || '', knowledgePoints, knowledgeText: knowledgePoints.join(' · '), answer: result.answer || '' }; database.records[openid] = [record, ...(database.records[openid] || [])].slice(0, 200); saveDatabase(); return send(res, 201, { data: record }) }
    send(res, 404, { error: 'Not found' })
  } catch (error) { send(res, error.status || 500, { error: error.message || '服务异常，请稍后重试。' }) }
}).listen(port, () => console.log(`AI 解题服务已启动：http://127.0.0.1:${port}`))
