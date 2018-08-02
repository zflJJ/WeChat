import api from 'api.js'
import { errCode } from './constant.js'
const base_url = api.url;
function AJAX(url_suffix, data, handle,handleer,hanaleloading, method = 'POST') {
  data.timestamp=String(new Date().getTime())
  wx.request({
    url: base_url + url_suffix,
    data: data,
    method: method,
    header: { "content-Type": "application/json" },
    success: function (res) {
      let data = res.data
      if (data.error_code == errCode.netfaulCode || data.error_code == errCode.unknowCode || data.error_code == errCode.errtimeCode) {
        wx.showToast({
          title: '网络穿越了...',
          duration: 2000,
          icon: 'none'
        })
        if (hanaleloading){
          hanaleloading();
        }
      } else {
        handle(data)
      }
    },fail(err){
      console.log(err)
      wx.hideLoading();
      wx.hideToast();
      if(handleer){
        handleer()
      }
      if (err.errMsg =='request:fail timeout'){
        wx.showToast({
          title: '网络超时了...',
          duration: 2000,
          icon:'none'
        })
      }else{
        wx.showToast({
          title: '网络出错了...',
          duration: 2000,
          icon: 'none'
        })
      }
    }
  })
}
export default AJAX
