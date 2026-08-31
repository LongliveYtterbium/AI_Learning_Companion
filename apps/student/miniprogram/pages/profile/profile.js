const { getOverview } = require('../../utils/api')
const { cleanMarkdown, mathNodes } = require('../../utils/math')
function display(overview) {
  if (!overview) return overview
  return { ...overview, recent: (overview.recent || []).map(item => ({ ...item, problemNodes: mathNodes(item.problem), knowledgeText: cleanMarkdown(item.knowledgeText) })) }
}
Page({data:{loading:true,overview:null,error:''},async onShow(){this.setData({loading:true,error:''});try{this.setData({overview:display(await getOverview())})}catch(e){this.setData({error:e.message})}finally{this.setData({loading:false})}}})
