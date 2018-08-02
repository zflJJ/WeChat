//logs.js
const app = getApp()
import AJAX from '../../utils/networkUtil.js';
const provinceData = ['粤', '京', '沪', '津', '冀', '鲁', '云', '辽', '黑', '湘', '皖', '新', '苏', '浙', '赣', '鄂', '桂', '甘', '晋', '蒙', '陕', '吉', '闽', '贵', '青', '藏', '川', '宁', '琼', '豫', '渝', null, null, null, null, null, null, null, null, '删']
const numbesData = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '学', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '港', '澳', '删']
const reg = /([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF])|([DF]([A-HJ-NP-Z0-9])[0-9]{4})))|([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1})/

Page({
  data: {
    indentLists: ['粤', 'B'],
    plateLists: ['车', '牌', '号', '码', null, null, null],
    currentIndentIndex: null,
    currentPlateIndex: 0,
    keyboardList: provinceData,
    isindentFLag: false,
    isplateFlag: true,
    cursorFlag: false,
    keyboardShow: false,
    loading: false
  },
  onLoad: function() {

  },
  addCar() {
    let _this = this
    let indentLists = [..._this.data.indentLists]
    let plateLists = [..._this.data.plateLists]
    let strs = indentLists.join('') + plateLists.join('')
    _this.show = false
    if (strs.length < 7) {
      wx.showToast({
        title: '请输入正确的车牌号码',
        icon: 'none',
        duration: 2000
      })
    } else if (!reg.test(strs)) {
      wx.showToast({
        title: '请输入正确的车牌号码',
        icon: 'none',
        duration: 2000
      })
    } else {
      _this.setData({
        loading: true
      })
      _this.addCarrequest(strs)
    }
  },
  addCarrequest(strs){
    let _this=this
    let params={
      "user_id": app.globalData.userInfo.userId,
      "plate_num": strs
    }
    AJAX('/apiwrite/plate/add', params,function(res){
      setTimeout(() => {
        _this.setData({
          loading: false
        })
      }, 1000)
      let data = res;
      if (data.error_code === 2000) {
        //添加车牌成功
        wx.showToast({
          title: '添加车牌成功了！',
          icon: 'none',
          duration: 2000
        })
        wx.navigateBack({
          delta: 1
        })
      } else if(data.error_code==2500){
        wx.showToast({
          title: "车牌号码已存在",
          icon: 'none',
          duration: 2000
        })
      } else{
        wx.showToast({
          title: data.error_message,
          icon: 'none',
          duration: 2000
        })
      }
    },function(){
      _this.setData({
        loading: false
      })
    })
  },
  keyboardTap(event) {
    let _this = this;
    // 输入字母数字
    let msg = event.currentTarget.dataset.key
    let isplateFlag = _this.data.isplateFlag
    if (isplateFlag) {
      if (msg === '删') {
        _this.delPlate(msg)
      } else {
        _this.inputPlate(msg)
      }
    } else {
      // 输入地区标识
      if (msg === '删') {
        return false
      } else {
        _this.inputIndent(msg)
      }
    }
  },
  inputPlate(msg) {
    let _this = this
    let currentPlateIndex = _this.data.currentPlateIndex
    _this.cursorFlag = true
    // 判断是否正在输入状态
    if (currentPlateIndex === 0) {
      _this.setData({
        plateLists: [null, null, null, null, null, null, null]
      })
    }
    let lists = [..._this.data.plateLists]
    if (currentPlateIndex <= 5) {
      lists[currentPlateIndex] = msg
      currentPlateIndex++
      _this.setData({
        plateLists: lists,
        currentPlateIndex: currentPlateIndex
      })
    }
  },
  inputIndent(msg) {
    let _this = this
    let indentLists = [..._this.data.indentLists]
    let currentIndentIndex = _this.data.currentIndentIndex
    indentLists[currentIndentIndex] = msg
    if (currentIndentIndex === 1) {
      this.setData({
        currentIndentIndex: null,
        keyboardList: numbesData,
        keyboardShow: true,
        cursorFlag: true,
        isplateFlag: true,
        indentLists: indentLists
      })
    } else {
      _this.setData({
        keyboardList: numbesData,
        currentIndentIndex: 1,
        indentLists: indentLists
      })
    }
  },
  delPlate(msg) {
    let _this = this
    let currentPlateIndex = _this.data.currentPlateIndex
    if (currentPlateIndex === 0) {
      return false
    } else {
      --currentPlateIndex
      _this.setData({
        currentPlateIndex: currentPlateIndex
      })
    }
    if (currentPlateIndex === 0) {
      _this.setData({
        plateLists: ['车', '牌', '号', '码', null, null]
      })
    } else {
      let lists = [..._this.data.plateLists]
      lists[currentPlateIndex] = null
      _this.setData({
        plateLists: lists
      })
    }
  },
  changeInput(event) {
    let _this = this
    let inde = event.currentTarget.dataset.index
    let keyboard = ''
    if (inde === 0) {
      keyboard = provinceData
    } else {
      keyboard = numbesData
    }
    _this.setData({
      cursorFlag: false,
      keyboardShow: true,
      currentIndentIndex: inde,
      keyboardList: keyboard,
      isplateFlag: false
    })
  },
  showKeyboard() {
    this.setData({
      currentIndentIndex: null,
      keyboardList: numbesData,
      keyboardShow: true,
      cursorFlag: true,
      isplateFlag: true
    })
  },
  hideKeyboard() {
    this.setData({
      keyboardShow: false
    })
  }
})