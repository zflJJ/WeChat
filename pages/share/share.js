const app = getApp()
Page({
  data: {
    
  },
  onLoad: function () {
    
  },
  onReady() {

  },
  onShow() {

  },
  onHide() {

  } 
  ,onShareAppMessage(options){
    console.log(options)
    return {
      title: '亲，我为你预约了一个车位。车位钥匙在这里哦。',
      imageUrl:'/assets/icon/share.png',
      path: '/pages/index/index?shareOrderId=' + app.globalData.orderInfo.orderId
    }
  }
})