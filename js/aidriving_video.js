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
                if (_this.playStatus === 0) { //
                    _this.play()
                }
                break
            case 2: // 停止
                if (_this.playStatus === 1) {
                    _this.destroy()
                    if (_this.destroyCallback) {
                        _this.destroyCallback(_this.passageway)
                    }
                }
                break
            case 3: // 截屏
                _this.screenshots(videoDOM)
                break
            case 4: // 全屏
                if ($(this).hasClass('iconun-full-screen')) {
                    _this.exitFullscreen()
                } else {
                    var dom = $('#tip_text_1')
                    dom.show()
                    setTimeout(function () {
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
videoPlayr.prototype.handleDelay = function () {
    if (this.videoElement) {
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
videoPlayr.prototype.cleanDelay = function () {
    if (this.delayTimer) {
        window.clearInterval(this.delayTimer)
        this.delayTimer = null
    }
}

videoPlayr.prototype.play = function () {
    if (this.getVideoUrl) {
        this.getVideoUrl(this.passageway)
    }
}
videoPlayr.prototype.pause = function () { // 暂停
    if (this.video) {
        this.video.pause()
        this.hideLoading()
        this.showMask()
        this.playStatus = 2
    }
}
videoPlayr.prototype.destroy = function () { // 销毁
    if (this.video) {
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
videoPlayr.prototype.timeout = function () { // 超时计时器
    var _this = this

    this.cleanTimeout()
    this.timer = setTimeout(function () {
        // 显示超时提示 
        _this.playStatus = 0
        if (_this.playTimeout) {
            _this.playTimeout(_this.passageway)
        }
        var dom = $('#tip_text_2')
        var status = dom.is(":hidden")
        if (status) {
            dom.show()
            setTimeout(function () {
                dom.hide()
            }, 2000)
        }
        _this.destroy()
    }, 20000)
}
videoPlayr.prototype.cleanTimeout = function () { // 清除超时计时器
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
    videoPlayr.prototype.updateVehicleNo = function (value) {
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
    var requestMethod = element.requestFullScreen || //W3C
        element.webkitRequestFullScreen || //FireFox
        element.mozRequestFullScreen || //Chrome等
        element.msRequestFullScreen; //IE11
    if (requestMethod) {
        requestMethod.call(element);
    } else if (typeof window.ActiveXObject !== "undefined") { //for Internet Explorer
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}
videoPlayr.prototype.exitFullscreen = function () { // 退出全屏
    // 判断各种浏览器，找到正确的方法
    var exitMethod = document.exitFullscreen || //W3C
        document.mozCancelFullScreen || //FireFox
        document.webkitExitFullscreen || //Chrome等
        document.webkitExitFullscreen; //IE11
    if (exitMethod) {
        exitMethod.call(document);
    } else if (typeof window.ActiveXObject !== "undefined") { //for Internet Explorer
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}
videoPlayr.prototype.fullScreenChangeType = function (callback) {
    var isFullscreen = !!$('.iconun-full-screen')[0]
    if (isFullscreen) {
        $(this.videoClassName + ' .iconun-full-screen').attr('title', '全屏')
        $(this.videoClassName + ' .iconun-full-screen').attr('class', 'iconfont iconfull-screen')
    } else {
        $(this.videoClassName + ' .iconfull-screen').attr('title', '退出全屏')
        $(this.videoClassName + ' .iconfull-screen').attr('class', 'iconfont iconun-full-screen')
    }
}

var aidrivingPlayer = {
    videoList: [],
    tipTimer: null, // 提示计时器
    bateTimer: null,
    bateTime: 0,
    autoCloseTimer: null, // 自动关闭计时器
    autoCloseTime: 5 * 60, //
    autoCloseTimeAcc: 0, // 
    config: {
        sessionId: '',
        simNo: '',
        token: '',
        passageway: 1,
        streamType: 1,
        mediaType: 1,
        storeType: 0,
        dataType: 2,
        playBackType: 2,
        userId: '',
        times: 0,
        startTime: '',
        endTime: '',
        playStartTime: '',
        playEndTime: '',
        channelId: 1,
        playType: 'broadcast',
        serverUrl: '',
        getVideoUrl: '/videoapi/openVideo', // 获取视频地址请求
        stopVideoUrl: '/videoapi/closeVideo', // 停止视频请求
        bateUrl: '/videoapi/heartBeat', // 直播心跳
        getVehicleNoUrl: '/gpsroot/vehicle/getPlateNoByVehicle', // 获取车牌号
        playbackTimelineUrl: '/videoapi/videoPlayBack/getResourceListWeb', // 下发历史视频资源列表查询指令
        playbackUrl: '/videoapi/videoPlayBack/sendVideoPlayBackCommandWeb', // 下发远程回放指令
    },
    init: function (options) {
        var videoContentElement = $('.video-content')

        if (!videoContentElement[0]) {
            $.error('没有找到class为 video-content 的标签');
            return
        }

        this.config = Object.assign({}, this.config, options)

        if (this.config.playType !== 'broadcast') {
            this.updatePassageway(1)
        }

        this.createVideos(this.config)

    },
    getVehicleNo: function () { // 获取车牌号
        var config = {
            simNo: this.config.simNo
        }
        this.ajax('POST', this.config.serverUrl + this.config.getVehicleNoUrl, config, function (data) {
            console.log(data)
            $('.vehicle-number').text(data)
        })
    },
    getVideoUrl: function (ids) {
        var _ids = Array.isArray(ids) ? ids : [ids]

        if (!this.config.simNo) {
            alert('请输入SIM卡号')
            return
        }

        if (this.config.playType === 'broadcast') {
            this.getBroadcastUrl(_ids)
        } else {
            this.getPlaybackAjax(_ids)
        }

        this.getVehicleNo()
    },
    getBroadcastUrl: function (ids) {
        var config = {
            simNo: this.config.simNo,
            channelNums: ids,
            streamType: this.config.streamType,
            mediaType: this.config.mediaType
        }

        var handleUrl = data => {
            var videoList = data.videoList

            this.config.sessionId = data.sessionId

            if (videoList && videoList.length) {
                console.log(this.videoList)
                videoList.forEach(item => {
                    var videoObj = this.videoList.find(video => video.passageway === item.channelId)

                    if (videoObj) { // 创建videoPlayer对象,并开始播放视频
                        videoObj.createPlayer(item.url)
                    }

                    if (!this.bateTimer) { // 是否有心跳，没有就发送心跳
                        this.bateTime = 1
                        this.bate()
                    }
                })
            }
        }

        this.ajax('POST', this.config.serverUrl + this.config.getVideoUrl, config, handleUrl)
    },
    getPlaybackAjax: function (ids) {

        var config = {
            simNo: this.config.simNo,
            channelId: Number(this.config.channelId),
            startTime: this.config.startTime,
            endTime: this.config.endTime,
            streamType: this.config.streamType,
            storeType: this.config.storeType,
            dataType: this.config.dataType,
            userId: this.config.userId
        }

        var handleValue = (data) => {
            this.getVideoResources()
        }

        this.ajax('POST', this.config.serverUrl + this.config.playbackTimelineUrl, config, handleValue)
    },
    getVideoResources: function () {
        var config = {
            simNo: this.config.simNo,
            channelId: Number(this.config.channelId),
            startTime: this.config.playStartTime,
            endTime: this.config.playEndTime,
            streamType: this.config.streamType,
            storeType: this.config.storeType,
            dataType: this.config.dataType,
            playBackType: this.config.playBackType,
            times: this.config.times,
            userId: this.config.userId
        }

        var handleValue = (data) => {
            var videoList = data.videoList

            this.config.sessionId = data.sessionId

            if (videoList && videoList.length) {
                videoList.forEach(item => {
                    var videoObj = this.videoList[0]

                    if (videoObj) { // 创建videoPlayer对象,并开始播放视频
                        videoObj.createPlayer(item.url)
                    }

                    if (!this.bateTimer) { // 是否有心跳，没有就发送心跳
                        this.bate()
                    }
                })
            }
        }

        this.ajax('POST', this.config.serverUrl + this.config.playbackUrl, config, handleValue)
    },
    stopVideoAjax: function (ids) {
        var _ids = Array.isArray(ids) ? ids : [ids]
        var config = {
            simNo: this.config.simNo,
            channelNums: _ids,
            sessionId: this.config.sessionId,
        }
        var handleValue = () => {
            this.cleanPassageway(_ids)
        }

        this.ajax('POST', this.config.serverUrl + this.config.stopVideoUrl, config, handleValue)
    },
    bate: function () {
        this.cleanBate()

        var startBate = () => {
            this.ajax('POST', this.config.serverUrl + this.config.bateUrl + `?simNo=${this.config.simNo}&sessionId=${this.config.sessionId}`)
        }

        startBate()

        this.bateTimer = setInterval(startBate, 15000)
    },
    cleanBate: function () { // 关闭心跳
        if (this.bateTimer) {
            console.log('清除心跳')
            window.clearInterval(this.bateTimer)
            this.bateTimer = null
        }
    },
    showTip: function (msg) {
        this.closeTip()
        var dom = $('#tip_text_3').text(msg)
        dom.show()
        this.tipTimer = setTimeout(function () {
            dom.hide()
        }, 2000)
    },
    closeTip: function () { // 隐藏提示
        if (this.tipTimer) {
            window.clearTimeout(this.tipTimer)
            this.tipTimer = null
        }
    },
    cleanPassageway: function (ids) {
        var arr = this.videoList.filter(item => {
            console.log(item)
            return item.playStatus
        })

        if (!arr.length) {
            this.cleanBate()
        }
    },
    createVideos: function (options) {
        this.cleanVideo()
        var doms = ''
        for (var i = 0; i < 16; i++) {
            var video = new videoPlayr({
                passageway: i + 1,
                playType: options.playType,
                getVideoUrl: this.getVideoUrl.bind(this),
                destroyCallback: this.destroyCallback.bind(this),
                playTimeout: this.playTimeout.bind(this)
            })
            doms += video.createElement()
            this.videoList.push(video)
        }

        var tip = '<div class="videolist-tip-text" id="tip_text_1">按 ESC 退出全屏</div><div class="videolist-tip-text" id="tip_text_2">播放异常，请重试</div><div class="videolist-tip-text" id="tip_text_3">暂无摄像头</div>'

        $('.video-content').append(doms)
        $(".video-content").append(tip)
    },
    cleanVideo: function () {
        $('.video-content').empty()
        this.config.videoList = []
    },
    openAutoClose: function () { // 打开定时关闭视频
        var _this = this
        this.autoCloseTimeAcc = 0
        this.closeAutoClose()
        if (this.autoCloseTime !== 0) {
            this.autoCloseTimer = setInterval(function () {
                _this.autoCloseTimeAcc += 1
                console.log(_this.autoCloseTimeAcc)
                if (_this.autoCloseTimeAcc >= _this.autoCloseTime) {
                    _this.autoCloseTimeAcc = 0
                    _this.destroyAll()
                }
            }, 1000)
        }
    },
    closeAutoClose: function () { // 关闭定时关闭视频
        if (this.autoCloseTimer) {
            window.clearInterval(this.autoCloseTimer)
            this.autoCloseTimer = null
        }
    },
    updateAutoCloseTime: function (time) { // 更新定时关闭视频时间
        if (time) {
            this.autoCloseTime = time * 60
            this.openAutoClose() // 重置时间
        } else {
            this.closeAutoClose()
        }
    },
    playAll: function () { // 播放全部视频
        if (this.config.playType === 'broadcast') {
            var passageway = this.config.passageway
            var arr = []
            for (var i = 0; i < Number(passageway); i++) {
                arr.push(i + 1)
            }
            this.getVideoUrl(arr)
        } else {
            this.getVideoUrl([1])
        }
    },
    destroyAll: function () { // 销毁所有视频
        for (var video of this.videoList) {
            video.destroy() // 停止
        }
        this.stopVideoAjax([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
        this.cleanBate() // 停止心跳
        this.closeAutoClose()
    },
    destroyCallback: function (id) {
        this.stopVideoAjax([id])
    },
    playTimeout: function (id) {
        this.cleanPassageway(id)
    },
    updatePassageway: function (num) { // 更新播放显示视频路数
        this.config.passageway = num
        $('.video-content').attr('class', 'video-content video-passageway-' + num)
    },
    ajax: function (type, url, data, callback) {
        var _this = this
        $.ajax({
            dataType: 'json',
            type: type,
            url: url,
            contentType: 'application/json;charset-UTF-8',
            data: data ? JSON.stringify(data) : {},
            error: function () {},
            success: function (data) {
                var code = data.code
                if (code === 1000) {
                    if (callback) {
                        callback(data.data)
                    }
                } else if (data.code == 3005) {
                    _this.showTip('设备已离线')
                } else if (data.code == 3007) {
                    _this.showTip('暂无摄像头')
                } else {
                    _this.showTip(data.message)
                }
            }
        })
    }
}

document.addEventListener("fullscreenchange", function () {

    var isFull = document.fullscreenElement ||

        document.msFullscreenElement ||

        document.mozFullScreenElement ||

        document.webkitFullscreenElement || false;
        console.log(isFull)
    if (!isFull) { // 退出全屏
        $('.iconun-full-screen').attr('title', '全屏')
        $('.iconun-full-screen').attr('class', 'iconfont iconfull-screen')
    }
}, false);

document.addEventListener("mozfullscreenchange", function () {

    var isFull = document.fullscreenElement ||

        document.msFullscreenElement ||

        document.mozFullScreenElement ||

        document.webkitFullscreenElement || false;
        console.log(isFull)
    if (!isFull) { // 退出全屏
        $('.iconun-full-screen').attr('title', '全屏')
        $('.iconun-full-screen').attr('class', 'iconfont iconfull-screen')
    }
}, false);

document.addEventListener("webkitfullscreenchange", function () {

    var isFull = document.fullscreenElement ||

        document.msFullscreenElement ||

        document.mozFullScreenElement ||

        document.webkitFullscreenElement || false;
        console.log(isFull)
    if (!isFull) { // 退出全屏
        $('.iconun-full-screen').attr('title', '全屏')
        $('.iconun-full-screen').attr('class', 'iconfont iconfull-screen')
    }
}, false);

document.addEventListener("msfullscreenchange", function () {

    var isFull = document.fullscreenElement ||

        document.msFullscreenElement ||

        document.mozFullScreenElement ||

        document.webkitFullscreenElement || false;
        console.log(isFull)
    if (!isFull) { // 退出全屏
        $('.iconun-full-screen').attr('title', '全屏')
        $('.iconun-full-screen').attr('class', 'iconfont iconfull-screen')
    }
}, false);