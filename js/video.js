/*
 * @Description: 
 * @Author: xyh
 * @Date: 2020-05-15 12:28:47
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2020-05-19 13:07:44
 */ 

var aidrivingPlayer = {
  videoList: [], // 视频对象数组
  passageway: [], // 记录已播放的视频通道号
  sessionId: '',
  simNo: '',
  tipTimer: null, // 提示计时器
  autoCloseTimer: null, // 自动关闭计时器
  autoCloseTime: 0, //
  autoCloseTimeAcc: 0, // 
  vehicleNo: '', // 车牌号
  playType: 'broadcast', // 播放类型
  token: '',
  url: '', // 
  videoUrl: '/videoapi/openVideo', // 获取视频地址请求
  stopUrl: '/videoapi/closeVideo', // 停止视频请求
  bateUrl: '/videoapi/heartBeat', // 直播心跳
  getVehicleNoUrl: '/gpsroot/vehicle/getPlateNoByVehicle', // 获取车牌号
  playbackTimelineUrl:'/videoapi/videoPlayBack/getResourceListWeb', // 下发历史视频资源列表查询指令
  getResourceListUrl:'/videoapi/videoPlayBack/getResourceListById', // 根据指令Id查询音视频资源列表
  playbackUrl:'/videoapi/videoPlayBack/sendVideoPlayBackCommandWeb', // 下发远程回放指令
  getVehicleNo: function() { // 获取车牌号
      var _this = this
      $.ajax({
          dataType: 'json',
          type: 'POST',
          contentType: 'application/json;charset-UTF-8',
          url: _this.url + _this.getVehicleNoUrl,
          data: JSON.stringify({"simNo": _this.simNo}),
          error: function(){},
          success: function(data) {
              if (data.code == 1000) {
                  _this.vehicleNo = data.data
                  _this.updateVehicleNo(data.data)
              }
          }
      })
  },
  getVideoUrl: function(ids) { // 获取视频播放url
      
      var _ids = []
      var arr = this.passageway
      var url = this.url = $('#url').val()
      var token = this.token = $('#secret_key').val()
      if(!url) {
          this.showTip('请填写资源URL地址')
          return
      }
    //   if(!token) {
    //     this.showTip('请填写客户密钥')
    //     return
    //   }
      if(Array.isArray(ids)) { // 判断是单个视频播放 还是全部播放
          _ids = ids
      } else {
          _ids = [ids]
      }

      if(this.passageway.length) {
          this.passageway = arr.reduce(function(cur, next) {
            var obj = _ids.find(a => a === next)
            if(!obj) {
                cur.push(obj)
            }
            return cur
          }, [])
      } else {
        this.passageway = _ids
      }

      if(this.playType === 'broadcast') {
          this.getVideoUrlAjax(_ids)
      } else {
          this.getPlaybackAjax(_ids)
      }

  },
  getVideoUrlAjax: function(ids) {
      var _this = this
      _this.simNo = $('#sim_number').val()
      if(!_this.simNo) {
        this.showTip('请输入sim卡号')
        return
      }
      $.ajax({
          dataType: "json",
          type: "POST",
          contentType: "application/json;charset-UTF-8",
          url: _this.url + _this.videoUrl,
          data: JSON.stringify({"simNo": _this.simNo, "channelNums": ids,"streamType":"0","mediaType":"1"}),
          error: function () {
              //alert("网络连接错误，无法读取数据!");
              //Utility.done();
          },
          success: function (data) {
              console.log(data.code)
              if (data.code == 1000) {
                  var _data = data.data
                  var urlList = _data.videoList;
                  _this.sessionId = _data.sessionId;

                  if(urlList && urlList.length != 0) { // 是否有url数据

                      urlList.forEach(function(item,index) { // 遍历url数据

                          // 找到对应通道的视频对象
                          var videoObj = _this.videoList.find(function(a) {
                              return a.passageway === item.channelId
                          })

                          if( videoObj ) {
                              videoObj.createPlayer(item.url) // 创建videoPlayer对象,并开始播放视频
                          }
                           
                          if(!_this.bateTimer) { // 是否有心跳，没有就发送心跳
                              _this.bate()
                          }

                      })
                      if(!_this.vehicleNo) { // 获取车牌号
                          _this.getVehicleNo()
                      }
                  }
              } else if(data.code == 3005) {
                  _this.showTip('设备已离线')
              } else if(data.code == 3007) {
                  _this.showTip('暂无摄像头')
              } else {
                  _this.showTip(data.message)
              }
  
          }
      });
  },
  getPlaybackAjax: function(ids) { // 视频回放
      var _this = this
      _this.simNo = $('#sim_number').val()
      var token = this.token = $('#secret_key').val()
      var channelId = $('#channelId').val()
      var startTime = $('#start_time').val()
      var endTime = $('#end_time').val()
      var url = _this.url = $('#url').val()
      if(!url) {
          this.showTip('请填写资源URL地址')
          return
      }
    //   if(!token) {
    //     this.showTip('请填写客户密钥')
    //     return
    //   }
      if(!channelId) {
        this.showTip('请输入通道号')
        return
      }
      if(!_this.simNo) {
        this.showTip('请输入sim卡号')
        return
      }
      $.ajax({
          dataType: "json",
          type: "POST",
          contentType: "application/json;charset-UTF-8",
          url: _this.url + _this.playbackTimelineUrl,
          data: JSON.stringify({
              "simNo": _this.simNo, 
              "channelId": Number(channelId), 
              "startTime": startTime, 
              "endTime": endTime, 
              "streamType": 0,
              "storeType":0, 
              "dataType": 2,
              "userId": '1260504305044164608'
            }),
          error: function () {
              //alert("网络连接错误，无法读取数据!");
              //Utility.done();
          },
          success: function(data) {
              if(data.code === 1000) {
                  _this.getVideoResources(_this.simNo,channelId,startTime,endTime)
              } else {
                  _this.showTip(data.message)
              }
          }
      })
  },
  getVideoResources: function(simNo,id,startTime,endTime) {
    var _this = this
    $.ajax({
      dataType: "json",
      type: "POST",
      contentType: "application/json;charset-UTF-8",
      url: _this.url + _this.playbackUrl,
      data: JSON.stringify({
          "simNo": simNo, 
          "channelId": Number(id), 
          "startTime": startTime, 
          "endTime": endTime, 
          "streamType": 0,
          "storeType":0, 
          "dataType": 2,
          "playBackType": 0,
          "times": 1,
          "userId": '1260504305044164608'
        }),
      error: function () {
          //alert("网络连接错误，无法读取数据!");
          //Utility.done();
      },
      success: function(data) {
        if (data.code == 1000) {
          var _data = data.data
          var urlList = _data.videoList;
          _this.sessionId = _data.sessionId;

          if(urlList && urlList.length != 0) { // 是否有url数据

              urlList.forEach(function(item,index) { // 遍历url数据

                  // 找到对应通道的视频对象
                  var videoObj = _this.videoList[0]

                  if( videoObj ) {
                      videoObj.createPlayer(item.url) // 创建videoPlayer对象,并开始播放视频
                  }
                   
                  if(!_this.bateTimer) { // 是否有心跳，没有就发送心跳
                    _this.bateTimer = 1
                      _this.bate()
                  }

              })
              if(!_this.vehicleNo) { // 获取车牌号
                  _this.getVehicleNo()
              }
          }
        } else if(data.code == 3005) {
            _this.showTip('设备已离线')
        } else if(data.code == 3007) {
            _this.showTip('暂无摄像头')
        } else {
            _this.showTip(data.message)
        }
      }
    })
  },
  stopVideoAjax: function(ids) { // 停止视频
    console.log(ids)
      var _this = this
      if(Array.isArray(ids)) { // 判断是单个视频播放 还是全部播放
          _ids = ids
      } else {
          _ids = [ids]
      }

      $.ajax({
          dataType: "json",
          type: "POST",
          contentType: "application/json;charset-UTF-8",
          url: _this.url + _this.stopUrl,
          data: JSON.stringify({"simNo": _this.simNo, "channelNums": _ids, sessionId: _this.sessionId}),
          error: function() {
          },
          success: function() {
            _this.cleanPassageway(ids)
          }
      })
  },
  bate: function() { // 开启心跳
      var _this = this
      this.cleanBate()
      function startBate() {
  
          $.ajax({
              dataType: "json",
              type: "GET",
              contentType: "application/json;charset-UTF-8",
              url: _this.url + _this.bateUrl + `?simNo=${_this.simNo}&sessionId=${_this.sessionId}`,
              data:"",
            //   beforeSend: function(request) {
            //     request.setRequestHeader("token",_this.token);
            //   },
              success: function (data) {
  
              },
              error: function (err) {
                  console.log(err)
              }
          })
      }
      startBate()
      _this.bateTimer = setInterval(function () {
          startBate()
      }, 15000)
  },
  cleanBate: function() { // 关闭心跳
      if(this.bateTimer) {
          console.log('清除心跳')
          window.clearInterval(this.bateTimer)
          this.bateTimer = null
      }
  },
  showTip: function(msg) { // 显示提示
      this.closeTip()
      var dom = $('#tip_text_3').text(msg)
      dom.show()
      this.tipTimer = setTimeout(function(){
          dom.hide()
      }, 2000)
  },
  closeTip: function() { // 隐藏提示
      if(this.tipTimer) {
          window.clearTimeout(this.tipTimer)
          this.tipTimer = null
      }
  },
  createVideos: function (options) { // 创建视频dom
      this.cleanVideo()
      var doms = ''
      this.playType = options.playType
      this.url = options.url
      if(options.type !== 'broadcast') {
          this.updatePassageway(1)
      }

      for (var i = 0; i < 16; i++) {
          var video = new videoPlayr({
              passageway: i + 1,
              playType: options.playType,
              getVideoUrl: this.getVideoUrl.bind(this),
              destroyCallback: this.destroyCallback.bind(this),
              playTimeout: this.playTimeout.bind(this)
          })
          video.init()
          doms += video.createElement()
          this.videoList.push(video)
      }

      var tip = '<div class="videolist-tip-text" id="tip_text_1">按 ESC 退出全屏</div><div class="videolist-tip-text" id="tip_text_2">播放异常，请重试</div><div class="videolist-tip-text" id="tip_text_3">暂无摄像头</div>'
      
      $('.video-content').append(doms)
      $(".video-content").append(tip)
  },
  cleanVideo: function() { // 清除视频dom
      $('.video-content').empty()
      this.videoList = []
  },
  openAutoClose: function() { // 打开定时关闭视频
      var _this = this
      this.autoCloseTimeAcc = 0
      this.closeAutoClose()
      if(this.autoCloseTime !== 0) {
          this.autoCloseTimer = setInterval(function() {
              _this.autoCloseTimeAcc += 1
              console.log(_this.autoCloseTimeAcc)
              if(_this.autoCloseTimeAcc >= _this.autoCloseTime) {
                  _this.autoCloseTimeAcc = 0
                  _this.destroyAll()
              }
          }, 1000)
      }
  },
  closeAutoClose: function() {// 关闭定时关闭视频
      if(this.autoCloseTimer) {
          window.clearInterval(this.autoCloseTimer)
          this.autoCloseTimer = null
      }
  },
  updateAutoCloseTime: function(time) { // 更新定时关闭视频时间
      if(time || time === 0) {
          this.autoCloseTime = time 
          this.openAutoClose() // 重置时间
      }
  },
  playAll: function() { // 播放全部视频
      
    if(this.playType === 'broadcast') {
        var passageway = $('#passageway').val()
        var arr = []
        for(var i=0;i<passageway;i++) {
          arr.push(i+1)
        }
        this.getVideoUrl(arr)
    } else {
        this.getVideoUrl([1])
    }
},
  destroyAll: function() { // 销毁所有视频
      for (var video of this.videoList) {
          video.destroy() // 停止
      }
      this.stopVideoAjax([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16])
      this.cleanBate() // 停止心跳
      this.closeAutoClose()
  },
  destroyCallback: function(id) {
      
    this.stopVideoAjax([id])
  },
  playTimeout: function(id) {
    this.cleanPassageway(id)
  },
  cleanPassageway: function(ids){
    var _ids = []
    var arr = []
    if(!Array.isArray(ids)) {
        _ids = [ids]
    } else {
        _ids = ids
    }
    this.passageway.forEach(function(a) {
        var obj = _ids.find(function(item) {
            return item === a
        })
        if(!obj) {
            arr.push(a)
        }
    })
    this.passageway = arr
  },
  stopAll: function() { // 暂停所有视频
      for (var video of this.videoList) {
          video.pause() // 暂停
      }
  },
  updateVehicleNo: function(value) { // 更新车牌显示
      this.videoList.forEach(function(item) {
          item.updateVehicleNo(value)
      })
  },
  updatePassageway: function (num) { // 更新播放显示视频路数
      $('.video-content').attr('class', 'video-content video-passageway-' + num)
  }
}
