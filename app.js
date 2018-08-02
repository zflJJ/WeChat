//app.js
App({
  onLaunch: function (options) {
    let _this = this
    //获取用户当前登录状态基于unionid机制 
    //获取系统信息
    _this.getSystemInfo();
    _this.globalData.cjz = options
  },
  
  globalData: {
    appInfo: {
      appId: 'wxedfa413d94a364a4', //小程序openID
      serect: 'a4ee0dd3d5e3efa1beff3f880f6837e6' //小程序秘钥
    },
    userInfo: {
      userId: null,//183
      openId: null,//null
      unionId: null,//"oGF3N1N-HjiI22Zxz9UBmZtATOzU"
      userPhone: null//"userPhone"
    },
    orderInfo: {
      orderId:null, //订单Id
      orderMonery: null, //当前订单的支付金额
      payType: null //支付类型appoinfee parkingfee
    },
    couponInfo: {
      couponId: null, //当前使用优惠券Id
      couponNum: null //当前使用优惠券的金额
    },
    plateInfo: {
      plateId: null, //当前使用车牌Id
      plateNum: null //当前使用车牌号码
    },
    screenInfo: {
      screenwidth: 0,
      screenHeight: 0
    },
    system: {
      model: '',
      phoneType: ''
    },
    parkingInfo: {
      parkingId: '',
      lat: '',
      lng: '',
      lats:'',
      lngs:'',
      parklocId:null,//车位Id
      areaId:null//区域Id
    },
    optionType: 'main', //主流程fastparkinglot fastparkinglock sharelock fastparkingarea分享出来的钥匙不能再次分享
    fastorderInfo:{
      orderId: null, //扫码预约车锁期间，需要判断当前是否有订单
      orderState:null//扫码预约当前存在订单的状态
    },
    cjz:0
  },
  getSystemInfo: function () {
    let res = wx.getSystemInfoSync();
    this.globalData.system.model = res.model;
    let systemStr = res.system.toString();
    if (systemStr.match(/ios/i) != null) {
      this.globalData.system.phoneType = 'iOS';
    } else if (systemStr.match(/android/i) != null) {
      this.globalData.system.phoneType = 'Android';
    } else {
      this.globalData.system.phoneType = 'other';
    }
    this.globalData.screenInfo = {
      screenWidth: res.windowWidth,
      screenHeight: res.windowHeight
    }
  }
})