//logs.js
import AJAX from '../../utils/networkUtil.js';
const app = getApp()
Page({
  data: {
    plateList: [],
    page_num: 0, // 上拉加载的页数
    isEdit: false, // 默认情况下是非编辑车辆
  },
  onLoad: function() {

  },
  onReady() {

  },
  onShow() {
    // 获取当前车辆列表
    this.getplateList()
  },
  onHide() {

  },
  addCar() {
    wx.navigateTo({
      url: '../../pages/plateadd/plateadd',
    })
  },
  /**
   * 获取车牌号的列表
   */
  getplateList() {
    let that = this
    let plateList = []
    let oldplateList = that.data.plateList;
    let data = {
      user_id: app.globalData.userInfo.userId,
      page_num: that.data.page_num,
    }
    AJAX('/apiread/plate/get', data, function(res) {
      wx.hideLoading()
      if (res.error_code === 2000) {
        if (that.data.page_num == 0) {
          plateList = [].concat(res.data.plates);
        } else {
          if (res.data.plates.length === 0) {
            wx.showToast({
              title: '已经到底了，没有更多数据了。',
              icon: 'none'
            })
          }
          plateList = oldplateList.concat(res.data.plates)
        }
        that.setData({
          plateList: plateList
        })
      } else {
        wx.showToast({
          title: res.data.error_message,
          icon: 'none'
        })
        return
      }

    })
  },
  /**
   * 切换删除和编辑模式
   */
  switchingMode() {
    this.setData({
      isEdit: !this.data.isEdit
    })
    if (this.data.isEdit) {
      this.data.page_num = 0
      this.getplateList()
    }
  },
  /**
   * 这个接口删除车牌或者 选择车牌
   */
  processingData(event) {
    let that = this
    let plateList = that.data.plateList    
      app.globalData.plateInfo.plateId = event.currentTarget.dataset.plateid //车牌Id
      app.globalData.plateInfo.plateNum = event.currentTarget.dataset.plateno //车牌编码
      wx.navigateBack({
        delta: 1
      })
  },
  delPlate(event){
    let that = this
    let plateList = that.data.plateList
    if (that.data.isEdit) {
      let data = {
        user_id: app.globalData.userInfo.userId,
        plate_id: event.currentTarget.dataset.plateid,
      }
      AJAX('/apiwrite/plate/del', data, function (res) {
        wx.hideLoading()
        if (res.error_code === 2000) {
          plateList.splice(event.currentTarget.dataset.index)
          that.data.page_num = 0
          that.getplateList()
        } else {
          wx.showToast({
            title: res.data.error_message,
            icon: 'none'
          })
        }
      })
    }
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    let that = this
    that.data.page_num = 0
    wx.stopPullDownRefresh();
    that.getplateList()
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    this.data.page_num++; //加载下一页
    this.getplateList();
  }
})