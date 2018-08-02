//logs.js
const app = getApp();
const isTest=false;
Page({
  data: {
    authSetting:false,
    timer:null,
    macId:null,
    parklotDistrictId:null
  },
  onReady: function (e) {
    let  context = wx.createCanvasContext('firstCanvas');
    let i=0;
    let imgSrc = '';
    this.data.timer=setInterval(()=>{
      if(i<=9){
        imgSrc = '/assets/icon/pullDrawlmage'+i+'@2x.png';
        i++;
      }else{
        i=0;
        imgSrc ='/assets/icon/pullDrawlmage0@2x.png';
      }
      context.clearRect(0, 0, 80, 104);
      context.drawImage(imgSrc, 0, 0, 80, 104);
      context.draw();
    },100);
  },
  onUnload:function(){
    clearInterval(this.data.timer);
    this.data.timer=null;
  },
  onLoad: function (option) {
    let _this=this;
    if (option.parklotDistrictId) {
      app.globalData.optionType = 'fastparkingarea';//约片区
      _this.setData({
        parklotDistrictId: option.parklotDistrictId
      })
    }else if (option.parklotId){
      app.globalData.parkingInfo.parkingId=option.parklotId;
      app.globalData.optionType ='fastparkinglot';//约车场
    } else if (option.shareOrderId){
      app.globalData.orderInfo.orderId = option.shareOrderId;
      app.globalData.optionType = 'sharelock';//分享钥匙
    } else if (option.macId){
      _this.setData({
        macId: option.macId
      });
      app.globalData.optionType = 'fastparkinglock';//约车锁
    }
    _this.testAuthorize();
  },
  onGotUserInfo(e){
    this.getCode()
  },
  testAuthorize(){
    let _this=this
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo']) {
          if (isTest){
            _this.setData({
              authSetting: true
            })
          }else{
            _this.getCode();
          }
        }else{
          _this.getCode();
        }
      }
    })
  },
  getCode() {
    let _this=this;
    wx.login({
      success: function (res) {
        if (res.code) {
          _this.getSession(res.code);
        }
      },fail(err){
       _this.getCode()
      }
    });
  },
  getSession(code) {
    let _this = this;
    let data = {
      "code": code,
      "appId": app.globalData.appInfo.appId,
      "secret": app.globalData.appInfo.serect,
      "timestamp": String(new Date().getTime())
    }
    wx.request({
      method: 'POST',
      url: 'https://www.qhiehome.com/apiwrite/wechat/getSeesionKey',
      data: data,
      success: res => {
        let data = res.data;
        if (data.error_code == 2000) {
          let session_key = data.data.session_key;
          _this.getUserInfo(session_key)
        } else {
          _this.getCode();
        }
      },
      fail() {
        _this.getCode();
      }
    })
  },
  getUserInfo(session_key) {
    let _this = this;
    wx.getUserInfo({
      success: res => {
        if (res.errMsg == "getUserInfo:ok") {
          let encryptedData = res.encryptedData;
          let iv = res.iv;
          let sessionKey = session_key
          _this.getLogin(encryptedData, iv, sessionKey)
        }
      },
      fail(err){
        wx.showModal({
          title: '亲,您好',
          content: '未授权状态将不能使用小程序',
          cancelText:'残忍拒绝',
          confirmText:'确认授权',
          success: function (res) {
            if (res.confirm) {
              _this.getCode();
            } else if (res.cancel) {
              //用户不授权将无法使用
            }
          }
        })
      }
    })
  },
  getLogin(encryptedData, iv, sessionKey) {
    let _this = this;
    let parm = {
      "encryptedData": encryptedData,
      "iv": iv,
      "sessionKey": sessionKey,
      "timestamp": String(new Date().getTime())
    }
    if(_this.data.macId){
      parm.macId= _this.data.macId;
    } else if (_this.data.parklotDistrictId){
      parm.parklotDistrictId = _this.data.parklotDistrictId
    }
    wx.request({
      method: 'POST',
      url: 'https://www.qhiehome.com/apiwrite/wechat/small/routine/author',
      data: parm,
      success: res => {
        let data = res.data;
        if (data.error_code == 2000) {
          _this.handleLogin(data.data);
        } else {
          _this.getCode();
        }
      },
      fail(err) {
        _this.getCode();
      }
    })
  },
  handleLogin(data) {
    let _this = this;
    app.globalData.userInfo.unionId = data.unionId;
    app.globalData.userInfo.openId = data.openId;
    app.globalData.userInfo.userId = data.userId;
    app.globalData.userInfo.userPhone = data.userPhone;
    if (app.globalData.optionType == 'fastparkinglot' || app.globalData.optionType == 'fastparkinglock' || app.globalData.optionType == 'fastparkingarea'){
      if (data.orderParkingLockData != null) {
        //扫码预约约车场或者约车位时间使用
        app.globalData.orderInfo.orderId = data.orderParkingLockData.orderId;
      }else{
        app.globalData.orderInfo.orderId = null;
      }
      if (app.globalData.optionType == 'fastparkinglock'){
        app.globalData.parkingInfo.parkingId = data.parkLotId;//车场Id
        app.globalData.parkingInfo.parklocId = data.parklocId;//车位Id
      } else if (app.globalData.optionType == 'fastparkingarea'){
        app.globalData.parkingInfo.parkingId = data.parkLotId;
        app.globalData.parkingInfo.areaId = data.parklotDistrictId;
      }
      if (app.globalData.userInfo.userId==null){
        wx.reLaunch({
          url: '../../pages/login/login',
        })
      }else{
        wx.reLaunch({
          url: '../../pages/map/map',
        })
      }
    }else if (app.globalData.optionType=='main'){
      wx.reLaunch({
        url: '../../pages/map/map',
      })
    } else if (app.globalData.optionType == 'sharelock'){      
      if (app.globalData.userInfo.userId == null) {
        wx.reLaunch({
          url: '../../pages/login/login',
        })
      } else if (app.globalData.orderInfo.orderId != null) {
        wx.reLaunch({
          url: '../../pages/map/map',
        })
      }
    }
  }
})
