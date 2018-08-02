module.exports = {
  setParams: setParams, //设置蓝牙初始化列表
  setNames: setNames, //设置门禁列表
  startConnect: startConnect,
  closeConnection: closeConnection,
  showBluetoothList: showBluetoothList,
  clearboothTimer: clearboothTimer
}
let boothTimer=null;
let param = {
  entrancenameList: null, //门禁列表名
  btNames: null, //蓝牙设备列表名
  btPwds: null, //蓝牙设备密码列表
  connectDeviceIndex: 0, //当前需要进行连接的蓝牙列表名
  deviceId: null, //蓝牙id
  autoClose: false, //是否自动关闭蓝牙
  controlType: null, // 0是控制车锁 1是控制门禁 3控制进场入场的类型
  order: null, //控制车锁的命令
  getConnectedTimer: null, //查看当前连接蓝牙失败后继续查看
  isConnectting: false, //正在连接蓝牙标识
  characteristic_notify: null,
  characteristic_write: null,
  getOnfoundDeviceIdTimer:null //查询时间20秒不能找到设备就提醒用户无法找到设备
}
//设置蓝牙车锁控制初始化参数开始
function setParams(btNames, btPwds, autoClose, controlType) {
  clearTimeout(param.getOnfoundDeviceIdTimer)//结束查询不到提醒
  //let serviceId = param.serviceId;
  param = {
    entrancenameList: null, //门禁列表名
    btNames: null, //蓝牙设备列表名
    btPwds: null, //蓝牙设备密码列表
    connectDeviceIndex: 0, //当前需要进行连接的蓝牙列表名
    deviceId: null, //蓝牙id
    autoClose: false, //是否自动关闭蓝牙
    controlType: null, // 0是控制车锁 1是控制门禁 3控制进场入场的类型
    order: null, //控制车锁的命令
    getConnectedTimer: null, //查看当前连接蓝牙失败后继续查看
    isConnectting: false, //正在连接蓝牙标识
    characteristic_notify: null,
    characteristic_write: null
  }
  param.btNames = btNames;
  param.btPwds = btPwds;
  param.autoClose = autoClose;
  param.controlType = controlType;
}
//设置门禁列表名
function setNames(names) {
  param.names = names;
}
//弹出门禁列表名
function showBluetoothList() {
  wx.showActionSheet({
    itemList: param.names,
    itemColor: '#000000',
    success: function (res) {
      wx.showLoading({
        title: '正在打开门禁...',
        mask:true
      })
      param.connectDeviceIndex = res.tapIndex;
      startConnect(2);
    },
    fail: function (res) {

    },
    complete: function (res) {
    },
  })
}
//开始连接蓝牙
function startConnect(order) {
  param.order = order;
  if (param.deviceId != null) { //当前蓝牙id是否存在
    getBluetoothAdapterState() //获取本机蓝牙适配器状态
  } else {
    openBluetoothAdapter(); //打开蓝牙适配器
  }
}
// 打开蓝牙适配器
function openBluetoothAdapter() {
  wx.openBluetoothAdapter({
    success: function (res) {
      getBluetoothAdapterState() //获取本机蓝牙适配器状态
    },
    fail: function (err) {
      console.log(err);
      if (param.controlType==1){
        wx.showToast({
          title: '控制门禁需要打开蓝牙连接',
          icon: 'none',
          duration: 2000
        })
      }else{
        wx.showToast({
          title: '请您打开蓝牙连接',
          icon: 'none',
          duration: 2000
        })
      }
    }
  })
}
//获取本机蓝牙适配器状态
function getBluetoothAdapterState() {
  wx.getBluetoothAdapterState({
    success: function (res) {
      let available = res.available; //蓝牙适配器是否可用
      let discovering = res.discovering; //是否正在搜索蓝牙
      if (!available) {
        openBluetoothAdapter() //打开蓝牙适配器
      } else {
        if (!discovering) {
          startBluetoothDevicesDiscovery() //开始搜索附近蓝牙设备
          getConnectedBluetoothDevices() //查看当前已经连接蓝牙设备
        }
      }
    },
    fail: function () {
      getBluetoothAdapterState() //失败后需要继续获取蓝牙设备状态
    }
  })
}
//开始搜索附近的蓝牙设备
function startBluetoothDevicesDiscovery() {
  wx.startBluetoothDevicesDiscovery({
    services: [],
    success: function (res) {
      if (!res.isDiscovering) {
        getBluetoothAdapterState();
      } else {
        onBluetoothDeviceFound();
      }
    },
    fail: function (err) {
      console.log(err)
    }
  })
}
//停止搜索附近的蓝牙设备
function stopBluetoothDevicesDiscovery() {
  wx.stopBluetoothDevicesDiscovery({
    success: function (res) {
      console.log(res)
    }
  })
}
//获取当前连已经连接设备状态
function getConnectedBluetoothDevices() {
  if (param.serviceId === undefined) {
    return false;
  }
  wx.getConnectedBluetoothDevices({
    services: [param.serviceId],
    success: function (res) {
      console.log("获取处于连接状态的设备", res);
      var devices = res['devices'],
        flag = false,
        index = 0,
        conDevList = [];
      devices.forEach(function (value, index, array) {
        if (value['name'].indexOf(param.btNames) != -1) {
          flag = true;
          index += 1;
          conDevList.push(value['deviceId']);
          param.deviceId = value['deviceId'];
          return;
        }
      });
      if (flag) {
        param.connectDeviceIndex = 0;
        loopConnect(conDevList);
      } else {
        if (!param.getConnectedTimer) {
          param.getConnectedTimer = setTimeout(function () {
            getConnectedBluetoothDevices(); //失败重新扫描
          }, 5000);
        }
      }
    },
    fail: function (err) {
      if (!this.getConnectedTimer) {
          getConnectedTimer = setTimeout(function () {
          getConnectedBluetoothDevices(); //失败重新扫描
        }, 5000);
      }
    }
  });

}
// 已经配对蓝牙
function loopConnect(devicesId) {
  var listLen = devicesId.length;
  if (devicesId[param.connectDeviceIndex]) {
    param.deviceId = devicesId[param.connectDeviceIndex];
    startConnectDevices('loop', devicesId);
  } else {
    startBluetoothDevicesDiscovery();
    getConnectedBluetoothDevices();
  }
}
//开始连接蓝牙
function startConnectDevices(ltype, array) {
  clearTimeout(param.getConnectedTimer); //不匹配蓝牙时的处理
  param.getConnectedTimer = null;
  clearTimeout(param.discoveryDevicesTimer); //待处理
  stopBluetoothDevicesDiscovery(); //结束蓝牙搜索
  param.isConnectting = true;
  wx.createBLEConnection({
    deviceId: param.deviceId,
    success: function (res) {
      if (res.errCode == 0) {
        setTimeout(function () {
          getService(param.deviceId);
        }, 1000)
      }
    },
    fail: function (err) {
      if (ltype == 'loop') {
        param.connectDeviceIndex += 1;
        loopConnect(array);
      } else {
        startBluetoothDevicesDiscovery();
        getConnectedBluetoothDevices();
      }
    },
    complete: function () {
      param.isConnectting = false;
    }
  });
}
//监听蓝牙连接
function getService(deviceId) {
  wx.onBLEConnectionStateChange(function (res) {
    console.log(res);
  });
  // 获取蓝牙设备service值
  wx.getBLEDeviceServices({
    deviceId: deviceId,
    success: function (res) {
      getCharacter(deviceId, res.services);
    }
  })
}
// 发送数据
function getCharacter(deviceId, services) {
  for (let i = 0; i < services.length; i++) {
    if (services[i].uuid == '6E400001-B5A3-F393-E0A9-E50E24DCCA9E') {
      param.serviceId = services[i].uuid;
      break;
    }
  }
  wx.getBLEDeviceCharacteristics({
    deviceId: deviceId,
    serviceId: param.serviceId,
    success: function (res) {
      param.characteristic_notify = res.characteristics[0].uuid;
      param.characteristic_write = res.characteristics[1].uuid;
      notifyBLECharacteristicValueChange();
    },
    fail: function (err) {
    },
    complete: function () {

    }
  })
}
//启用低功耗蓝牙设备特征值变化时的 notify 功能
function notifyBLECharacteristicValueChange() {
  wx.notifyBLECharacteristicValueChange({
    state: true, // 启用 notify 功能
    deviceId: param.deviceId,
    serviceId: param.serviceId,
    characteristicId: param.characteristic_notify,
    success: function (res) {
      wx.onBLECharacteristicValueChange(function (res) {
        console.log(res)
      });
      setTimeout(function () {
        validate();
      }, 2000)
    },
    fail: function (res) {
      console.log('失败');
    }
  })
}
//开始写值
function validate() {
  let buffer = new ArrayBuffer(5)
  const v1 = new Uint8Array(buffer);
  v1[0] = 0x04;
  v1[1] = 0x12;
  let bcdArray = stringToBCD(param.btPwds[param.connectDeviceIndex]);
  v1[2] = bcdArray[0];
  v1[3] = bcdArray[1];
  v1[4] = bcdArray[2];
  wx.writeBLECharacteristicValue({
    deviceId: param.deviceId,
    serviceId: param.serviceId,
    characteristicId: param.characteristic_write,
    value: buffer,
    success: function (res) {
      setTimeout(function () {
        boothcontrol();
      }, 1000)
    },
    fail: function (res) {
    }
  })
}
//搜索设备
function onBluetoothDeviceFound() {
  param.getOnfoundDeviceIdTimer=setTimeout(()=>{
    console.log('执行未找到设备')
    closeConnection()//结束连接
    wx.showToast({
      title: '未找到设备',
      duration:2000
    })
  },15000)
  wx.onBluetoothDeviceFound(function (res) {
    if (res.devices[0]) {
      var name = res.devices[0]['name'];
      if (name != '') {
        console.log(name)
        if (name.indexOf(param.btNames) != -1) {
          clearTimeout(param.getOnfoundDeviceIdTimer)//结束查询不到提醒
          let deviceId = res.devices[0]['deviceId'];
          param.deviceId = deviceId;
          startConnectDevices();
        }
      }
    }
  })
}
//所有蓝牙设备包括已经连接到蓝牙设备
function getBluetoothDevices() {
  wx.getBluetoothDevices()
}
//关闭蓝牙
function closeConnection() {
  clearTimeout(param.getOnfoundDeviceIdTimer)//结束查询不到提醒
  if (param.deviceId!=null){
    wx.closeBLEConnection({
      deviceId: param.deviceId,
      success: function (res) {
        console.log('关闭低效蓝牙')
      }
    })
  }
  wx.closeBluetoothAdapter({
    success: function (res) {
      console.log('关闭蓝牙')
    }
  })
}
//控制蓝牙
function boothcontrol() {
  clearTimeout(param.getOnfoundDeviceIdTimer)//结束查询不到提醒
  console.log('control start')
  let buffer = new ArrayBuffer(3)
  const v1 = new Uint8Array(buffer);
  v1[0] = 0x05;
  v1[1] = 0x01;
  if (param.order == 1) {
    v1[2] = 0x01;
  } //升锁
  if (param.order == 2) {
    v1[2] = 0x02;
  } //降锁&开门禁
  //添加提示语
  let noteStr = ''
  if (param.controlType === 1) {
    noteStr = "门禁打开"
  } else if (param.controlType == 0 && param.order == 1) {
    noteStr = '车锁上升'
  } else if (param.controlType == 0 && param.order == 2) {
    noteStr = '车锁下降'
  } else if (param.controlType == 3 && param.order == 1) {
    noteStr = "结束停车"
  } else if (param.controlType == 3 && param.order == 2) {
    noteStr = "开始停车"
  }
  wx.writeBLECharacteristicValue({
    deviceId: param.deviceId,
    serviceId: param.serviceId,
    characteristicId: param.characteristic_write,
    value: buffer,
    success: function (res) {
      if (param.autoClose) {
        setTimeout(function () {
          closeConnection();
        }, 1000);
        console.log(param.controlType);     
        if (param.controlType == 0 || param.controlType == 1){
          wx.showToast({
            title: noteStr
          });
        } else if (param.controlType == 3){
          if (param.controlType == 3 && param.order == 2){
            //这里需要禁用取消预约
            wx.setStorageSync('isParking', 'isParking');
          }
            clearTimeout(boothTimer);
            boothTimer=null;
            boothTimer=setTimeout(()=>{
              wx.startPullDownRefresh()
            },4000)
        }
      }
    },
    fail: function (res) {
      wx.showToast({
        title: '连接设备失败了!'
      });
    }
  })
}
//清空定时器
function clearboothTimer(){
  console.log('清空定时器')
  clearTimeout(boothTimer);
  boothTimer = null;
}
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}
function stringToBCD(codeString) {
  var intArray = [];
  var bcdArray = [];
  intArray.push(parseInt(codeString.substr(0, 2)));
  intArray.push(parseInt(codeString.substr(2, 2)));
  intArray.push(parseInt(codeString.substr(4, 2)));
  for (let i in intArray) {
    let digit1 = parseInt(intArray[i] / 10) * 16;
    let digit0 = intArray[i] % 10;
    bcdArray.push(digit0 + digit1);
  }
  return bcdArray;
}
