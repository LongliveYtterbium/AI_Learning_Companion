const { generatePractice, checkPractice } = require('../../utils/api')
const { mathNodes, cleanMarkdown } = require('../../utils/math')
let timer = null
function statusFor(seconds) { return seconds < 5 ? '正在根据原题提取解题方法…' : seconds < 15 ? '正在生成计算量合适的变式题…' : '正在检查题目是否适合练习…' }
function display(practice) { if (!practice) return null; return { ...practice, questionNodes: mathNodes(practice.question), hintNodes: mathNodes(practice.hint), feedbackNodes: mathNodes(practice.feedback), idealAnswerNodes: mathNodes(practice.idealAnswer), knowledgeText: (practice.knowledgePoints || []).map(cleanMarkdown).join(' · ') } }
Page({
  data:{loading:true,elapsed:0,status:'',practice:null,answer:'',checking:false,result:null,error:''},
  onShow(){ if (!this.data.practice) this.loadPractice() },
  onUnload(){ this.stopTimer() },
  startTimer(){this.setData({elapsed:0,status:statusFor(0)});timer=setInterval(()=>{const elapsed=this.data.elapsed+1;this.setData({elapsed,status:statusFor(elapsed)})},1000)},
  stopTimer(){if(timer){clearInterval(timer);timer=null}},
  async loadPractice(){const source=wx.getStorageSync('solutionResult');if(!source){this.setData({loading:false,error:'请先完成一道 AI 解题，再生成针对性练习。'});return}this.setData({loading:true,error:''});this.startTimer();try{const practice=await generatePractice(source);wx.setStorageSync('practiceQuestion',practice);this.setData({practice:display(practice)})}catch(e){this.setData({error:e.message})}finally{this.stopTimer();this.setData({loading:false})}},
  input(e){this.setData({answer:e.detail.value})},
  async submit(){if(!this.data.answer.trim())return wx.showToast({title:'先写下你的答案',icon:'none'});this.setData({checking:true});try{const raw=wx.getStorageSync('practiceQuestion');const result=await checkPractice(raw,this.data.answer);this.setData({result:display(result)})}catch(e){wx.showModal({title:'判题失败',content:e.message,showCancel:false})}finally{this.setData({checking:false})}},
  retry(){this.setData({answer:'',result:null})},
  home(){wx.reLaunch({url:'/pages/index/index'})}
})
