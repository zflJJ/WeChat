//logs.js
import bluetoothUtil from '../../utils/blueTooth.js'
import AJAX from '../../utils/networkUtil.js';
const app = getApp();
const Stomp = require('../../utils/stomp.js').Stomp;
Page({
  data: {
    orderId: '',
    orderContent: {},
    apponintmentTime: '',
    payState: '',
    reserveFee: '0',
    parkingFee: '0',
    countTime: {},
    appointMonery: '',
    parkingMonery: '',
    allMonery: null,
    enterTime: '',
    leaveTime: '',
    overTime: '0',//超时时长
    controlFlag: false,
    showBottomFlag: true,
    unloadFlag: false,
    netBoothTimer: null,
    loading: false,
    shareFlag: true,
    isParking: false,
    boothTimer: null
  },
  webSocketNet() {
    var socketOpen = false
    var socketMsgQueue = []
    function sendSocketMessage(msg) {
      if (socketOpen) {
        wx.sendSocketMessage({
          data: msg
        })
      } else {
        socketMsgQueue.push(msg)
      }
    }
    var ws = {
      send: sendSocketMessage,
      onopen: function(res){
        console.log('onopen',res)
      },
      onmessage: function(res){
        console.log('onmessage',res)
      }
    }
    wx.connectSocket({
      url: 'wss://develop.qhiehome.com/barrier/order/websocket'
    })
    wx.onSocketOpen(function (res) {
      console.log(res);
      socketOpen = true
      for (var i = 0; i < socketMsgQueue.length; i++) {
        sendSocketMessage(socketMsgQueue[i])
      }
      socketMsgQueue = []
      ws.onopen && ws.onopen()
    })
    wx.onSocketMessage(function (res) {
      console.log('收到服务器内容：' + res.data)
    })
    Stomp.setInterval = function () { }
    Stomp.clearInterval = function () { }
    var client = Stomp.over(ws);
    var destination = '/topic/order';
    client.connect({ login: app.globalData.userInfo.userId}, function () {
      client.subscribe(destination, function (msg) {
        console.log('From MQ:', msg);
      });
    })
  },
  onLoad() {
    //this.webSocketNet();
    if (app.globalData.optionType != 'main') {
      wx.setStorageSync('jzmap', 'ok')
    }
  },
  onReady() {
  },
  onHide() {
    let _this = this;
    if (_this.data.boothTimer != null) {
      clearInterval(_this.data.boothTimer);
    } else {
      _this.setData({
        boothTimer: null
      })
    }
  },
  onUnload() {
    let _this = this;
    if (_this.data.boothTimer != null) {
      clearInterval(_this.data.boothTimer);
    } else {
      _this.setData({
        boothTimer: null
      })
    }
  },
  onShow() {
    let _this = this
    if (app.globalData.optionType == 'sharelock') {
      _this.setData({
        shareFlag: false
      })
    }
    _this.setData({
      orderId: app.globalData.orderInfo.orderId,
      unloadFlag: false
    })
    _this.getOrder() //获取订单信息
    //支付信息的初始化
    app.globalData.couponInfo.couponNum = null
    app.globalData.couponInfo.couponId = null
  },
  onHide() {
  },
  onUnload() {
    this.setData({
      unloadFlag: true
    })
    bluetoothUtil.clearboothTimer()//蓝牙倒计时的处理
    if (this.timer) {
      clearInterval(this.timer) // 取消倒计时
    }
  },
  onPullDownRefresh() {
    this.getOrder()
  },
  catchtouchmove() { },
  getOrder() {
    //结束蓝牙
    bluetoothUtil.closeConnection()
    // 获取订单信息
    if (this.data.unloadFlag == false) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
    }
    let _this = this
    let data = {
      "order_id": _this.data.orderId
    }
    AJAX('/apiread/order/reserve/detail/query', data, function (res) {
      console.log(res)
      setTimeout(() => {
        wx.hideLoading();
        wx.stopPullDownRefresh()
      }, 200);
      if (_this.data.unloadFlag) {
        return false;
      }
      if (res.error_code === 2000) {
        _this.handleState(res.data)
      } else {
        _this.showToast(res.error_message)
      }
    }, function () {
      wx.stopPullDownRefresh()
    })
  },
  cancleAppointHaspay() {
    let _this = this;
    if (_this.data.isParking) {
      wx.showToast({
        title: '已经开始停车无法取消预约',
        icon: 'none'
      })
      return false;
    }
    wx.showModal({
      title: '提示',
      confirmText: '保留预约',
      cancelText: '取消预约',
      confirmColor: '#d01c95',
      content: `车位已经为您保留，${_this.data.orderContent.freeCancellationTime}分钟内可免费取消，超过${_this.data.orderContent.freeCancellationTime}分钟不退还预约费。是否确认取消预约？`,
      success: function (res) {
        if (res.confirm) {
          console.log('保留预约')
        } else if (res.cancel) {
          _this.cancleAppointment()
        }
      }
    })
  },
  cancleAppointNopay() {
    let _this = this
    wx.showModal({
      title: '提示',
      confirmText: '保留预约',
      cancelText: '取消预约',
      confirmColor: '#d01c95',
      content: '是否取消预约?',
      success: function (res) {
        if (res.confirm) {
          console.log('保留预约')
        } else if (res.cancel) {
          _this.cancleAppointment()
        }
      }
    })
  },
  cancleAppointment() {
    let _this = this
    //取消预约
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    let data = {
      "order_id": _this.data.orderId
    }
    AJAX('/apiwrite/reserve/cancel', data, function (res) {
      if (res.error_code === 2000 || res.error_code == 2505) {
        _this.showToast('取消预约成功了!')
        //取消预约成功需要进行跳转
        wx.navigateBack({
          delta: 1
        });
      } else {
        _this.showToast(res.error_message)
      }
    })
  },
  goPay() {
    wx.navigateTo({
      url: '../../pages/pay/pay'
    })
  },
  startendParking(event) {
    let _this = this
    let command = event.target.dataset.command
    let str = ''
    let strs = ''
    if (command == '2') {
      str = '车锁降下后开始停车计费，是否确认'
      strs = '车锁正在降下...'
    } else if (command == '1') {
      str = '升起车锁后结束本次停车'
      strs = '车锁正在升起...'
    }
    wx.showModal({
      title: '提示',
      confirmText: '确认',
      cancelText: '取消',
      confirmColor: '#d01c95',
      content: str,
      success: function (res) {
        if (res.confirm) {
          wx.getNetworkType({
            success: function (res) {
              let isConnected = res.networkType //检测网络情况，决定使用方式
              console.log(isConnected)
              // 使用蓝牙
              //isConnected = 'none'
              if (isConnected != 'none' && _this.data.orderContent.lockType === 0) {
                //使用网络
                _this.netWorkBluetooth(command, 3);
              } else {
                wx.showLoading({
                  title: strs,
                  mask: true
                });
                _this.blueTooth(command, 3);
                //监测蓝牙状态
                _this.testBooth();
              }
            }
          })
        } else if (res.cancel) {
          console.log('用户取消操作')
        }
      }
    })
  },
  testBooth() {
    let _this = this;
    if (_this.data.boothTimer != null) {
      clearInterval(_this.data.boothTimer);
    } else {
      _this.setData({
        boothTimer: null
      })
    }
    _this.data.boothTimer = setInterval(() => {
      let isParkingVal = wx.getStorageSync('isParking');
      if (isParkingVal == "isParking") {
        wx.removeStorageSync('isParking');
        clearInterval(_this.data.boothTimer);
        _this.setData({
          boothTimer: null,
          isParking: true
        })
      }
    }, 1500);
  },
  handleState(order) {
    let _this = this
    let apponintmentTime = _this.handelTime(order.startTime) + ' - ' + _this.handelTime(order.endTime)
    let reserveFee = order.reserveFee.toFixed(2);
    _this.setData({
      orderContent: order,
      apponintmentTime: apponintmentTime,
      reserveFee: reserveFee
    })
    if (order.state === 1300) {
      //无需更新订单id传递停车费
      app.globalData.orderInfo.orderMonery = order.payFee //更新停车费
      app.globalData.orderInfo.payType = 'appointfee' //支付类型
    } else if (order.state === 1301) {
      if (order.parkingState != null && order.orderParkingId != null) {
        _this.setData({
          orderId: order.orderParkingId
        })
        app.globalData.orderInfo.orderId = order.orderParkingId
        if (_this.timer) {
          clearInterval(this.timer) // 取消倒计时
        }
        _this.getOrder() //更新订单状态

      } else {
        let appointMonery = _this.factMonery(order, 0) // 处理预约费
        _this.setData({
          appointMonery: appointMonery
        })
        _this.countDown(order) //开始倒计时
      }
    } else if (order.state === 1302) {
      app.globalData.orderInfo.orderId = order.orderId //更新订单id
      //停车中
      //是否显示底部控制车锁按钮
      if (order.lockId === null || order.lockId === '') {
        _this.setData({
          showBottomFlag: false
        })
      }
      let enterTime = _this.handelTime(order.enterTime) //处理入场时间
      let appointMonery = _this.factMonery(order, 0) // 处理预约费
      _this.setData({
        appointMonery: appointMonery,
        enterTime: enterTime
      })
    } else if (order.state === 1303) {
      app.globalData.orderInfo.orderMonery = order.payFee //更新停车费
      app.globalData.orderInfo.payType = 'parkingfee' //支付类型
      app.globalData.orderInfo.orderId = order.orderId //更新订单id
      let allMonery = (order.reserveFee + order.parkingFee + order.overTimeFee).toFixed(2);
      //离场收费
      let enterTime = _this.handelTime(order.enterTime) //处理入场时间
      let leaveTime = _this.handelTime(order.leaveTime) //离场时间
      let overTime = _this.handleOVerTime(order.overTime)
      let appointMonery = _this.factMonery(order, 0) // 处理预约费
      _this.setData({
        appointMonery: appointMonery,
        enterTime: enterTime,
        leaveTime: leaveTime,
        overTime: overTime,
        allMonery: allMonery
      })
    } else if (order.state === 1304) {
      //支付完成
      let enterTime = _this.handelTime(order.enterTime) //处理入场时间
      let leaveTime = _this.handelTime(order.leaveTime) //离场时间
      let overTime = _this.handleOVerTime(order.overTime)
      let appointMonery = _this.factMonery(order, 0) // 处理预约费
      let parkingMonery = _this.factMonery(order, 1)//处理停车费
      let allMonery = (order.reserveFee + order.parkingFee + order.overTimeFee).toFixed(2);
      _this.setData({
        appointMonery: appointMonery,
        parkingMonery: parkingMonery,
        enterTime: enterTime,
        leaveTime: leaveTime,
        showBottomFlag: false,
        overTime: overTime,
        allMonery: allMonery
      })
    } else if (order.state === 1308) {
      _this.setData({
        showBottomFlag: false
      })
    }
  },
  countDown(order) {
    let _this = this
    let lastTime = new Date().getTime() + order.enterCountdownTime
    let countTime = {}
    if (_this.timer) {
      clearInterval(_this.timer)
    }
    _this.timer = setInterval(() => {
      let nowTime = new Date().getTime()
      let len = parseInt((lastTime - nowTime) / 1000)
      if (len >= 0) {
        //处理时间
        let hour = Math.floor(len / 3600)
        countTime.hour = hour < 10 ? '0' + hour : hour
        let miute = Math.floor((len % 3600) / 60)
        countTime.miute = miute < 10 ? '0' + miute : miute
        let seconds = len % 60
        countTime.seconds = seconds < 10 ? '0' + seconds : seconds
        _this.setData({
          countTime: countTime
        })
      } else {
        clearInterval(_this.timer)
        //倒计时结束
        _this.getOrder() //重新拉取订单
      }
    }, 1000)
  },
  factMonery(order, feeType) {
    let _this = this
    let way = ''
    let fee = ''
    let couponFee = ''
    let addStr = ''
    if (feeType == 0) {
      //预约费
      way = order.payChannelReserve
      fee = order.reserveFee
      couponFee = order.reserveCouponFee
    } else if (feeType == 1) {
      way = order.payChannelParking
      fee = order.parkingFee + order.overTimeFee
      couponFee = order.parkingCouponFee
    }
    if (fee == 0) {
      return '￥0.00'
    }
    if (couponFee != null) {
      addStr = '   优惠券：￥' + couponFee
      fee = (fee - couponFee)
    }
    if (way === 1) {
      return '支付宝：￥' + fee + addStr
    } else if (way === 2 || way === 6 || way === 5) {
      return '微信：￥' + fee + addStr
    } else if (way === 3) {
      return '现金：￥' + fee + addStr
    } else if (way === 4) {
      return '优惠券：￥' + couponFee
    }
  },
  handleErr(state) {
    let _this = this
  },
  showBluetooth() {
    let _this = this
    this.setData({
      controlFlag: true
    })
  },
  closeBluetooth() {
    let _this = this
    bluetoothUtil.closeConnection()
    this.setData({
      controlFlag: false
    })
  },
  controlEntrance() {
    // 处理门禁
    bluetoothUtil.closeConnection()
    let _this = this
    let accessList = [..._this.data.orderContent.accessList]
    var name = accessList.map((item) => item.name)
    var btNamesParam = accessList.map((item) => item.btName)
    var btPwdsParam = accessList.map((item) => item.btPwd)
    bluetoothUtil.setParams(btNamesParam, btPwdsParam, true, 1)
    bluetoothUtil.setNames(name);
    bluetoothUtil.showBluetoothList();
  },
  controlCarlock(event) {
    let command = event.target.dataset.command
    let _this = this
    let strs = ''
    if (command == 1) {
      wx.showLoading({
        title: '车锁正在升起...',
      })
    } else {
      wx.showLoading({
        title: '车锁正在降下...'
      })
    }
    wx.getNetworkType({
      success: function (res) {
        let isConnected = res.networkType //检测网络情况，决定使用方式
        // 使用蓝牙
        if (isConnected != 'none' && _this.data.orderContent.lockType === 0) {
          //使用网络
          _this.netWorkBluetooth(command, 0)
        } else {
          _this.blueTooth(command, 0)
        }
      }
    })
  },
  blueTooth(command, type) {
    bluetoothUtil.closeConnection();
    let btName = this.data.orderContent.lockBtName;
    btName = [`${btName}`];
    let btPwds = this.data.orderContent.lockBtPwd;
    btPwds = [`${btPwds}`];
    bluetoothUtil.setParams(btName, btPwds, true, type);
    bluetoothUtil.startConnect(command); //开始连接蓝牙控制蓝牙
  },
  netWorkBluetooth(command, type) {
    let _this = this
    let str = command == 1 ? '正在升起车锁...' : '正在降下车锁...'
    let strs = ''
    if (type == 3 && command == 1) {
      strs = '结束停车'
    } else if (type == 3 && command == 2) {
      strs = '开始停车'
    } else if (command == 1) {
      strs = "升起车锁"
    } else if (command == 2) {
      strs = "降下车锁"
    }
    wx.showLoading({
      title: str,
      mask: true
    })
    wx.request({
      method: 'post',
      url: 'https://www.qhiehome.com/lock/control',
      data: {
        "lock_id": _this.data.orderContent.lockId,
        "command": command, //1升起 2降
        "timestamp": String(new Date().getTime())
      },
      success: res => {
        let data = res.data
        if (data.error_code === 2000) {
          //结束停车成功刷新页面
          if (type == 3 && command == 2) {
            _this.setData({
              isParking: true
            })
          }
          _this.data.netBoothTimer = setTimeout(() => {
            _this.getOrder()
          }, 6000)
        } else {
          _this.showToast(data.error_message)
        }
      },
      fail() {
        _this.showToast('网络出错了,使用蓝牙连接！')
        //这里将会使用蓝牙进行控制
      }
    })
  },
  showToast(str) {
    wx.showToast({
      title: str,
      icon: 'none',
      duration: 2000
    })
  },
  handelTime(time) {
    let date = new Date(time)
    let month = date.getMonth() + 1
    month = month < 10 ? ('0' + month) : month
    let day = date.getDate()
    day = day < 10 ? ('0' + day) : day
    let hour = date.getHours()
    hour = hour < 10 ? ('0' + hour) : hour
    let minutes = date.getMinutes()
    minutes = minutes < 10 ? ('0' + minutes) : minutes
    return month + '-' + day + ' ' + hour + ':' + minutes
  },
  handleOVerTime(time) {
    let len = parseInt(time / 1000)
    let hour = Math.floor(len / 3600)
    hour = hour < 10 ? '0' + hour : hour
    let miute = Math.floor((len % 3600) / 60)
    miute = miute < 10 ? '0' + miute : miute
    let seconds = len % 60
    seconds = seconds < 10 ? '0' + seconds : seconds
    return hour + ':' + miute + ':' + seconds
  },
  goShare() {
    wx.navigateTo({
      url: '../../pages/share/share'
    })
  }
})