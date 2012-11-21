(function(global, DOC, undefined) {
    var VERSION = '0.2',
        curScriptNode = (function(scripts, node) {
            scripts = DOC.getElementsByTagName('script');
            node = scripts[scripts.length - 1]; //FF下可以使用DOC.currentScript
            return node;
        })(),
        isDebug = !! curScriptNode.getAttribute('debug'),
        MixJSName = curScriptNode.getAttribute('name') || 'MixJS',
        CHARSET = curScriptNode.getAttribute('charset') || 'utf-8',

        //获取当前文件父路径
        PATH = (function(node) {
            var url = node.hasAttribute ? // non-IE6/7
            node.src :
            // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
            node.getAttribute('src', 4);
            return url.substr(0, url.lastIndexOf('/')) + '/';
        })(curScriptNode),
        HEAD = DOC.head || DOC.getElementsByTagName('head')[0] || DOC.documentElement,
        BASEELEMENT = HEAD.getElementsByTagName('base')[0] || null,
        UA = navigator.userAgent,
        isWebKit = ~UA.indexOf('AppleWebKit'),

        reg = /[^, ]+/g,

        _cleanObj = {},
        _emptyArr = [],
        _emptyFn = function() {},
        _arrSlice = _emptyArr.slice,
        /**
         * 数组遍历
         * @param  {[type]}   arr      [description]
         * @param  {Function} callback [description] arrvalue index arr
         * @param  {[type]}   scope    [description]
         * @return {[type]}            [description]
         */
        each = [].forEach ?
    function(arr, callback, scope) {
        [].forEach.call(arr, callback, scope);
    } : function(arr, callback, scope) {
        for(var i = 0, len = arr.length; i < len; i++) {
            if(i in arr) {
                callback.call(scope, arr[i], i, arr);
            }
        }
    };

    var config = {
        path: PATH,
        perload: _emptyArr,
        //预先加载库
        debug: isDebug,
        charset: CHARSET
    },
        _filesMap = {},
        //1:加载之前，2:加载中，3:加载完成
        _modulesMap = {}; //1：定义之前 2：等待依赖关系中 3：定义完成

    var $ = {
        VERSION: VERSION,
        require: function(files, callback) {

            files = unique(files);

            if(files.length === 0) {
                util.isFunction(callback) && callback();
                return this;
            }

            var temp = [];
            each(files, function(v) {
                //先获取url，在判断是否已经加载过了
                var arr = getPath(v),
                    ext = arr[1],
                    url = arr[0];

                if(!loaded(url)) {
                    temp.push(url);
                    var cb = function() {
                            _filesMap[url] = 3;
                            temp.pop();
                            if(temp.length === 0) {
                                callback();
                                temp = null;
                            }
                        };
                    ext === 'css' ? loadCSS(url, cb) : loadJS(url, cb);
                }

            });


            return this;
        },
        use: function(names, callback) {
            names = unique(names);
            if(names.length === 0) {
                callback();
                return this;
            }
            var temp = [];
            each(files, function(v) {                

                if(!defined(v)) {
                    temp.push(v);
                    var cb = function() {
                            _modulesMap[v] = 3;                            
                            temp.pop();
                            if(temp.length === 0) {
                                callback();
                                temp = null;
                            }
                        };
                    _use(v, cb);
                }

            });
            return this;
        },
        define: function(name, deps, factory) {
            if(!util.isString(name)) {
                throw new Error('MixJS.define: name must a string');
                return;
            }
            if(util.isFunction(deps)) {
                factory = deps;
                deps = _emptyArr;
            } else {
                deps = dealArr(deps);
            }

            return this;
        },
        config: function(cfg) {

            config = mix(config, cfg);
            return this;
        },
        util: {
            defined: defined,
            loaded: function(file) {
                var url = getPath(file)[0];
                return loaded(url);
            },
            mix: mix
        }
    };


    var util = $.util;

    //基本类型判断
    'Function,String,Object,Array,Undefined,Boolean,Number'.replace(reg, function(t) {
        util['is' + t] = function(s) {
            return isType(s, t)
        }
    });


    //释放到window
    global[MixJSName] = $;
    MixJSName !== 'MixJS' && (global['MixJS'] = $);

    /**
     * 判断模块是否定义
     * @param  {[type]} module [description]
     * @return {[type]}        [description]
     */

    function defined(module) {
        return _modulesMap[module] === 3;
    }
    /**
     * 判断文件是否加载
     * @param  {[type]} file [description]
     * @return {[type]}      [description]
     */

    function loaded(file) {

        return _filesMap[file] === 3;
    }

    function _use(name, callback){

    }
    /**
     * 数组去重复项和去除空项
     * @param  {[type]} arr [description]
     * @return {[type]}     [description]
     */

    function dealArr(arr) {
        arr = String(arr).split(',');
        var len = arr.length;
        if(len === 0) {
            return arr[0] === '' ? _emptyArr : arr;
        }
        var back = [],
            obj = {},
            val;
        for(var i = 0; i < len; i++) {
            val = arr[i];
            if(val !== '' && !obj[val]) {
                obj[val] = 1;
                back.push(val);
            }
        }
        obj = null;
        return back;
    }


    /**
     * 检测依赖关系是否都加载完成
     * @return {[type]} [description]
     */

    function checkDeps() {

    }
    /**
     * 模块类
     * @param {[type]} id    模块名称
     * @param {Array} deps  依赖模块
     * @param {[type]} maker 制造函数
     * @param {[type]} root  父模块，默认是MixJS
     */

    function Module(id, deps, maker, root) {

        this.id = id;
        this.deps = String(deps).split(','); //必须是数组
        this.maker = maker;
        this.root = root || $;
        this.queue = null;
        this.init();
    }

    var regProtocol = /^(\w+)(\d)?:.*/,
        //协议
        regISJS = /\.js$/,
        //是否为js
        regEXT = /\.(\w+)$/; //后缀
    /**
     * 获取真实url
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */

    function getPath(url, root, ret) {
        root = root || config.path;

        root = root.substr(0, root.lastIndexOf('/'));
        if(regProtocol.test(url)) { //如果用户路径包含协议
            ret = url
        } else {
            var tmp = url.charAt(0),
                _2 = url.slice(0, 2);

            if(tmp !== '.' && tmp != '/') { //相对于根路径
                ret = root + '/' + url;
            } else if(_2 === './') { //相对于兄弟路径
                ret = root + '/' + url.substr(2);
                // $.log(ret+','+2);
            } else if(_2 === '..') { //相对于父路径
                var arr = root.replace(/\/$/, '').split('/');
                tmp = url.replace(/\.\.\//g, function() {
                    arr.pop();
                    return '';
                });
                ret = arr.join('/') + '/' + tmp;
                // $.log(ret);
            }
        }

        var ext = 'js'; //默认是js文件
        tmp = ret.replace(/[?#].*/, '');
        if(regEXT.test(tmp)) {
            ext = RegExp.$1;
        }
        if(ext !== 'css' && tmp === ret && !regISJS.test(ret)) { //如果没有后缀名会补上.js
            ret += '.js';
        }
        return [ret, ext];
    }

    function Queue() {
        // this.moduleName = moduleName;
        this.taskList = [];
        this['@GOD'] = 'QUEUE';
    }
    // Queue.modules = {};
    Queue.prototype.push = function(fn, args, scope) {
        return this._add(fn, args, scope, 'push');
    }
    Queue.prototype.unshift = function(fn, args, scope) {

        return this._add(fn, args, scope, 'unshift');
    }
    Queue.prototype._add = function(fn, args, scope, type) {
        if(!type) {
            return this;
        }

        args = _arrSlice.call(arguments, 0, -1);
        if(args.length === 0) {
            return this;
        }

        this.taskList[type](args);
        $.log('queue lengther ' + type + this.taskList.length)
        return this;
    }
    Queue.prototype.fire = function() {
        if(this._canIDo()) {
            var fn = this.taskList.pop();

            var args = $.isArray(fn[1]) ? fn[1] : [],
                scope = fn[2] || null;
            fn = fn[0];

            // argsFromCall = $.isArray(argsFromCall)?argsFromCall:[argsFromCall];
            // args = args.concat(argsFromCall);
            $.isFunction(fn) && fn.apply(scope, args);
            // this.destroy();
        }
        return this;
    }
    Queue.prototype.destroy = function() {


        $.log('queue destroy');
        this.taskList.length = 0;
        delete this.taskList;
        delete this['@GOD'];
        // delete this.moduleName
        // delete Queue.modules[this.moduleName];
    }
    Queue.prototype._canIDo = function() {
        return this.taskList.length !== 0;
    }


    /**
     * 加载js，css文件通用方法
     * @param  {[type]}   url      [description]
     * @param  {Function} callback [description]
     * @param  {[type]}   fail     [description]
     * @param  {[type]}   charset  [description]
     * @return {[type]}            [description]
     */

    function load(url, callback, fail, charset) {
        if($.isArray(url)) {
            var queue = [],
                cb = function() {
                    var file = queue.shift();

                    if(queue.length === 0) {
                        callback();
                    }
                }
            each(url, function(v, i) {

                queue.push(v);
                _load(v, cb, fail, charset);
            })
        } else {
            _load(url, callback, fail, charset);
        }
        return $;
        // regISCSS.test(url) ? loadCSS(url, callback):loadJS(url, callback, fail, charset);
    }

    function _load(url, callback, fail, charset) {
        var arr = getPath(url),
            url = arr[0];
        if(arr[1] === 'css') {
            loadCSS(url, callback)
        } else {
            loadJS(url, callback, fail, charset);
        }
    }
    /**
     * 加载js
     * @param  {[type]}   url      [description]
     * @param  {Function} callback [description]
     * @param  {[type]}   fail     [description]
     * @param  {[type]}   charset  [description]
     * @return {[type]}            [description]
     */

    function loadJS(url, callback, fail, charset) {
        var node = DOC.createElement('script');
        var args = _arrSlice.call(arguments, 0);
        if($.isString(fail) && args.length === 3) {
            //如果fail为字符串，认为是charset
            charset = fail;
        } else if(args.length === 4 && $.isString(charset)) {

        } else {
            charset = config.charset;
        }
        $.isFunction(callback) && jsCallback(node, callback, fail);

        node.charset = charset;
        node.async = 'async';
        node.src = url;
        HEAD.insertBefore(node, BASEELEMENT);
        return $;
    }

    //jscallback检测
    var regJSLOAD = /loaded|complete|undefined/;

    function jsCallback(node, callback, fail) {

        if($.isFunction(fail)) {
            node.onerror = jsGetCallback(node, fail);
            node.onload = node.onreadystatechange = jsGetCallback(callback);
        } else {
            node.onload = node.onerror = node.onreadystatechange = jsGetCallback(node, callback);
        }

    }
    //js可以检测error，所以加上了这个函数

    function jsGetCallback(node, cb) {
        return function() {
            if(regJSLOAD.test(node.readyState)) {
                // alert(node.src);
                // Ensure only run once and handle memory leak in IE
                node.onload = node.onerror = node.onreadystatechange = null

                // Remove the script to reduce memory leak
                // $.log(!config);
                if(node.parentNode && !config.debug) {
                    HEAD.removeChild(node)
                }

                // Dereference the node
                node = undefined

                cb()
            }
        }

    }
    /**
     * 加载css文件
     * @param  {[type]}   url      [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */

    function loadCSS(url, callback) {
        var node = DOC.createElement('link');
        node.rel = 'stylesheet';
        node.type = "text/css";

        $.isFunction(callback) && cssCallback(node, callback);

        node.href = url;
        HEAD.insertBefore(node, BASEELEMENT);
        return $;
    }
    ///===============>css load检测来自seajs
    // `onload` event is supported in WebKit since 535.23
    // Ref:
    //  - https://bugs.webkit.org/show_activity.cgi?id=38995
    var isOldWebKit = Number(UA.replace(/.*AppleWebKit\/(\d+)\..*/, '$1')) < 536;

    // `onload/onerror` event is supported since Firefox 9.0
    // Ref:
    //  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
    //  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
    var isOldFirefox = UA.indexOf('Firefox') > 0 && !('onload' in DOC.createElement('link'));
    var cssCallback = (isOldWebKit || isOldFirefox) ?
    function(node, callback) {
        setTimeout(function() {
            poll(node, callback)
        }, 1) // Begin after node insertion
    } : function(node, callback) {
        node.onload = node.onerror = function() {
            node.onload = node.onerror = null
            node = undefined
            callback()
        }
    }

    function poll(node, callback) {
        var isLoaded

        // for WebKit < 536
        if(isOldWebKit) {
            if(node.sheet) {
                isLoaded = true
            }
        }
        // for Firefox < 9.0
        else if(node.sheet) {
            try {
                if(node.sheet.cssRules) {
                    isLoaded = true
                }
            } catch(ex) {
                // The value of `ex.name` is changed from
                // 'NS_ERROR_DOM_SECURITY_ERR' to 'SecurityError' since Firefox 13.0
                // But Firefox is less than 9.0 in here, So it is ok to just rely on
                // 'NS_ERROR_DOM_SECURITY_ERR'
                if(ex.name === 'NS_ERROR_DOM_SECURITY_ERR') {
                    isLoaded = true
                }
            }
        }

        setTimeout(function() {
            if(isLoaded) {
                // Place callback in here due to giving time for style rendering.
                callback()
            } else {
                poll(node, callback)
            }
        }, 1)
    }

    /**
     * 获取类型
     * @param  {[type]} obj 要判断的对象
     * @return {String}     返回类型
     */

    function isType(obj, type) {
        return _cleanObj.toString.call(obj).slice(8, -1) === type;
    }

    /**
     * 糅杂
     * @param {Object} target 原有的默认
     * @param {Object} source 第三方来源
     */

    function mix(target, source) {
        var args = _arrSlice.call(arguments),
            i = 1,
            key, self = arguments.callee,
            //如果最后参数是布尔，判定是否覆写同名属性
            ride = $.isBoolean(args[args.length - 1]) ? args.pop() : true;
        if(args.length === 1) {
            target = !this.window ? this : _cleanObj;
            i = 0;
        }

        while((source = args[i++])) {
            //source = [{a:1},{b:3}];
            if($.isArray(source)) {
                for(var n = 0, len = source.length; n < len; n++) {
                    self(target, source[n], ride);
                }

                continue;
            }
            //杂糅只允许对象
            for(key in source) {
                if(ride || !(key in target)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }
}(window, document, undefined));