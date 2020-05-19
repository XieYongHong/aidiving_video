
var videoPlayr = function (options) {

    this.sim = options.sim || ''
    this.passageway = options.passageway || 1
    this.playStatus = 0 // 0：停止； 1：播放； 2：暂停；
    this.type = options.playType || 'broadcast'
    this.video = null
    this.videoElement = null
    this.delayTimer = null
    this.videoClassName = '.passageway-' + this.passageway
    this.getVideoUrl = options.getVideoUrl
    this.destroyCallback = options.destroyCallback
    this.playTimeout = options.playTimeout
}

videoPlayr.prototype.init = function () { // 初始化
    
    window.onresize = function(e) { // 屏幕改变监听
        if(!checkFull()) {
            $('.iconun-full-screen').attr('title','全屏')
            $('.iconun-full-screen').attr('class','iconfont iconfull-screen')
        }
    }

    function checkFull() { // 判断是否全屏
        var isFull =  document.fullscreenEnabled || window.fullScreen || document.webkitIsFullScreen || document.msFullscreenEnabled;
        if(isFull === undefined) isFull = false;
        return isFull;
    }
}
videoPlayr.prototype.createElement = function () { // 创建video标签
    var _this = this
    var videoDOM = `<div class="video-body passageway-${this.passageway} video-${this.type}">
                        <video src="" class="video video-scale" id="video${this.passageway}" muted autoplay></video>
                        <div class="video-bgImg video-scale"></div>
                        <div class="loading video-scale hide-loading">
                            <span class="iconfont iconloading anim anim-totate anim-loop" data-type="1"></span>
                        </div>
                        <div class="tool-bar">
                            <span title="播放" class="iconfont iconplay" data-type="1"></span>
                            <span title="停止" class="iconfont iconstop" data-type="2"></span>
                            <span class="vehicle-number"></span>
                            <span class="passageway-number">通道 ${this.passageway}</span>
                            <span title="截屏" class="iconfont iconscreenshots" data-type="3"></span>
                            <span title="全屏" class="iconfont iconfull-screen" data-type="4"></span>
                        </div>
                    </div>`

    setTimeout(function () {
        _this.tooBtnInit()
    }, 0)
    
    return videoDOM
}
videoPlayr.prototype.tooBtnInit = function () { // 注册bar中的按钮事件
    var _this = this
    var className = this.videoClassName

    $(className + ' .tool-bar').on('click', '.iconfont', function () {
        var type = $(this).data('type')
        var videoBody = $(this).parents('.video-body')[0]
        var videoDOM = $(className + ' .video')[0]
        switch (type) {
            case 1: // 播放
                if(_this.playStatus === 0) { //
                    _this.play()
                }
                break
            case 2: // 停止
                if(_this.playStatus === 1) {
                    _this.destroy()
                    if(_this.destroyCallback) {
                        _this.destroyCallback(_this.passageway)
                    }
                }
                break
            case 3: // 截屏
                _this.screenshots(videoDOM)
                break
            case 4: // 全屏
                if($(this).hasClass('iconun-full-screen')) {
                    _this.exitFullscreen()
                } else {
                    var dom = $('#.tip_text_1')
                    dom.show()
                    setTimeout(function() {
                        dom.hide()
                    }, 1500)
                    _this.fullScreen(videoBody)
                }
                _this.fullScreenChangeType()
                break
            default:
                break
        }
    })
}
videoPlayr.prototype.createPlayer = function (src) {
    if (flvjs.isSupported()) {
        var videoElement = this.videoElement = document.querySelector('#video' + this.passageway)
    
        var _this = this
    
        if (videoElement && src && !this.video) {
            this.video = flvjs.createPlayer({
                type: 'flv',
                isLive: true,
                hasAudio: false,
                hasVideo: true,
                controls: true,
                url: src
            })
    
            videoElement.addEventListener('canplay', function (e) {
                _this.cleanTimeout() // 清除超时计时器
                _this.hideLoading()
                _this.hideMask()
                // videoLoadHide($(this))
            })
            this.playStatus = 1
            
            this.video.attachMediaElement(videoElement);
            
            this.video.load();
            this.video.play();
            this.showLoading()
            this.timeout()
            this.handleDelay()
        }
    }

}
videoPlayr.prototype.handleDelay = function() {
    if(this.videoElement) {
        var video = this.videoElement
        this.cleanDelay()
        this.delayTimer = setInterval(() => {
            console.log('handleDelay')
            if (!video.buffered.length) {
                return;
            }
            let end = video.buffered.end(0);
            let diff = end - video.currentTime;
            if (diff >= 1.5) {
                video.currentTime = end;
            }
        }, 3000);
    }
}
videoPlayr.prototype.cleanDelay = function() {
    if(this.delayTimer) {
        window.clearInterval(this.delayTimer)
        this.delayTimer = null
    }
}

videoPlayr.prototype.play = function () {
    if(this.getVideoUrl) {
        this.getVideoUrl(this.passageway)
    }
}
videoPlayr.prototype.pause = function () { // 暂停
    if(this.video) {
        this.video.pause()
        this.hideLoading()
        this.showMask()
        this.playStatus = 2
    }
}
videoPlayr.prototype.destroy = function () { // 销毁
    if(this.video) {
        this.cleanTimeout()
        this.video.pause()
        this.video.unload();
        this.video.detachMediaElement();
        this.video.destroy();
        this.video = null
        this.playStatus = 0
        this.hideLoading()
        this.showMask()
        this.cleanDelay()
    }
}
videoPlayr.prototype.showLoading = function () { // 显示加载动画
    $(this.videoClassName + ' .loading').show()
}
videoPlayr.prototype.hideLoading = function () { // 隐藏加载动画
    $(this.videoClassName + ' .loading').hide()
}
videoPlayr.prototype.showMask = function () { // 显示背景图
    $(this.videoClassName + ' .video-bgImg').show()
}
videoPlayr.prototype.hideMask = function () { // 隐藏背景图
    $(this.videoClassName + ' .video-bgImg').hide()
}
videoPlayr.prototype.timeout = function () {  // 超时计时器
    var _this = this
    
    this.cleanTimeout()
    this.timer = setTimeout(function () {
        // 显示超时提示 
        _this.playStatus = 0
        if(_this.playTimeout) {
            _this.playTimeout(_this.passageway)
        }
        var dom = $('#tip_text_2')
        var status = dom.is(":hidden")
        if(status) {
            dom.show()
            setTimeout(function() {
                dom.hide()
            }, 2000)
        }
        _this.destroy()
    }, 20000)
}
videoPlayr.prototype.cleanTimeout = function() {  // 清除超时计时器
    if (this.timer) {
        window.clearTimeout(this.timer)
        this.timer = null
    }
}
videoPlayr.prototype.screenshots = function (video) { // 截屏
    // 创建画布
    var canvas = document.createElement('canvas')
    var ctx = canvas.getContext('2d')
    // 设置画布大小
    canvas.width = video.videoWidth || 100
    canvas.height = video.videoHeight || 100
    // 处理跨域
    video.crossOrigin = "";
    // 开始绘制
    ctx.drawImage(video, 0, 0, canvas.width || 100, canvas.height || 100)
    var base64 = canvas.toDataURL('images/jpg')
    this.downloadImage(base64)
}
videoPlayr.prototype.downloadImage = function (base64) {
    //设置下载图片的格式
    var type = "jpeg";
    //将canvas保存为图片
    var imgData = base64.replace(this.imgType(type), "image/octet-stream");

    var filename = this.sim + "_" + this.getTime() + "." + type; //下载图片的文件名

    this.saveFile(imgData, filename);
},
videoPlayr.prototype.updateVehicleNo = function(value) {
    $(this.videoClassName + ' .vehicle-number').text(value)
},
videoPlayr.prototype.getTime = function () {
    var date = new Date()
    var year = date.getFullYear() + ''
    var mounth = date.getMonth() + 1
    var day = date.getDate()
    var hour = date.getHours()
    var min = date.getMinutes()
    var sec = date.getSeconds()

    function handleValue(time) {
        return time > 9 ? time + '' : '0' + time
    }
    return year + handleValue(mounth) + handleValue(day) + handleValue(hour) + handleValue(min) + handleValue(sec)
}
videoPlayr.prototype.imgType = function (ty) {
    var type = ty.toLowerCase().replace(/jpg/i, "jpeg");
    var r = type.match(/png|jpeg|bmp|gif/)[0];
    return "image/" + r;
}
videoPlayr.prototype.saveFile = function (data, fileName) {
    if (window.navigator.msSaveOrOpenBlob) {
        var bstr = atob(data.split(',')[1])
        var n = bstr.length
        var u8arr = new Uint8Array(n)
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }
        var blob = new Blob([u8arr])
        window.navigator.msSaveOrOpenBlob(blob, fileName)
    } else {
        // 这里就按照chrome等新版浏览器来处理
        var a = document.createElement('a')
        a.href = data
        a.setAttribute('download', fileName)
        document.querySelector('body').appendChild(a)
        a.click()
        document.querySelector('body').removeChild(a)
    }
}
videoPlayr.prototype.fullScreen = function (element) { // 进入全屏
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    }
}
videoPlayr.prototype.exitFullscreen = function () { // 退出全屏
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}
videoPlayr.prototype.fullScreenChangeType = function (callback) {
        var isFullscreen = $(this).hasClass('iconun-full-screen')
        if (isFullscreen) {
            $(this.videoClassName+ ' .iconun-full-screen').attr('title','全屏')
            $(this.videoClassName+ ' .iconun-full-screen').attr('class','iconfont iconfull-screen')
        } else {
            $(this.videoClassName+ ' .iconfull-screen').attr('title','退出全屏')
            $(this.videoClassName+ ' .iconfull-screen').attr('class','iconfont iconun-full-screen')
        }
}


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
    userId: '1260504305044164608',
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
                "userId": _this.userId
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
            "userId": _this.userId
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
            this.autoCloseTime = time * 60
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