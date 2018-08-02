import api from '../../utils/api.js';
const app = getApp();
Page({
  data: {
    headSrc:"/assets/icon/img_default_avatar.png",
    userName:'登录/注册',
    ajaxGetUserInfo:null,
    isLoginFlag:false,
    couponCount:null
  },
  onLoad: function () {
    
  },
  onReady(){

  },
  onShow(){
    let _this=this;
    _this._getUserInfo();//获取用户信息
  },
  onHide(){
  },
  onUnload(){
  },
  _getUserInfo(){
    let _this=this;
    if (app.globalData.userInfo.userId==null){
      return false;
    }
    let data={
      'user_id': app.globalData.userInfo.userId,
      "timestamp": String(new Date().getTime())
    }
    _this.data.ajaxGetUserInfo=wx.request({
      url: api.url + '/apiread/user/info/get',
      data: data,
      method: 'post',
      header: { "content-Type": "application/json" },
      success:function(res){
        let data=res.data;
        if (data.error_code==2000){
          _this._handleUserInfo(data.data)
        }
      },
      fail(err){

      }
    })
  },
  _handleUserInfo(data){
    let _this=this;
    if (data.avatarPath!=null){
      _this.setData({
        headSrc: data.avatarPath
      })
    }
  }
})
