/**
 * description : a image lazyload tool (support DOM scroll and css3 transform)
 * update      : 2014-08-27
 * email       : juexin.wjx@alibaba-inc.com
 * author      : dongyu
 * version     : 0.0.2
 */

;(function(window, undefined) {

  'use strict';

  // util: 工具对象, 封装常用功能函数

  var util = (function() {
    
    /**
     * 类型验证函数生成器
     * @param  {String} type 验证类型, 例: isType('Object') 返回 Object 验证函数
     * @return {Boolean}
     */
    function isType(type) {
      if (type === 'DOMElement') {
        return function(obj) {
          return /^\[object HTML\w*Element\]$/.test(Object.prototype.toString.call(obj));
        }
      } else {
        return function(obj) {
          return Object.prototype.toString.call(obj) === '[object ' + type + ']';
        }
      }
    }

    // 数据类型验证函数
    var isObject     = isType('Object');
    var isString     = isType('String');
    var isArray      = Array.isArray || isType('Array');
    var isFunction   = isType('Function');
    var isDOMElement = isType('DOMElement');

    /**
     * H5 DATA 操作
     * @param  {DOMElement} element 需查询/设置 DATA 属性元素
     * @param  {String} name 'data-'后方属性名
     * @param  {String} [value] 不提供: 进行查询操作, 提供: 进行设置操作
     * @return {String | undefined} 查询返回对应属性值, 设置无返回值
     */
    function data(element, name, value) {
      if (value) {  // set
        element.setAttribute('data-' + name, value);
      } else {  // get
        return element.getAttribute('data-' + name);
      }
    }

    /**
     * 将 DOM 元素 className 字段转换为数组
     * @param  {String | Array} classString  DOM 元素的 className 字段
     * @return {Array} 返回生成数组
     */
    function toArray(classString) {
      if (isString(classString)) {
        return classString.split(/\s+/); // ' a b cccc' -> ["", "a", "b", "cccc"] 空不做处理
      } else if (isArray(classString)) {
        return classString;
      }
    }

    /**
     * DOM 操作 为 DOM 元素添加 class
     * @param {String | DOMElement} element 目标元素 DOM 或者对应的 CSS 选择器
     * @param {String | Array} classes 要添加的类 'class1 class2' 或者 ['class1', 'class2']
     */
    function addClass(element, classes) {
      
      var classArray = toArray(classes);
      var elementClassArray = element.className.split(/\s+/);

      for (var i = 0, classArrayLen = classArray.length; i < classArrayLen; i++) {
        var exist = false;
        for (var j = 0, elementClassArrayLen = elementClassArray.length; j < elementClassArrayLen; j++) {
          if (classArray[i] === elementClassArray[j]) {
            exist = true;
            break;
          }
        }
        if (!exist) {
          elementClassArray.push(classArray[i]);
        }
      }
      element.className = elementClassArray.join(' ');
    }

    /**
     * DOM 操作 为 DOM 元素删除 class
     * @param {String | DOMElement} element 目标元素 DOM 或者对应的 CSS 选择器
     * @param {String | Array} classes 要删除的类 'class1 class2' 或者 ['class1', 'class2']
     */
    function removeClass(element, classes) {

      var classArray = toArray(classes);
      var elementClassArray = element.className.split(/\s+/);

      for (var i = 0, classArrayLen = classArray.length; i < classArrayLen; i++) {
        for (var j = elementClassArray.length - 1; j >= 0; j--) {
          if (classArray[i] === elementClassArray[j]) {
            elementClassArray.splice(j, 1);
          }
        }
      }
      element.className = elementClassArray.join(' ');
    }

    // 开放接口
    return {
      isObject: isObject,
      isString: isString,
      isArray: isArray,
      isFunction: isFunction,
      isDOMElement: isDOMElement,
      data: data,
      addClass: addClass,
      removeClass: removeClass
    };

  })();

  // 创建 Lazyloader 对象构造函数, 用于生成可供用户操作的懒加载对象
  
  var Lazyloader = (function() {

    // 初始化窗口大小, window resize 时更新
    var WIN_WIDTH = window.innerWidth;
    var WIN_HEIGHT = window.innerHeight;
    
    window.addEventListener('resize', function() {
      WIN_WIDTH = window.innerWidth;
      WIN_HEIGHT = window.innerHeight;
    });

    // 默认填充图片 DATAURL 减少数据请求 [2x2 透明 png]
    var DEFAULT_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAADklEQVQIW2NkgAJGGAMAAC0AA7HLAIQAAAAASUVORK5CYII=';
    
    /**
     * 判断元素是否在视口中
     * @param  {DOMElement}  container   容器 DOM 元素
     * @param  {DOMElement}  element     容器中要判断是否进入视口的 DOM 元素
     * @param  {Number}  preLoadDistance 预加载扩展距离 (单位: 像素)
     * @return {Boolean}                 目标元素是否进入加载范围
     */
    function isInViewPort(container, element, preLoadDistance) {
      var cRect = container.getBoundingClientRect();
      var eRect = element.getBoundingClientRect();

      var view = {
        top: cRect.top - preLoadDistance,
        bottom: cRect.bottom + preLoadDistance,
        left: cRect.left - preLoadDistance,
        right: cRect.right + preLoadDistance
      };

      var win = {
        top: 0 - preLoadDistance,
        bottom: WIN_HEIGHT + preLoadDistance,
        left: 0 - preLoadDistance,
        right: WIN_WIDTH + preLoadDistance
      };

      var isInViewPort = rectIntersect(view, eRect);
      var isInWindow = rectIntersect(win, eRect);

      // 矩形相交算法
      function rectIntersect(rect1, rect2) {
        var distanceX = Math.abs(((rect2.left + rect2.right) / 2) - ((rect1.left + rect1.right) / 2));
        var distanceY = Math.abs(((rect2.top + rect2.bottom) / 2) - ((rect1.top + rect1.bottom) / 2));

        var totalX = (rect1.right - rect1.left) + (rect2.right - rect2.left);
        var totalY = (rect1.bottom - rect1.top) + (rect2.bottom - rect2.top);

        return (distanceX < (totalX / 2)) && (distanceY < (totalY / 2));
      }
      return isInViewPort && isInWindow;
    }

    /**
     * 加载图片
     * @param  {DOMElement} element   未加载的图片元素
     * @param  {Object} eventsController  Lazyloader 的事件通知对象
     */
    function loadImage(element, eventsController) {
      var image = new Image();
      var src = util.data(element, 'src');
      image.onload = function() {
        eventsController.emit('itemloaded', element);
        element.src = src;
      };
      // load
      image.src = src;
      eventsController.emit('itemstart', element);
    }


    return function(element, options) {

      var self = this;

      // 参数处理 (参数 element 非 DOM 元素情况)
      if (typeof element === 'undefined') { 
        // 1. 0 参数
        element = window;
      }
      if (util.isObject(element) && (typeof options === 'undefined')) { 
        // 2. 只传一个参数且类型为 Object
        options = element;
        element = window;
      }

      var options = options || {};

      // DOMs
      var container = null;
      var scrollTrigger = null;
      var lazyItems = null;
      var unloadedItemsCopy = null;
      
      // options
      var enable = (typeof options.enable !== 'undefined') ? options.enable : true;
      var targetClass = options.targetClass || 'lazy';
      var loadingClass = options.loadingClass || '';
      var loadedClass = options.loadedClass || '';
      var placeholder = options.placeholder || DEFAULT_PLACEHOLDER;
      var preLoadDistance = (typeof options.preLoadDistance !== 'undefined') ? options.preLoadDistance : 0;
      
      // events controller
      var eventsController = (function() {
        var events = {};
        return {
          on: function(name, callback) {
            var list = events[name] || (events[name] = []);
            list.push(callback);
          },
          off: function(name, callback) {
            if (!(name || callback)) {
              events = {};
              return;
            }

            var list = events[name];
            if (list) {
              if (callback) {
                for (var i = list.length - 1; i >= 0; i--) {
                  if (list[i] === callback) {
                    list.splice(i, 1);
                  }
                }
              } else {
                delete events[name];
              }
            }
          },
          emit: function(name, data) {
            var list = events[name];
            if (list) {
              list = list.slice();
              for (var i = 0, len = list.length; i < len; i++) {
                list[i](data);
              }
            }
          }
        };
      })();

      /*-- Detail Start --*/

      // 用于初始化数据
      function init() {
        // 初始化 container & scrollTrigger
        if (util.isString(element)) {
        // 1. 参数为 CSS 选择器
          try {
            container = document.querySelector(element);
            scrollTrigger = container;
          } catch (e) {
            throw new Error('Lazyloader 构造函数参数不合法, 请使用合法 CSS 选择器或者 DOM 元素.');
          }
        } else if (util.isDOMElement(element)) {
        // 2. 参数为 DOMElement
          container = element;
          scrollTrigger = container;
        } else if (element === window) {
        // 3. 参数为 window 对象
          container = document.documentElement;
          scrollTrigger = window;
        } else {
          throw new Error('参数类型需要为 String 或 DOMElement');
        }

        // 初始化 lazyItems
        lazyItems = container.querySelectorAll('.' + targetClass);
        
      }
      // 组件启用函数
      function start() {
        eventsController.emit('start');
        scrollingProcessor();
        scrollTrigger.addEventListener('scroll', scrollingProcessor, false);
        enable = true;     
      }
      // 组件停用函数
      function stop() {
        eventsController.emit('stop');
        scrollTrigger.removeEventListener('scroll', scrollingProcessor, false);
        enable = false;      
      }
      // 注册相关事件
      function register() {
        eventsController.on('enable', function() {
          !enable && start();
        });
        eventsController.on('disable', function() {
          enable && stop();
        });
        eventsController.on('itemstart', function(item) {
          util.addClass(item, loadingClass);
          util.data(item, 'lazy-status', 'loading');
        });
        eventsController.on('itemloaded', function(item) {
          util.removeClass(item, loadingClass);
          util.addClass(item, loadedClass);
          util.data(item, 'lazy-status', 'loaded');
        });

        options.onitemstart && eventsController.on('itemstart', options.onitemstart);
        options.onitemloaded && eventsController.on('itemloaded', options.onitemloaded);

        options.onstart && eventsController.on('start', options.onstart);
        options.onloaded && eventsController.on('stop', options.onstop);
      }
      // 滚动处理函数
      function scrollingProcessor() {
        setTimeout(function() {
          for (var i = unloadedItemsCopy.length - 1; i >= 0; i--) {
            var item = unloadedItemsCopy[i];
            if (isInViewPort(container, item, preLoadDistance)) {
              loadImage(item, eventsController);
              Array.prototype.splice.call(unloadedItemsCopy, i, 1);
            }
          }
        }, 0);
      }

      self.enable = function(isEnable) {
        var self = this;
        if (!!isEnable) {
          eventsController.emit('enable');
        } else {
          eventsController.emit('disable');
        }
        return self;
      };

      self.isEnable = function() {
        var self = this;
        return enable;
      };

      // DOM 结构变更, 或 innerHTML 填充后调用, 用于重新获取和初始化未加载需检测元素
      // 更新 unloadedItemsCopy, 初始化 data-lazy-status 字段
      self.refresh = function() {
        var self = this;

        for (var i = 0, len = lazyItems.length; i < len; i++) {
          if (!util.data(lazyItems[i], 'lazy-status')) {
            util.data(lazyItems[i], 'lazy-status', 'unload');
            lazyItems[i].src = placeholder;
          }
        }

        var unloadedItems = container.querySelectorAll('.' + targetClass + '[data-lazy-status=\"unload\"]')
        unloadedItemsCopy = Array.prototype.slice.call(unloadedItems);
      };

      // 加载检测函数, 一般绑定在需要探测图片是否加载时调用, 可以绑定在 TouchEvent 和 Scroll 事件上.
      self.sniffer = function() {
        scrollingProcessor();
      };
      
      init();
      self.refresh();
      register();

      // 如果启用则绑定滚动事件
      enable && start();

    };

  })();

  Lazyloader.prototype = {

  };

  // 添加 Sea.js 和 AMD 库支持. [ require.js... ]

  if (typeof define === 'function') {
    define(function() {
      return {
        Lazyloader: Lazyloader
      };
    });
  }
  
  // 添加 CommomJS 库支持. [ browserify... ]

  if (typeof exports !== 'undefined') {
    exports.Lazyloader = Lazyloader;
  }

  // 不支持 CommonJS 和 AMD/CMD 定义全局变量

  if (typeof window !== 'undefined') {
    window.Lazyloader = Lazyloader;
  }

})(window);