const app = getApp();
import AJAX from '../../utils/networkUtil.js';
Page({
  data: {
    clearFlag: false,
    phoneNum: '',
    codeNum: '',
    codeBack: null,
    isGettingCodes: false,
    countNum: 60,
    loading: false,
    comeFrom:''

  },
  onLoad: function (option) {
    let _this=this
    if(option.from){
      _this.setData({
        comeFrom: option.from
      })
    }
  },
  onReady() {

  },
  onShow() {

  },
  onHide() {

  },
  phoneInput(event) {
    let _this = this
    let phoneNum = event.detail.value
    let phoneLen = event.detail.cursor
    if (phoneLen) {
      _this.setData({
        clearFlag: true,
        phoneNum: phoneNum
      })
    } else {
      _this.setData({
        clearFlag: false,
        phoneNum: phoneNum
      })
    }
  },
  codeInput(event) {
    let _this = this
    let codeNum = event.detail.value
    _this.setData({
      codeNum: codeNum
    })
  },
  clearInput() {
    let _this = this
    _this.setData({
      phoneNum: '',
      clearFlag: false
    })
  },
  testPhone() {
    let _this = this
    if (this.data.isGettingCodes) {
      return false
    } else if (!/^[1][3,4,5,7,8][0-9]{9}$/.test(this.data.phoneNum.trim())) {
      _this.showToast('请输入正确的手机号码')
      return false
    }
    _this.setData({
      isGettingCodes: true
    })
    _this.countDown()
    _this.getCode()
  },
  countDown() {
    let _this = this
    let createTime = new Date().getTime()
    _this.timer = setInterval(() => {
      let nowTime = new Date().getTime()
      let len = parseInt((nowTime - createTime) / 1000)
      if (len >= 60) {
        clearInterval(_this.timer)
        _this.setData({
          isGettingCodes: false,
          countNum: 60
        })
      } else {
        _this.setData({
          countNum: 60 - len
        })
      }
    }, 1000)
  },
  getCode() {
    let _this = this
    let data={
      phone: this.data.phoneNum,
      anti: 1
    }
    AJAX('/apiwrite/system/verification/code/get',data,function(res){
      if (res.error_code === 2000) {
        _this.setData({
          codeBack: res.data.code
        })
      } else if (res.code === 2004) {
        _this.showToast('获取验证码次数过于频繁')
      } else if (res.code === 2101) {
        _this.showToast('手机号码错误')
      } else if (res.code === 2200) {
        _this.showToast('获取验证码的传入参数错误')
      } else {
        _this.showToast(res.error_message)
      }
    })
   
  },
  goLogin() {
    let _this = this
    let data={
      phone: _this.data.phoneNum,
      jpush_id: 'wechat app',
      unionId: app.globalData.userInfo.unionId,
      openId: app.globalData.userInfo.openId,
      identification:'xhx',
      phoneModel: app.globalData.system.model
    }
    AJAX('/apiwrite/user/login',data,function(res){
      console.log(res)
      setTimeout(function () {
        _this.setData({
          loading: false
        })
      }, 1000)
      if (res.error_code === 2000) {
        console.log(res);
        app.globalData.userInfo.userId = res.data.user.id//更新userid，成为登录
        app.globalData.userInfo.userPhone = _this.data.phoneNum//存取手机号
        _this.handleGoto();
      } else {
        _this.showToast(res.error_message)
      }
    },function(){
      _this.setData({
        loading: false
      })
    })
  },
  handleGoto(){
    if(this.data.comeFrom=='map'){
      wx.redirectTo({
        url: '../../pages/appointment/appointment'
      })
    } else if (app.globalData.optionType == 'fastparkinglot' || app.globalData.optionType == 'fastparkinglock' || app.globalData.optionType == 'fastparkingarea'){
      wx.reLaunch({
        url: '../../pages/map/map'
      })
    } else if (app.globalData.optionType == 'sharelock'){
      wx.reLaunch({
        url: '../../pages/map/map'
      })
    }
  },
  phoneLogin() {
    let _this = this
    let codeNum = _this.data.codeNum
    let phoneNum = _this.data.phoneNum
    let codeBack = _this.data.codeBack
    if (!/^[1][3,4,5,7,8][0-9]{9}$/.test(this.data.phoneNum.trim())) {
      _this.showToast('请输入正确的手机号码')
      return false
    } else if (codeNum === '' || codeNum.length != 4 || codeBack != codeNum) {
      _this.showToast('请输入正确验证码')
      return false
    } else {
      _this.setData({
        loading: true
      })
      _this.goLogin()
    }
  },
  showToast(str) {
    wx.showToast({
      title: str,
      icon: 'none',
      duration: 2000
    })
  }
})