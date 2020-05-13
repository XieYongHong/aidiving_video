# 天巡视频组件API

### 兼容性

`aidiving.js`不支持IE浏览器，因`aidiving.js`使用了`ES6`的特性，推荐使用[Chrome浏览器](https://v.car900.com/resource/ChromeSetup.exe)



### 演示Demo
- [在线访问](https://v.car900.com/api/demo.html)

- 视频服务：wss://videostream.car900.com/

- 客户代码：c4d1fbb6-2dc5-4f86-a5da-893f80e9d80a

- 终端号：13011222211
## 文件引入
### css引入

- 下载直接引入：
``` html
    <link rel="stylesheet" href="./css/iconfont.css">
    <link rel="stylesheet" href="./css/aidriving_video.css">
```
需要将css文件夹下的 名为`iconfont`的6个文件引入到`iconfont.css`同级目录下

### JS引入

- 下载直接引入：
``` html
    <script src='./aidiving.js'></script>
```

## 接口说明
### aidiving.js

`aidiving.js`通过在`window`对象上公开`byskplayer`类导出所有接口

构造函数：
- [new videoPlayr()](#new-videoPlayr)

实例属性：
- [videoPlayr.sim](#videoplyersim)
- [videoPlayr.passageway](#)
- [videoPlayr.playType](#)

实例方法
- [videoPlayr.createElement](#)
- [videoPlayr.updatePassageway](#)
- [videoPlayr.updateVehicleNo](#)
- [videoPlayr.play](#)
- [videoPlayr.pause](#)
- [videoPlayr.destroy](#)
- [videoPlayr.getVideoUrl](#)
- [videoPlayr.destroyCallback](#)

### new videoPlyer()
```js
let videoPlyer = new videoPlayer(config)
```

根据`config`创建`byskplayer`实例

**config**
