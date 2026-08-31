// 真机调试时将 127.0.0.1 改为电脑的局域网 IPv4 地址，例如 http://192.168.1.8:3000
const API_BASE_URL = 'http://127.0.0.1:3000'
function request(path, method = 'GET', data) {
  return new Promise((resolve, reject) => {
    wx.request({ url: `${API_BASE_URL}${path}`, method, data, header: { 'content-type': 'application/json', Authorization: `Bearer ${wx.getStorageSync('loginToken') || ''}` }, success: res => res.statusCode >= 200 && res.statusCode < 300 ? resolve(res.data.data) : reject(new Error(res.data?.error || '请求失败')), fail: () => reject(new Error('无法连接本地服务。')) })
  })
}
async function ensureLogin() {
  const token = wx.getStorageSync('loginToken'); if (token) return token
  const login = await new Promise((resolve, reject) => wx.login({ success: resolve, fail: reject }))
  const data = await request('/api/auth/wechat', 'POST', { code: login.code }); wx.setStorageSync('loginToken', data.token); return data.token
}

function solveQuestion(imageBase64, mimeType) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/api/solve`, method: 'POST', timeout: 90000,
      header: { 'content-type': 'application/json', Authorization: `Bearer ${wx.getStorageSync('loginToken') || ''}` }, data: { imageBase64, mimeType },
      success: response => response.statusCode === 200 ? resolve(response.data.data) : reject(new Error(response.data?.error || 'AI 服务请求失败')),
      fail: () => reject(new Error('无法连接本地 AI 服务。请确认服务已启动。'))
    })
  })
}
async function saveRecord(result) { await ensureLogin(); return request('/api/records', 'POST', { result }) }
async function getOverview() { await ensureLogin(); return request('/api/overview') }
async function generatePractice(source) { await ensureLogin(); return request('/api/practice/generate', 'POST', { source }) }
async function checkPractice(practice, answer) { await ensureLogin(); return request('/api/practice/check', 'POST', { practice, answer }) }
module.exports = { solveQuestion, ensureLogin, saveRecord, getOverview, generatePractice, checkPractice }
