const { cleanMarkdown, mathNodes } = require('../../utils/math')

function displayResult(raw) {
  if (!raw) return null
  return {
    ...raw,
    knowledgeText: (raw.knowledgePoints || []).map(cleanMarkdown).join(' · '),
    problemNodes: mathNodes(raw.problem),
    answerNodes: mathNodes(raw.answer),
    mistakeNodes: mathNodes(raw.commonMistake),
    steps: (raw.steps || []).map(step => ({ title: cleanMarkdown(step.title), contentNodes: mathNodes(step.content) }))
  }
}
Page({ data:{tab:'answer',result:null}, onShow(){this.setData({result:displayResult(wx.getStorageSync('solutionResult'))})}, tab(e){this.setData({tab:e.currentTarget.dataset.tab})}, practice(){wx.navigateTo({url:'/pages/practice/practice'})} })
