//logs.js
const util = require('../../utils/util.js')
const app = getApp()
Page({
  data: {
    backFlag:true  
  },
  onLoad: function () {
  }
  ,
  onUnload(){
    if (this.data.backFlag){
      wx.navigateBack({
        delta: 3
      })
    }
  }
  ,goApponitment(){
    app.globalData.optionType == 'main';
    this.setData({
      backFlag:false
    })
    wx.navigateBack({
      delta:3
    })
  }
})
