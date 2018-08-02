import { formatTimeStamp } from '../../utils/timeplugin.js'
import AJAX from '../../utils/networkUtil.js';
const app = getApp()
Page({
  data: {
    inputValue: '', // 输入框的内容
    counpItems: [],  // 优惠券的数据
    page_num: 0, // 上拉需要更改的参数
    isShow: false, // 图片是否显示
  },
  onLoad: function () {
    wx.showLoading({
      title: '正在加载中',
    }) 
    this.getCounp()
  },
  /**
   * 获取输入框中的数据
  */
  bindKeyInput: function (e) {
    var name = e.currentTarget.dataset.name;
    this.setData({
      inputValue: e.detail.value.replace(/\s+/g, '')
    })
  },
  getCounp() {
    let that = this
    let data = {
      user_id: app.globalData.userInfo.userId,
      page_num: that.data.page_num
    }
    AJAX('/apiread/coupon/get', data, function (res) {
      wx.hideLoading()
      if (res.error_code === 2000) {
        that.dispostTime(res.data.coupons)
      } else {
        wx.showToast({
          title: res.error_message,
          icon: 'none'
        })
        return
      }
    })
  },
  /**
   * 处理优惠券的数据
   * @counps  优惠券的数据
  */
  dispostTime(counps) {
    let listData = [];
    //格式化有效期时间
    for (let item of counps) {
      let fmInvalidDate = item.endTime;
      if (fmInvalidDate == '4100688000000') {
        fmInvalidDate = '无限期';
      } else {
        fmInvalidDate = formatTimeStamp(fmInvalidDate);
        fmInvalidDate = '有效期：至' + fmInvalidDate.substr(0, 10);
      }
      item.fmInvalidDate = fmInvalidDate
    }
    console.log(counps)
    let page_num = this.data.page_num
    let counpItems = this.data.counpItems
    let disposeCounps = []
    if (page_num == 0) {
      disposeCounps = [].concat(counps);
    } else {
      disposeCounps = counpItems.concat(counps);
    }
    this.setData({
      counpItems: disposeCounps
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    let that = this
    that.data.page_num = 0
    wx.stopPullDownRefresh();
    that.getCounp()
  },
  /**
  * 页面上拉触底事件的处理函数
  */
  onReachBottom: function () {
    this.data.page_num++; //加载下一页
    this.getCounp();
  },
  /**
   * 优惠券绑定
  */
  bindingInfo(event) {
    let that = this
    let data = {
      "order_parking_id": app.globalData.orderInfo.orderId, //停车订单id
      "coupon_id": event.currentTarget.dataset.id, //优惠券id
    }
    AJAX('/apiwrite/coupon/bindOrderParking', data, function (res) {
      if (res.error_code == 2000) {
        app.globalData.couponInfo.couponId = event.currentTarget.dataset.id
        app.globalData.couponInfo.couponNum = event.currentTarget.dataset.amount
        wx.navigateBack({
          delta: 1
        })
      } else {
        wx.showToast({
          title: '绑定优惠券接口错误' + res.data.error_message,
          icon: 'none'
        })
      }
    })
  },
  /**
   * 点击兑换优惠券
  */
  couponExchange() {
    console.log(this.data.inputValue)
    let counpNumber = this.data.inputValue
    if (counpNumber === '' || counpNumber === null || counpNumber === undefined) {
      console.log('这里不做处理');
    } else {
      this.gainCounp()
    }
  },
  gainCounp() {
    let that = this
    let counpNumber = that.data.inputValue
    let data = {
      user_id: app.globalData.userInfo.userId,
      coupon_code: counpNumber
    }
    AJAX('/apiwrite/coupon/exchange', data, function (res) {
      console.log(res);
      if (res.error_code == 2000) {
        that.data.page_num = 0
        that.getCounp()
        that.setData({
          inputValue: ''
        })
        wx.showToast({
          title: '兑换成功',
          icon: 'none'
        })
      } else if (res.error_code == 2502) {
        wx.showToast({
          title: '',
        })
        wx.showToast({
          title: '优惠券已被兑换过',
          icon: 'none'
        })
        return
      } else if (res.error_code == 2217) {
        wx.showToast({
          title: '优惠券码参数错误',
          icon: 'none'
        })
        return
      } else if (res.error_code == 2304 || res.error_code == 2312) {
        wx.showToast({
          title: '没有这个优惠券',
          icon: 'none'
        })
        return
      } else {
        wx.showToast({
          title: res.error_message,
          icon: 'none'
        })
        return
      }

    })
  },
  /**
   * 不使用优惠券的接口
  */
  unbundleCounp() {
    //选择不使用优惠券时，解绑订单关联优惠券
    let data = {
      "order_parking_id": app.globalData.orderInfo.orderId,  //停车订单id
      "coupon_id": -1,  //解绑订单关联优惠券
    }
    AJAX('/apiwrite/coupon/bindOrderParking', data, function (res) {
      if (res.error_code == 2000) {
        app.globalData.couponInfo.couponId = null //当前优惠券Id
        app.globalData.couponInfo.couponNum = null//当前优惠券金额
        wx.navigateBack({
          delta: 1
        })
      } else {
        wx.showToast({
          title: '绑定优惠券接口错误 error_message:' + res.data.error_message,
          icon: 'none'
        })
      }
    })

  }
})