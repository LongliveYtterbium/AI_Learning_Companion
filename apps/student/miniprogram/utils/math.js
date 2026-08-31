const { renderMathInText } = require('@rojer/katex-mini')

function cleanMarkdown(value) {
  return String(value || '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\\\((.*?)\\\)/g, '$$$1$')
    .replace(/\\\[(.*?)\\\]/gs, '$$$$$1$$')
}
function mathNodes(value) {
  const text = cleanMarkdown(value)
  try {
    return renderMathInText(text, { throwError: false, delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }] })
  } catch (_) { return text }
}
module.exports = { cleanMarkdown, mathNodes }
