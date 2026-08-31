const { solveQuestion, saveRecord } = require('../../utils/api')
let timer = null
function statusFor(seconds) {
  if (seconds < 5) return '正在上传图片并读取题目…'
  if (seconds < 14) return '正在识别文字、图形和已知条件…'
  if (seconds < 28) return '正在整理简洁的分步解答…'
  return '题目较复杂，正在进行最后核对…'
}
Page({data:{imagePath:'',loading:false,elapsed:0,status:''},onShow(){this.setData({imagePath:wx.getStorageSync('questionImagePath')||''})},startTimer(){this.setData({elapsed:0,status:statusFor(0)});timer=setInterval(()=>{const elapsed=this.data.elapsed+1;this.setData({elapsed,status:statusFor(elapsed)})},1000)},stopTimer(){if(timer){clearInterval(timer);timer=null}},onUnload(){this.stopTimer()},next(){const path=this.data.imagePath;if(!path)return wx.showToast({title:'请返回并选择题目图片',icon:'none'});this.setData({loading:true});this.startTimer();wx.getFileSystemManager().readFile({filePath:path,encoding:'base64',success:async r=>{try{const result=await solveQuestion(r.data,path.endsWith('.png')?'image/png':'image/jpeg');wx.setStorageSync('solutionResult',result);saveRecord(result).catch(()=>{});this.stopTimer();wx.navigateTo({url:'/pages/solution/solution'})}catch(e){wx.showModal({title:'识别失败',content:e.message,showCancel:false})}finally{this.stopTimer();this.setData({loading:false})}},fail:()=>{this.stopTimer();this.setData({loading:false});wx.showToast({title:'无法读取图片',icon:'none'})}})}})
