## 图片懒加载组件

> 作者：冬玉

### 需求描述
-----------------------
__背景：__
由于移动端网速限制, 为加快页面加载速度, 避免产生不必要的流量消耗, 图片采用按需加载方式.

__设计懒加载组件，需要支持以下几个功能：__

* 支持自定义定义组件有效范围
* 支持 scroll 事件和 CSS3 transform
* 支持自定义预加载距离
* 提供事件绑定
* 支持组件功能开启和关闭

### 设计思路
------------------------
__判断 transfrom 模式下的元素位置__

* 移动端元素滚动一般有两种方式. 
  
  1. 第一种是传统的滚动条滚动, 子元素滚动时, 父元素会触发 `scroll` 事件
  2. 第二种是通过 CSS3 的 `transfrom` 形式移动子元素位置来实现模拟滚动

* 使用 getBoundingClientRect() 接口
  
  用于获取元素显示位置相对于浏览器窗口位置, 返回对象属性包括 top, bottom, left, right, width, height 用于表示元素和浏览器窗口左上顶点的位置.

__矩形相交算法__

* 要同时支持横向和纵向滚动, 不能只判断检测元素同视口上下边相交或左右边相交, 认为检测元素可以从任意方向进入视口, 则需要判断矩形相交 
  
  判断相交: 两矩形重心连线 x 轴方向投影小于两矩形宽度和的 1/2, 且重心连线 y 轴方向投影小于两矩形高度和的 1/2, 则两矩形相交.

  ```
  distanceX: 两矩形重心连线 x 轴方向投影
  distanceY: 两矩形重心连线 y 轴方向投影
  totalX: 两矩形宽度和
  totalY: 两矩形高度和

  (distanceX < (totalX / 2)) && (distanceY < (totalY / 2))
  ``` 

__开放检测函数__

* 传统滚动条方式, 可以通过监听父元素的 scroll 事件来不断侦测是否有元素进入视口. 如果采用 transform 方式滚动, 则没有 scroll 事件被触发, 由于无法预测用户使用什么方式来触发 transform 形式的滚动 (可能为 touchmove, touchstart 或者一些其他事件), 因此开放检测懒加载元素进入视口的接口, 供用户调用. [ scroll形式滚动不用做操作, 组件会自动进行绑定 ]


### 使用手册
---------------------
__1. bower 支持, 不依赖其他组件或库__
```
bower install image-lazyloader
```
__2、使用方法及各配置项的含义如下__

  * 最简单的方式

  HTML 部分
  
    ```HTML
      <img class="lazy" data-src="test.jpg">
    ```
  JavaScript 部分
  
    ```javascript
      var lazyloader = new Lazyloader();
    ```
  用于满足常用需求, 针对在 window 内部的文档进行懒加载, 懒加载元素为 class 属性中带有 lazy 的 <img> 标签, 懒加载图片元素要带有 data-src 属性用于声明图片 url 地址.

  * 指定组件作用范围

    ```javascript
      var lazyloader = new Lazyloader('#container');
    ```
    ```javascript
      var container = document.getElementById('container');
      var lazyloader = new Lazyloader(container);
    ```
  Lazyloader 构造函数的第一个参数用于指定组件的作用范围, 可以是 CSS 选择器字符串 或者 DOM 元素. [ 注: scroll 形式下该元素的 CSS overflow 属性可能是 auto, transfrom 形式下该元素的 CSS overflow 属性可能是 hidden ]


  * 更多的组件配置

    * 指定组件的 options 有两种方式

        作用范围为 window
        ```javascript
          var lazyloader = new Lazyloader(options);
        ```
        作用范围为 container
        ```javascript
          var lazyloader = new Lazyloader(container, options);
        ```
    * options 属性
    
        * `enable`          : {Boolean}   
          默认值: true.    指定组件在构建后是否启用
        * `targetClass`     : {String}    
          默认值: 'lazy'.  指定懒加载元素的识别 class
        * `loadingClass`    : {String}    
          默认值: ''.      指定懒加载元素在加载状态时添加的 class
        * `loadedClass`     : {String}    
          默认值: ''.      指定懒加载元素在加载完成时添加的 class
        * `placeholder`     : {String}    
          默认值: 2*2 大小的透明 png 图片. 指定在元素未加载完成时懒加载元素使用的图片, 用于过渡.
        * `preLoadDistance` : {Number}    
          默认值: 0.       指定在距离加载区域多少像素时, 懒加载元素进行加载.
        * `itemstart`       : {Function}  
          默认值: 无.      指定当懒加载元素进行加载时执行的函数, 懒加载元素会作为参数传递到回调函数中.
        * `itemloaded`      : {Function}  
          默认值: 无.      指定当懒加载元素完成加载时执行的函数, 懒加载元素会作为参数传递到回调函数中.
        * `start`           : {Function}  
          默认值: 无.      指定组件启用时的回调函数.
        * `stop`            : {Function}  
          默认值: 无.      指定组件停用时的回调函数.

    * 方法

        * `enable`

        ```javascript
          lazyloader.enable({Boolean});
        ```
        enable 方法用于控制组件传统滚动方式的启用和停用. 传递参数为布尔值, true 为启用, false 为停用
    
        * `isEnable`

        ```javascript
          lazyloader.isEnable();
        ```
        isEnable 方法用于查看组件状态, 返回值为 true (启用) / false (停用)
    
        * `sniffer`
        
        ```javascript
          someElement.addEventListener('someEvent', function() {
            //...
            lazyloader.sniffer();
            //...
          }, false);
        ```
        由于无法预测用户使用什么方式来触发 transform 形式的滚动, 提供用户检测接口, 用户可根据需求调用, 以提高灵活性.
