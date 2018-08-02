import { formatTimeStamp } from './timeplugin.js'

// 筛出无效的时间段
export const filteTime = (timeList, nowTime) => {
  let computedData = []
  for (var i = 0; i < timeList.length; i++) {
    // 间隔15分钟的时间都没有的话，就排除掉
    if (timeList[i].startTime >= nowTime) {
      if (timeList[i].startTime > timeList[i].endTime - 900000) {
        continue
      } else {
        computedData.push({
          startTime: timeList[i].startTime,
          endTime: timeList[i].endTime,
          id: timeList[i].id
        })
      }
    } else if (
      timeList[i].startTime < nowTime &&
      timeList[i].endTime < nowTime
    ) {
      continue
    } else if (
      timeList[i].startTime < nowTime &&
      nowTime < timeList[i].endTime - 900000
    ) {
      computedData.push({
        startTime: timeList[i].startTime,
        endTime: timeList[i].endTime,
        id: timeList[i].id
      })
    }
  }
  return computedData
}
// 时间去重处理
export const disposeTime = (timeList) => {
  let getDatas = []
  for (let i = 0; i < timeList.length; i++) {
    timeList[i].endTime -= 900000
  }
  let tempTimelist = []
  let tmObjective = timeList[0]
  if (timeList.length <= 1) {
    getDatas = [].concat(timeList)
    return getDatas
  }
  for (let i = 1; i < timeList.length; i++) {
    let newItem = {}
    let item = timeList[i]
    if (
      tmObjective.endTime >= item.startTime &&
      item.endTime >= tmObjective.endTime
    ) {
      newItem.startTime = tmObjective.startTime
      newItem.endTime = item.endTime
      if (i > 0 ) {
        tempTimelist.pop(tempTimelist[tempTimelist.length - 1])
      }
      tempTimelist.push(newItem)
      tmObjective.startTime = newItem.startTime
      tmObjective.endTime = newItem.endTime
    } else if (
      tmObjective.endTime >= item.startTime &&
      item.endTime < tmObjective.endTime
    ) {
      newItem.startTime = tmObjective.startTime
      newItem.endTime = tmObjective.endTime
      if (i > 0 ) {
        tempTimelist.pop(tempTimelist[tempTimelist.length - 1])
      }
      tempTimelist.push(newItem)
      tmObjective.startTime = newItem.startTime
      newItem.endTime = tmObjective.endTime
    } else {
      tempTimelist.push(item)
      tmObjective.startTime = item.startTime
      tmObjective.endTime = item.endTime
    }
  }
  getDatas = [].concat(tempTimelist)
  return getDatas
}

export const dataChange = (timeList, nowTime) => {
  let arrayHoursMiunt = []
  for (let i = 0; i < timeList.length; i++) {
    let item = timeList[i]
    var n = (item.endTime - item.startTime) / 900000
    if (nowTime > item.endTime) {
      continue // 比结束时间都还大，直接结束本次循环
    } else if (
      item.startTime < nowTime &&
      nowTime < item.endTime
    ) {
      var x = null
      var start = item.startTime
      var arr = []
      for (var j = 0; j <= n; j++) {
        arr.push(start)
        start += 900000
      }
      for (var y = 0; y < arr.length; y++) {
        if (nowTime < arr[y]) {
          x = y
          break
        }
      }
      var arrtrue = []
      if (x !== null) {
        arrtrue = arr.slice(x)
        arrayHoursMiunt.push(arrtrue)
      }
    } else {
      // 先转换成数组
      let arr = []
      let start = timeList[i].startTime
      for (let j = 0; j <= n; j++) {
        arr.push(start)
        start += 900000
      }
      arrayHoursMiunt.push(arr)
    }
  }
  return convertTime(arrayHoursMiunt)
}

export const convertTime = (array) => {
  let pData1 = []
  let pData2 = {}
  let pData2arr = []
  let defaultTime = '00：00'
  for (var i = 0; i < array.length; i++) {
    var arrayone = array[i]
    // 2018-12-12 12:12:12
    let oldDay = formatTimeStamp(arrayone[0]).substr(8, 2)  // 12号
    for (let j = 0; j < arrayone.length; j++) {
      let time = formatTimeStamp(arrayone[j])  
      let miunte = time.substr(14, 2)  //12时
      let hours = time.substr(11, 2) // 12分
      let day = time.substr(8, 2) 
      if (oldDay < day) {
        hours = ' 次日 ' + hours + ' 时 '
        miunte = miunte + ' 分 '
      } else {
        hours = hours + ' 时 '
        miunte = miunte + ' 分 '
      }
      // debugger
      if (pData1.length >= 1) {
        if (pData1[pData1.length - 1].texts !== hours) {
          pData1.push({
            text: hours,
            value: i + j + hours,
            texts: hours,
            time: arrayone[j]
          })
        }
      } else {
        pData1.push({
          text: hours,
          value: i + j + hours,
          texts: hours,
          time: arrayone[j]
        })
      }

      pData2arr.push({
        text: miunte,
        value: i + j,
        texts: hours,
        time: arrayone[j]
      })
    }
  }
  // 调用一个方法 将分钟数排重处理  pData1
  let hours = []
  for(let i=0,len = pData1.length;i<len;i++){
    hours.push(pData1[i].text)
  }
  hours.unshift('立即入场')
  pData2arr.unshift({
    text:'',
    texts:'立即入场',
    time:'1531791900000'
  })
  pData2 = pData2chang(pData2arr)
  pData2.timestamp[0][0] = pData2.timestamp[1][0]
  defaultTime = String(formatTimeStamp(pData2.timestamp[0][0])).substr(11, 5) + '前'
  return {
    hours: hours,
    miuntes: pData2.miunte,
    timestamps: pData2.timestamp,
    defaultTime: defaultTime
  }
}

// 分钟数排重处理
export const pData2chang = (arr) => {
  var data = []
  let miuntArr = []
  let timestampArr = []
  for (var i = 0; i < arr.length; i++) {
    if (!data[arr[i].texts]) {
      var arrs = []
      arrs.push(arr[i])
      data[arr[i].texts] = arrs
    } else {
      data[arr[i].texts].push(arr[i])
    }
  }
  Object.keys(data).forEach(function (key) {
    let miunte = []
    let timestamp = []
    for(let i=0,len = data[key].length;i<len;i++){
      miunte.push(data[key][i].text)
      timestamp.push(data[key][i].time)
    }
    miuntArr.push(miunte)
    timestampArr.push(timestamp)
  });
  return {
    timestamp:timestampArr,
    miunte: miuntArr
  }
}
