const app = getApp()
import {
  filteTime,
  disposeTime,
  dataChange
} from '../../utils/disposetime.js';
import {
  formatTimeStamp
} from '../../utils/timeplugin.js';
import AJAX from '../../utils/networkUtil.js';
Page({
  data: {
    responseData: null, //服务器返回车场信息
    plateId: null, //默认车牌Id
    plateNo: null, //默认车牌号
    nowTime: null, // 当前的系统时间
    multiArray: [], // 需要转换成模样
    multiIndex: [0, 0], // 选择后的数据下标
    miuntes: [], // 时间段的设置
    timestamps: [], // 选择之后的时间戳
    stopTime: null, // 离场时间
    feeprice: null, //预约费用
    reserveTimeList: [], // 选择的时间端
    feeList: [], // 价格选择器
    leaveTime: '00月00日00时00分', // 离场时间
    times: null, // 选择的入场时间
    price: '0.00', // 价格
    params: {
      share_startTime: 123123111,
      share_endTime: 123123111,
      start_time: 123123111,
      end_time: 1232131231,
    },
    loading: false
  },

  onLoad: function() {


    if (app.globalData.optionType != 'main') {
      wx.setStorageSync('jzmap', 'ok');
    }
    this.timeToget()
    this.getParkLotInfo();
    wx.showLoading({
      title: '正在加载中',
      mask: true
    })
  },
  onUnload: function() {
    //回退到达地图页
  },
  onShow() {
    let _this = this
    //处理更换车辆问题
    if (app.globalData.plateInfo.plateId && app.globalData.plateInfo.plateNum) {
      _this.setData({
        plateId: app.globalData.plateInfo.plateId,
        plateNo: app.globalData.plateInfo.plateNum
      })
    }
  },
  addCar() {
    wx.navigateTo({
      url: '../../pages/platelist/platelist'
    })
  },
  /**
   * 获取当前的系统时间
   */
  timeToget: function() {
    let time = Number(new Date().getTime()) + 900000;
    let that = this;
    that.nowTime = time
    that.setData({
      nowTime: time
    })
  },
  /**
   * 初始化停车场信息
   */
  getParkLotInfo: function() {
    var that = this;
    let data = {
      // user_id: app.globalData.userInfo.userId,
      user_id: 30,
      parklot_id:11
      // parklot_id: app.globalData.parkingInfo.parkingId
    }
    if (app.globalData.optionType == 'fastparkinglock') {
      data.parkloc_id = app.globalData.parkingInfo.parklocId;
    } else if (app.globalData.optionType == 'fastparkingarea') {
      data.district_id = app.globalData.parkingInfo.areaId;
    }
    AJAX('/apiread/parklot/reserve/enter', data, function(res) {
      if (res.error_code == 2000) {
        if (app.globalData.optionType != 'main' && res.data.orderId) {
          app.globalData.orderInfo.orderId = res.data.orderId;
          wx.redirectTo({
            url: '../../pages/order/order',
          })
        } else if (res.data.reservableAmount == 0) {
          wx.showModal({
            title: '提示',
            content: '车位已经被约满了',
            showCancel: false,
            confirmColor: '#d01c95',
            confirmText: '确认',
            success: function (res) {
              wx.navigateBack({
                delta: 1
              })
            }
          })
          wx.hideLoading()
          return
        }
        that.setData({
          responseData: res.data,
          plateNo: res.data.plateNo,
          plateId: res.data.plateId,
          platelotId: res.data.parklotId,
          reserveTimeList: res.data.reserveTimeList,
          feeList: res.data.feeList
        });
        if (that.data.responseData.reserveTimeList.length === 0) {
          wx.hideLoading()
          return;
        }
        const timeList = filteTime(that.data.responseData.reserveTimeList, that.data.nowTime)
        const getData = disposeTime([...timeList])
        const timeData = dataChange([...getData], that.data.nowTime)
        let timeArray = []
        timeArray.push(timeData.hours)
        timeArray.push(timeData.miuntes[0])
        that.setData({
          multiArray: timeArray,
          miuntes: timeData.miuntes,
          timestamps: timeData.timestamps,
          times: timeData.timestamps[0][0]
        })
        let priceTime = timeData.timestamps[0][0] - new Date().getTime()
        that.getPrice(priceTime)
        that.getDefaultTime(timeData.timestamps[0][0])
      } else if (res.error_code == 2909 || res.error_code == 2910) {
        //当前区域无可预约车位
        wx.showModal({
          title: '提示',
          content: '该区域车位已经被约满了，是否需要其它区域的车位？',
          cancelText: '取消',
          confirmText: '确定',
          confirmColor: '#d01c95',
          success: function(res) {
            if (res.confirm) {
              app.globalData.optionType = 'main';
              that.getParkLotInfo();
            } else if (res.cancel) {
              wx.navigateBack({
                delta: 1
              })
            }
          }
        })

      }
      wx.hideLoading();
    });
  },
  /**
   * 时间选择点击确定的时候
   */
  bindMultiPickerChange: function(e) {
    this.setData({
      multiIndex: e.detail.value
    })
  },
  /**
   * 下拉菜单列发生改变的时候
   */

  bindMultiPickerColumnChange: function(e) {
    var data = {
      multiArray: this.data.multiArray,
      multiIndex: this.data.multiIndex
    };
    data.multiIndex[e.detail.column] = e.detail.value;
    // 取到改变的行，然后拿到对应行的数据   这里还要处理对应的数据
    if (e.detail.column == 0) {
      data.multiArray[1] = this.data.miuntes[e.detail.value]
      data.multiIndex[1] = 0;
    }
    let times = this.data.timestamps[data.multiIndex[0]][data.multiIndex[1]]
    this.times = times
    this.setData({
      times: times
    })
    let priceTime = times - new Date().getTime()
    this.getPrice(priceTime)
    this.getDefaultTime(times)
    this.setData(data);
  },

  // 默认的离场时间  (通过这里可以将 预约车位的时间选择可以处理完成)
  getDefaultTime(time) {
    var timetap = time
    let numLeaveTime = []
    // 筛出离场时间
    let params = {
      share_startTime: null,
      start_time: null,
      share_endTime: null,
      end_time: null
    }
    for (let i = 0, len = this.data.reserveTimeList.length; i < len; i++) {
      if (
        this.data.reserveTimeList[i].startTime <= timetap &&
        timetap <= this.data.reserveTimeList[i].endTime - 900000
      ) {
        numLeaveTime.push({
          learve: this.data.reserveTimeList[i],
          times: this.data.reserveTimeList[i].endTime - timetap
        })
      }
    }
    if (numLeaveTime.length === 1) {
      params.share_startTime = numLeaveTime[0].learve.startTime
      params.share_endTime = params.end_time = numLeaveTime[0].learve.endTime
      params.start_time = timetap
      let leaveTime = formatTimeStamp(numLeaveTime[0].learve.endTime)
      let leaveMonth = leaveTime.substr(5, 2)
      let leaveDay = leaveTime.substr(8, 2)
      let leaveMiunte = leaveTime.substr(14, 2)
      let leaveHours = leaveTime.substr(11, 2)
      leaveTime = leaveMonth + '月' + leaveDay + '日' + leaveHours + '时' + leaveMiunte + '分'
      params = Object.assign({}, this.data.params, params);
      this.setData({
        leaveTime: leaveTime,
        params: params
      })
    } else {
      var max = numLeaveTime[0].times
      var len = numLeaveTime.length
      let obj = numLeaveTime[0]
      for (let i = 1; i < len; i++) {
        if (numLeaveTime[i].times > max) {
          max = numLeaveTime[i].times
          obj = numLeaveTime[i]
        }
      }
      let leaveTime = formatTimeStamp(obj.learve.endTime)
      let leaveMonth = leaveTime.substr(5, 2)
      let leaveDay = leaveTime.substr(8, 2)
      let leaveMiunte = leaveTime.substr(14, 2)
      let leaveHours = leaveTime.substr(11, 2)
      leaveTime = leaveMonth + '月' + leaveDay + '日' + leaveHours + '时' + leaveMiunte + '分'
      params.share_startTime = obj.learve.startTime
      params.share_endTime = params.end_time = obj.learve.endTime
      params.start_time = timetap
      params = Object.assign({}, this.data.params, params);
      this.setData({
        leaveTime: leaveTime,
        params: params
      })
    }
  },
  // 获取价格信息 
  getPrice(priceTime) {
    let x = null
    let miunte = parseInt(priceTime / 60000)
    for (var i = 0, len = this.data.feeList.length; i < len; i++) {
      if (miunte <= this.data.feeList[i].finishTime) {
        x = i
        break
      } else {
        continue
      }
    }
    if (i === this.data.feeList.length) {
      x = i - 1
    }
    if (this.data.feeList[x]) {
      let price = (
        this.data.feeList[x].fee * this.data.responseData.integralPermissionsCoefficient
      ).toFixed(2)
      this.setData({
        price: price
      })
    }
  },
  // 预约车位
  bookingSpace(e) {
    let that = this
    if (that.data.plateId == null || that.data.plateId == '') {
      wx.showToast({
        title: '请添加入场车辆',
        icon: 'none'
      })
      return;
    } else if (that.data.times < new Date().getTime()) {
      wx.showToast({
        title: '入场时间已过，请重新选择',
        icon: 'none'
      })
      return;
    }
    that.setData({
      loading: true
    })
    // 新加 用来判断是否是立即入场
    if (that.data.multiIndex[0] == 0 && that.data.multiIndex[1] == 0){
      that.data.params.setDataisImmediatelyEnter = 1
    }
    console.log(that.data.params)
    let data = Object.assign({}, that.data.params, {
      user_id: app.globalData.userInfo.userId,
      parklot_id: app.globalData.parkingInfo.parkingId,
      plate_id: that.data.plateId
    });
    if (app.globalData.optionType == 'fastparkinglock') {
      data.parkloc_id = app.globalData.parkingInfo.parklocId;
    } else if (app.globalData.optionType == 'fastparkingarea') {
      data.district_id = app.globalData.parkingInfo.areaId;
    }
    console.log(data)
    return;
    AJAX('/apiwrite/reserve/confirm', data, function(res) {
      that.setData({
        loading: false
      })
      if (res.error_code === 2000) {
        if (res.data.totalFee == 0) {
          that.navigateToOrderDetail(res.data.orderId);
        } else {
          //跳转详情页面
          app.globalData.orderInfo.orderId = res.data.orderId //当前订单id
          app.globalData.orderInfo.orderMonery = res.data.totalFee //支付金额
          app.globalData.orderInfo.payType = 'appointfee' //支付金额
          wx.redirectTo({
            url: '../../pages/pay/pay?from=appointment'
          })
        }
      } else if (res.error_code == 2905 && app.globalData.optionType == 'fastparkingarea') {
        //当前区域无可预约车位
        wx.showModal({
          title: '提示',
          content: '该区域车位已经被约满了，是否需要其它区域的车位？',
          cancelText: '取消',
          confirmText: '确定',
          confirmColor: '#d01c95',
          success: function(res) {
            if (res.confirm) {
              app.globalData.optionType = 'main';
              that.getParkLotInfo();
            } else if (res.cancel) {
              wx.navigateBack({
                delta: 1
              })
            }
          }
        })
      } else {
        that.errorMessage(res)
      }

    }, function() {
      that.setData({
        loading: false
      })
    }, function() {
      setTimeout(() => {
        that.setData({
          loading: false
        })
      }, 1000)
    })
  },
  /**
   * 支付费用totalFee == 0
   * @orderId  订单ID
   */
  navigateToOrderDetail(orderId) {
    var url = 'apiwrite/reserve/pay';
    // 支付费用为0的时候
    var data = {
      order_id: orderId,
      channel: 2,
      'type': 6
    }
    AJAX('/apiwrite/reserve/pay', data, function(res) {
      if (res.error_code === 2000) {
        app.globalData.orderInfo.orderId = orderId //当前orderid
        //支付成功后跳转
        wx.showToast({
          title: '预约成功了',
          duration: 2000
        })
        wx.redirectTo({
          url: '../../pages/order/order',
        })
      } else {
        wx.showToast({
          title: '预约失败，请重新预约',
          icon: 'none'
        })
      }
    })
  },
  errorMessage(res) {
    switch (res.error_code) {
      case 2904:
        wx.showToast({
          title: '该车辆已存在预约订单',
          icon: 'none'
        })
        break;
      case 2900:
        wx.showToast({
          title: '您还有订单未完成',
          icon: 'none'
        })
        break;
      case 2801:
        wx.showToast({
          title: '入场时间已过，请重新选择。',
          icon: 'none'
        })
        break;
      case 2905:
        wx.showModal({
          title: '提示',
          content: '车位已经被约满了',
          showCancel: false,
          confirmColor: '#d01c95',
          confirmText: '确认',
          success: function(res) {
            wx.navigateBack({
              delta: 1
            })
          }
        })
        break;
      case 2906:
        wx.showToast({
          title: '您暂无预约资格，请联系物业管理员.',
          icon: 'none'
        })
        break
      default:
        wx.showToast({
          title: res.error_message,
          icon: 'none'
        })
        break;
    }
  }
})