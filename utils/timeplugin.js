export const formatTimeStamp = function (timeStamp) {
  let newTime = ''
  let date = new Date(timeStamp)
  let year = date.getFullYear() + ''
  let month = date.getMonth() + 1 + ''
  let d = date.getDate() + ''
  let hours = date.getHours() + ''
  let minutes = date.getMinutes() + ''
  let seconds = date.getSeconds() + ''
  let milliSeconds = date.getMilliseconds() + ''
  month = ('00' + month).substr(month.length)
  d = ('00' + d).substr(d.length)
  hours = ('00' + hours).substr(hours.length)
  seconds = ('00' + seconds).substr(seconds.length)
  minutes = ('00' + minutes).substr(minutes.length)
  milliSeconds = ('00' + milliSeconds).substr(milliSeconds.length)
  newTime = year + '-' + month + '-' + d + ' ' + hours + ':' + minutes + ':' + seconds + ':' + milliSeconds
  return newTime
}