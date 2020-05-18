
var videoPlayr = function (options) {

    this.sim = options.sim || ''
    this.passageway = options.passageway || 1
    this.playStatus = 0 // 0：停止； 1：播放； 2：暂停；
    this.getVideoUrl = options.getVideoUrl
    this.destroyCallback = options.destroyCallback
    this.playTimeout = options.playTimeout
    this.type = options.playType || 'broadcast'
    this.video = null
    this.videoElement = null
    this.delayTimer = null
    this.videoClassName = '.passageway-' + this.passageway
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
                _this.handleDelay()
                // videoLoadHide($(this))
            })
            this.playStatus = 1
    
            this.video.attachMediaElement(videoElement);
    
            this.video.load();
            this.video.play();
            this.showLoading()
            this.timeout()
        }
    }

}
videoPlayr.prototype.handleDelay = function() {
    if(this.videoElement) {
        var video = this.videoElement
        this.delayTimer = setInterval(() => {
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