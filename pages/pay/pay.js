//logs.js
const app = getApp();
import AJAX from '../../utils/networkUtil.js';
Page({
  data: {
    couponId: null,
    couponNum: null,
    payMonery: "0.00",
    isHascoupon: false,
    hasselectCouponFlag: false,
    comeFrom: '',
    paySuccess: false,
    loading: false,
    backFlag: true
  },
  onLoad(option) {
    let _this = this;
    //处理订单缓存问题
    app.globalData.couponInfo.couponId = null;
    app.globalData.couponInfo.couponNum = null;
    if (option.from) {
      _this.setData({
        comeFrom: option.from
      })
    }
  },
  onReady() {
    let _this = this
    //查看是否有可用的优惠券
    _this.getCoupon()
  },
  onShow() {
    let _this = this
    //当前是否选择了优惠券
    if (app.globalData.couponInfo.couponId && app.globalData.couponInfo.couponNum) {
      let payMonery = (app.globalData.orderInfo.orderMonery - app.globalData.couponInfo.couponNum).toFixed(2)
      //计算停车费     
      _this.setData({
        hasselectCouponFlag: true,
        couponId: app.globalData.couponInfo.couponId,
        couponNum: app.globalData.couponInfo.couponNum,
        payMonery: payMonery > 0 ? payMonery : '0.00'
      })
    } else {
      _this.setData({
        hasselectCouponFlag: false,
        couponId: app.globalData.couponInfo.couponId,
        couponNum: app.globalData.couponInfo.couponNum,
        payMonery: app.globalData.orderInfo.orderMonery.toFixed(2)
      })
    }
  },
  onHide() {

  },
  onUnload() {
    let _this = this;
    //快速预约都一样
  },
  getPay() {
    let _this = this
    let urlType = '';
    _this.setData({
      loading: true
    })
    console.log(app.globalData.orderInfo.payType)
    if (app.globalData.orderInfo.payType == 'parkingfee') {
      urlType = '/apiwrite/parking/pay'
    } else if (app.globalData.orderInfo.payType == 'appointfee') {
      urlType = '/apiwrite/reserve/pay'
    }
    let parmas = {
      'order_id': app.globalData.orderInfo.orderId,
      'channel': 6,
      'coupon_id': _this.data.couponId,
      'type': 6,
      'openId': app.globalData.userInfo.openId
    }
    AJAX(urlType, parmas, function (data) {
      setTimeout(() => {
        _this.setData({
          loading: false
        })
      }, 2000)
      if (data.error_code === 2000 && data.data.isZero === 1) {
        app.globalData.couponInfo.couponId = null;
        app.globalData.couponInfo.couponNum = null;
        wx.showToast({
          title: '支付成功了...',
        })
        _this.hadlePay()
      } else if (data.error_code === 2000) {
        _this.wxPay(data.data)
      } else if (data.error_code === 2902) {
        wx.showModal({
          title: '提示',
          showCancel: false,
          content: '支付超时，请重新支付',
          success: function (res) {
            if (res.confirm) {
              wx.navigateBack({
                delta: 1
              })
            }
          }
        })
      } else {
        wx.showToast({
          title: data.error_message,
          icon: 'none'
        })
      }
    }, function () {
      setTimeout(() => {
        _this.setData({
          loading: false
        })
      }, 1000)
    }, function () {
      setTimeout(() => {
        _this.setData({
          loading: false
        })
      }, 1000)
    })
  },
  wxPay(data) {
    let _this = this
    wx.requestPayment({
      'timeStamp': data.timeStamp,
      'nonceStr': data.nonceStr,
      'package': 'prepay_id=' + data.prepayId,
      'signType': 'MD5',
      'paySign': data.sign,
      'success': function (res) {
        _this.setData({
          paySuccess: true
        })
        app.globalData.couponInfo.couponId = null;
        app.globalData.couponInfo.couponNum = null;
        _this.hadlePay()
      },
      'fail': function (res) {
        if (res.errMsg == 'requestPayment:fail cancel') {
          wx.showToast({
            title: '支付取消了',
            duration: 2000
          })
        }
      }
    })

  },
  hadlePay() {
    let _this = this;
    if (_this.data.comeFrom == 'appointment') {
      wx.redirectTo({
        url: '../../pages/order/order'
      })
    } else if (app.globalData.orderInfo.payType == 'appointfee') {
      wx.navigateBack({
        delta: 1
      })
    } else if (app.globalData.orderInfo.payType == 'parkingfee') {
      //这里是主流程回到home页面
      wx.navigateTo({
        url: '../../pages/note/note'
      })
    }
  },
  getCoupon() {
    let _this = this
    let params = {
      "user_id": app.globalData.userInfo.userId,
      "page_num": 0
    }
    AJAX('/apiread/coupon/get', params, function (data) {
      console.log(data)
      if (data.error_code === 2000) {
        if (data.data.coupons.length > 0) {
          _this.setData({
            isHascoupon: true
          })
        }
      }
    })
  },
  goCoupon() {
    let _this = this;
    //新老用户均可以跳转到优惠券页面
    wx.navigateTo({
      url: '../../pages/coupon/coupon'
    })
  }
})