//车场详情
const app = getApp()
import AJAX from '../../utils/networkUtil.js';
import { formatTimeStamp } from '../../utils/timeplugin.js';
Page({
  data: {
    parkingD: {},
    indicatorDots: true,
    autoplay: true,
    interval: 5000,
    duration: 1000,
    indicatorColor: 'rgba(8, 8, 8, 0.8)',
    indicatorActiveColor: '#d01c95',
    parkLists: null
  },
  onLoad: function () {
    let _this = this;
    _this.getparkingDetails();
  },
  getparkingDetails() {
    let _this = this;
    let data = {
      "parklot_id": app.globalData.parkingInfo.parkingId,
      "lng": app.globalData.parkingInfo.lngs,
      "lat": app.globalData.parkingInfo.lats,
    }
    AJAX('/apiread/parklot/detail', data, function (data) {
      if (data.error_code == 2000) {
        if (data.data.parklocShareRepData != null && data.data.parklocShareRepData[0]) {
          let parkLists = [];
          let lotsLists = data.data.parklocShareRepData;
          for (let item of lotsLists) {
            let shares = item.shares;
            let parklocNumber = item.parklocNumber;
            if (shares[0]) {
              for (let subItem of shares) {
                let parkItem = {};
                let startTime = subItem.startTime;
                let endTime = subItem.endTime;
                let startHour = null;
                let endHour = null;
                startTime = formatTimeStamp(startTime);
                endTime = formatTimeStamp(endTime);
                startHour = startTime.substr(8, 2) + "日";
                endHour = endTime.substr(8, 2) + "日";
                startTime = startHour + " " + startTime.substr(11, 5);
                endTime = endHour + " " + endTime.substr(11, 5);
                parkItem.startTime = startTime;
                parkItem.endTime = endTime;
                parkItem.parklocNumber = parklocNumber;
                parkLists.push(parkItem);
              }
            }
          }
          _this.setData({
            parkLists: parkLists
          })
        } else {
          data.data.ispark = true
        }
        _this.setData({
          parkingD: data.data
        })
      } else {
        wx.showToast({
          title: '获取车场详情出错了...',
          duration: 2000
        })
        wx.navigateBack({

        });
      }
    })
  }, onGotUserInfo(res) {
    console.log(res)
  },
  goNa() {
    wx.openLocation({
      latitude: parseFloat(app.globalData.parkingInfo.lat),
      longitude: parseFloat(app.globalData.parkingInfo.lng),
      scale: 28
    })
  }
})
