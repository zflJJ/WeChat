//index.js
//获取应用实例
const app = getApp()
import AJAX from '../../utils/networkUtil.js';
//深圳同方信息港经纬度，方便模拟
const FAKELAT = 22.554837
const FAKELNG = 113.949039
//地图比例尺
const MAP_MAX_SCALE = 18
const MAP_MIN_SCALE = 12
//地图控件
import mapControls from './controls.js'
let test = false;
Page({
  data: {
    currentLat: "",
    currentLng: "",
    mapLat: "",
    mapLng: "",
    lastPosition: {
      lat: null,
      lng: null
    },
    mapScale: 17,
    mapHieght: '100%',
    parkingList: [],
    newArrary: {}, //处理后的数组对象
    currentParkingIndex: 0, //当前车场编号
    markerType: 0, //0默认车牌1价格
    markers: [],
    polyline: [],
    controls: [mapControls.currentPositionControl, mapControls.carControl, mapControls.refreshControl],
    cardStyle: {
      opacity: 1,
      display: 'block'
    },
    moveWrapPosition: 'bottom', //默认bottom center top
    tabCurrentIndex: 0,
    scrollFlag: false,
    isontheTop: true,
    noteMessage: '',
    noteShowFlag: false,
    navationFlag:true,
    hideFlag:false,
    nowOrderId:null
  },
  onLoad() {
    let _this = this
    if (app.globalData.optionType == 'fastparkinglot' || app.globalData.optionType == 'fastparkinglock' || app.globalData.optionType == 'fastparkingarea') {
      if (app.globalData.orderInfo.orderId != null) {
        wx.navigateTo({
          url: '../../pages/order/order'
        })
      } else {
        wx.navigateTo({
          url: '../../pages/appointment/appointment'
        })
      }
    } else if (app.globalData.optionType == "sharelock"){
      wx.navigateTo({
        url: '../../pages/order/order'
      })
    }
    //获取当前地理位置授权
    if (app.globalData.optionType =='main'){
     _this.getCurrentPosition();
     }
  },
  onShow() {
    if (wx.getStorageSync('jzmap')=='ok'){
      app.globalData.optionType = 'main';
      wx.removeStorageSync('jzmap');
      this.getCurrentPosition();
    }
    if (app.globalData.optionType == 'main'){
      this.getNowOrder();
    }
    let _this = this;
    _this.setData({
      navationFlag: true,
      hideFlag:false
    })
  },
  onHide(){
    let _this=this;
    _this.setData({
      hideFlag:true
    })
  },
  getSystemInfo: function() {
    let res = wx.getSystemInfoSync();
    app.globalData.screenInfo = {
      screenWidth: res.windowWidth,
      screenHeight: res.windowHeight
    }
  },
  getCurrentPosition() {
    let _this = this
    wx.getSetting({
      success: function(res) {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: function() {
              _this.getPosition()
            }
          })
        } else {
          _this.getPosition()
        }
      }
    })
  },
  getPosition() {
    let _this = this
    if(_this.data.hideFlag==false){
      wx.showLoading({
        title: '获取当前位置',
        mask: true
      })
    }
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        let latitude = res.latitude
        let longitude = res.longitude
        if (latitude && longitude) {
          //这里是为了测试使用，电脑定位不准确
          _this.setData({
            currentLat: test ? FAKELAT : latitude,
            currentLng: test ? FAKELNG : longitude,
            mapLat: test ? FAKELAT : latitude,
            mapLng: test ? FAKELNG : longitude
          })
          _this.setData({
            mapScale: 17
          })
          _this.getnearPark()
        }
      }
    })
  },
  getnearPark() {
    if(this.data.hideFlag==false){
      wx.showLoading({
        title: '获取附近停车场...',
        mask: true
      })
    }
    let _this = this
    let data = {
      "map": {
        "lat": _this.data.mapLat,
        "lng": _this.data.mapLng
      },
      "locate": {
        "lat": _this.data.currentLat,
        "lng": _this.data.currentLng
      },
      "radius": 500
    }
    AJAX('/apiread/parklot/nearby', data, function(data) {
      if (data.error_code == 2000) {
        let parkingList = data.data.parklots;
        if (parkingList.length == 0) {
          wx.hideLoading();
          return false;
        }
        let newArrary = mapControls.hadleArrary(parkingList);
        _this.setData({
          parkingList: parkingList,
          currentParkingIndex: 0,
          newArrary: newArrary,
          tabCurrentIndex: 0
        })
        //处理上一次成功取得停车场的地方
        _this.data.lastPosition = {
          lat: _this.data.mapLat,
          lng: _this.data.mapLng
        }
        //处理图标
        _this.setMarkers()
        wx.hideLoading()
      } else {
        //统一错误处理
        wx.showToast({
          title: '网络出错了...',
          duration: 2000,
          icon: 'none'
        })
      }
    })

  },
  setMarkers() {
    let _this = this;
    //设置图标
    let parkingList = [..._this.data.parkingList];
    if (parkingList.length === 0) {
      return false;
    }
    let currentParkingIndex = _this.data.currentParkingIndex;
    let markerType = _this.data.markerType;
    let markers = mapControls.setMarkers(currentParkingIndex, markerType, parkingList)
    let nowLat = parkingList[currentParkingIndex].lat;
    let nowLng = parkingList[currentParkingIndex].lng;
    let startLat = _this.data.currentLat;
    let startLng = _this.data.currentLng;
    let polyline = mapControls.setPolyline(startLat, startLng, nowLat, nowLng, _this);
    _this.setData({
      markers: markers
    })
  },
  regionchange(e) {
    let _this = this
    let mapCtx = wx.createMapContext('map')
    //拖动
    if (e.type === 'begin') {} else if (e.type === 'end') {
      mapCtx.getCenterLocation({
        success: function(res) {
          //距离判断，为了进行优化，小于200米距离不予刷新
          let startLng = '',
            startLat = '';
          if (_this.data.lastPosition.lat && _this.data.lastPosition.lng) {
            startLng = _this.data.lastPosition.lng;
            startLat = _this.data.lastPosition.lat;
          } else {
            startLng = _this.data.mapLng;
            startLat = _this.data.mapLat;
          }
          let distance = _this.getDistance(startLat, startLng, res.latitude, res.longitude);
          _this.data.mapLat = res.latitude;
          _this.data.mapLng = res.longitude;
          if (distance < 0.3) {
            return false
          }
          //获取当前位置之后需要重新进行数据刷新
          _this.getnearPark()
        }
      })
    }
  },
  markertap(e) {
    let currentParkingIndex = e.markerId;
    let _this = this;
    _this.setData({
      mapHieght: '100%',
      isontheTop: false,
      scrollFlag: false,
      cardStyle: {
        opacity: 1,
        display: 'block'
      },
      moveWrapPosition: 'bottom'
    });
    //节流处理
    if (currentParkingIndex == _this.data.currentParkingIndex) {
      return false;
    }
    _this.setData({
      currentParkingIndex: currentParkingIndex
    })
    _this.setMarkers()
  },
  controltap(e) {
    let _this = this
    switch (e.controlId) {
      case 1:
        _this.getCurrentPosition();
        break;
      case 2:
        _this.getnearPark();
        _this.getNowOrder();
        break;
      case 3:
        _this.setData({
          markerType: 0,
          controls: [mapControls.currentPositionControl, mapControls.carControl, mapControls.refreshControl]
        });
        _this.setMarkers();
        break;
      case 4:
        _this.setData({
          markerType: 1,
          controls: [mapControls.currentPositionControl, mapControls.priceControl, mapControls.refreshControl]
        });
        _this.setMarkers();
    }
  },
  showMovewrap() {
    this.setData({
      mapHieght: '50%',
      cardStyle: {
        opacity: 0,
        display: 'none'
      },
      moveWrapPosition: 'center'
    })
  },
  moveWraptouchstart(e) {
    this.startY = e.touches[0].pageY
  },
  moveWraptouchmove(e) {
    let _this = this;
    _this.moveY = e.touches[0].pageY;
  },
  moveWraptouchend(e) {
    let _this = this
    _this.endY = e.changedTouches[0].pageY
    let moveDis = _this.endY - _this.startY;
    if (_this.data.moveWrapPosition == 'center') {
      if (moveDis > 50) {
        _this.setData({
          mapHieght: '100%',
          isontheTop: false,
          scrollFlag: false,
          cardStyle: {
            opacity: 1,
            display: 'block'
          },
          moveWrapPosition: 'bottom'
        })
      } else if (moveDis < 0 && Math.abs(moveDis) > 50) {
        _this.setData({
          isontheTop: true,
          scrollFlag: true,
          mapHieght: '0',
          cardStyle: {
            opacity: 0,
            display: 'none'
          },
          moveWrapPosition: 'top'
        })
      }
    } else if (_this.data.moveWrapPosition == 'top' && moveDis > 50) {
      if (_this.data.isontheTop == false) {
        return false;
      }
      _this.setData({
        mapHieght: '50%',
        isontheTop: false,
        scrollFlag: false,
        cardStyle: {
          opacity: 0,
          display: 'none'
        },
        moveWrapPosition: 'center'
      })
    }
  },
  showMap() {
    let _this = this;
    if (_this.data.moveWrapPosition=='center'){
      _this.setData({
        mapHieght: '100%',
        isontheTop: false,
        scrollFlag: false,
        cardStyle: {
          opacity: 1,
          display: 'block'
        },
        moveWrapPosition: 'bottom'
      })
    }
  },
  changeCard(e) {
    let _this = this;
    let tapType = e.target.dataset.change;
    let currentParkingIndex = _this.data.currentParkingIndex;
    let maxLen = _this.data.parkingList.length;
    if (tapType == 'next') {
      currentParkingIndex = currentParkingIndex == maxLen - 1 ? 0 : ++currentParkingIndex;
    } else if (tapType == 'prev') {
      currentParkingIndex = currentParkingIndex == 0 ? maxLen - 1 : --currentParkingIndex;
    }
    _this.setData({
      currentParkingIndex: currentParkingIndex
    })
    _this.setMarkers()
  },
  changeTabIndex(e) {
    let _this = this;
    let index = e.target.dataset.index;
    let nowArrary = [];
    if (index == 0) {
      nowArrary = _this.data.newArrary.all
    } else if (index == 1) {
      nowArrary = _this.data.newArrary.ccArrary
    } else if (index == 2) {
      nowArrary = _this.data.newArrary.cwArrary
    }
    _this.setData({
      currentParkingIndex: 0,
      tabCurrentIndex: index,
      parkingList: nowArrary
    });
    _this.setMarkers();
  },
  changeScroll(e) {
    let _this = this;
    let scrollTop = e.detail.scrollTop
    let deltaY = e.detail.deltaY
    //根据不同的手机系统确定deltaY的阈值
    let system = app.globalData.system.phoneType;
    let deltayNum = system == "iOS" ? -10 : 0; //deltaY阈值
    console.log(deltayNum)
    if (scrollTop < 200 && deltaY > deltayNum) {
      setTimeout(function() {
        _this.setData({
          isontheTop: true
        })
      }, 100)
    } else {
      _this.setData({
        isontheTop: false
      })
    }
  },
  goParkingDetails() {
    let _this = this;
    //处理多次点击问题
    if (this.data.navationFlag == false) {
      return false;
    }
    this.setData({
      navationFlag: false
    })
    let currentParkingIndex = _this.data.currentParkingIndex;
    let nowParking = _this.data.parkingList[currentParkingIndex];
    app.globalData.parkingInfo.parkingId = nowParking.id;
    app.globalData.parkingInfo.lats = _this.data.currentLat;
    app.globalData.parkingInfo.lngs = _this.data.currentLng;
    app.globalData.parkingInfo.lat = nowParking.navi_lat
    app.globalData.parkingInfo.lng = nowParking.navi_lng
    wx.navigateTo({
      url: '../../pages/parkingdetails/parkingdetails',
    })
  },
  navigation() {
    let _this = this;
    let currentParkingIndex = _this.data.currentParkingIndex;
    let nowParking = _this.data.parkingList[currentParkingIndex];
    wx.openLocation({
      latitude: parseFloat(nowParking.navi_lat),
      longitude: parseFloat(nowParking.navi_lng),
      scale: 28
    })
  },
  goAppontNagation(e) {
    let _this = this;
    if (this.data.navationFlag == false) {
      return false;
    }
    this.setData({
      navationFlag: false
    })
    let index = e.target.dataset.index;
    let types = e.target.dataset.types;
    _this.setData({
      currentParkingIndex: index
    })
    _this.setMarkers();
    let nowParking = _this.data.parkingList[index];
    if (types =='details'){
      app.globalData.parkingInfo.parkingId = nowParking.id;
      app.globalData.parkingInfo.lats = _this.data.currentLat;
      app.globalData.parkingInfo.lngs = _this.data.currentLng;
      app.globalData.parkingInfo.lat = nowParking.navi_lat
      app.globalData.parkingInfo.lng = nowParking.navi_lng
      wx.navigateTo({
        url: '../../pages/parkingdetails/parkingdetails',
      })
    } else if (types == 'appointna'){
      if (nowParking.type==0){
        wx.openLocation({
          latitude: parseFloat(nowParking.navi_lat),
          longitude: parseFloat(nowParking.navi_lng),
          scale: 28
        })
      } else if(nowParking.type == 2 || nowParking.type == 1){
        app.globalData.parkingInfo.parkingId = nowParking.id;
        app.globalData.optionType = 'main';
        if (app.globalData.userInfo.userId != null) {
          wx.navigateTo({
            url: '../../pages/appointment/appointment',
          })
        } else {
          wx.navigateTo({
            url: '../../pages/login/login?from=map',
          })
        }
      }
    }
  },
  goAppoint() {
    let _this = this;
    if (this.data.navationFlag == false) {
      return false;
    }
    this.setData({
      navationFlag: false
    })

    let currentParkingIndex = _this.data.currentParkingIndex;
    let nowParking = _this.data.parkingList[currentParkingIndex];
    app.globalData.optionType = 'main';
    console.log(app.globalData.optionType)
    app.globalData.parkingInfo.parkingId = nowParking.id;
    if (app.globalData.userInfo.userId != null) {
      wx.navigateTo({
        url: '../../pages/appointment/appointment',
      })
    } else {
      wx.navigateTo({
        url: '../../pages/login/login?from=map',
      })
    }

  },
  getNowOrder() {
    let _this = this;
    let data = {
      "user_id": app.globalData.userInfo.userId
    }
    if (app.globalData.userInfo.userId == null) {
      return false;
    }
    AJAX('/apiread/order/using', data, function(res) {
      mapControls.countParking(1);//清空倒计时
      if (res.data == null) {
        _this.setData({
          noteShowFlag: false,
          noteMessage: ''
        })
        return false;
      }
      if (res.error_code == 2000) {
        console.log(res);
        if (res.data.state == 1300) {
          _this.setData({
            noteShowFlag: true,
            noteMessage: '已为您保留车位，请在5分钟内完成支付'
          });
          _this.setData({
            nowOrderId: res.data.orderId
          });
          app.globalData.orderInfo.orderId = res.data.orderId;
        } else if (res.data.state == 1301) {
          _this.setData({
            nowOrderId: res.data.orderId
          });
          mapControls.countParking(0, _this, 1, res.data.startTime);
        } else if (res.data.state == 1302) {
          mapControls.countParking(0,_this,0,res.data.realStartTime);
          _this.setData({
            nowOrderId: res.data.orderId
          });        
        } else if (res.data.state == 1303) {
          _this.setData({
            noteShowFlag: true,
            noteMessage: '您有待支付订单，记得支付哦！',
            nowOrderId: res.data.orderId
          })
        } else {
          mapControls.countParking(1);//清空倒计时   
          _this.setData({
            noteShowFlag: false,
            noteMessage: ''
          })
        }
      }
    },function(){
      mapControls.countParking(1);//清空倒计时
      _this.setData({
        noteShowFlag: false,
        noteMessage: ''
      })
    })
  },
  goOrder(){
    let _this=this;
    if (this.data.navationFlag==false){
      return false;
    }
    app.globalData.orderInfo.orderId = _this.data.nowOrderId;
    console.log(_this.data.nowOrderId)
    this.setData({
      navationFlag: false
    })
    app.globalData.optionType = 'main';
    wx.navigateTo({
      url: '../../pages/order/order',
    })
  },
  goPersonal(){
    let _this = this;
    if (this.data.navationFlag == false) {
      return false;
    }
    this.setData({
      navationFlag: false
    });
    wx.navigateTo({
      url: '../../pages/personal/personal'
    })
  },
  getDistance: function(lat1, lng1, lat2, lng2) {
    let radLat1 = parseFloat(lat1) * Math.PI / 180.0;
    let radLat2 = parseFloat(lat2) * Math.PI / 180.0;
    let a = radLat1 - radLat2;
    let b = parseFloat(lng1) * Math.PI / 180.0 - parseFloat(lng2) * Math.PI / 180.0;
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137; // EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000;
    return s;
  }
})