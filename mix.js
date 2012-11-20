(function(global, DOC, undefined) {
    var VERSION = '0.1',
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
        now = +new Date,

        reg = /[^, ]+/g,

        _timeout = 3e4,
        //30秒超时
        _requireModuleMap = {},
        //require hashmap,1--->发送请求之前，2--->正在加载，3-->加载成功
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
        timeout: _timeout,
        //暂时无用
        debugLevel: isDebug ? 7 : 8,
        //debug级别，用法详见log方法
        debug: isDebug,
        charset: CHARSET
    }
    var moduleQueue = new Queue();
    var $ = {
        version: VERSION,
        now: now,
        path: PATH,
        head: HEAD,
        reg: reg,
        log: log,
        emptyFn: _emptyFn,
        mix: mix,
        each: each,
        load: load,
        loadJS: loadJS,
        loadCSS: loadCSS,
        defined: Module.defined,
        noConflict: function() {
            return this;
        },
        /**
         * 设置
         * @param  {[type]} cfg [description]
         * @return {[type]}     [description]
         */
        config: function(cfg) {
            config = mix(config, cfg);
        },
       
        /**
         * 模块调用
         * @param  {[type]}   ids      [description]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        use: function(ids, callback) {

            if(config.preload && config.preload.length !== 0) {
                $.load(config.preload, function() {
                    config.preload.length = 0;
                    _require(ids, cb)
                })
            } else {
                _require(ids, cb)
            }

            var self = this;
            function cb(){
                callback(self);
            }
            return this;
        },

        /**
         * 模块定义
         * @param  {[type]} id     模块id。支持event.broadcast这样的
         * @param  {[type]} deps    依赖关系
         * @param  {[type]} maker   模块制造工厂函数，return出来的才是真正的module
         * @return {[type]}         this
         */
        define: function() {
            var args = _arrSlice.call(arguments, 0);
            switch(args.length) {
            case 0:
                throw new Error('define error: arguments length error');
                break;
            case 1:
                //假如为一个，并且是object，那么mix到$
                $.isObject(args[0]) && mix($, args[0]);
                break;
            case 2:
                //如果第二个参数是fn，则补充依赖关系，后执行case 3
                _emptyArr.splice.call(args, 1, 0, []);
            case 3:
                //args[1] = ;
                var id = args[0].replace('/', '.'); //event/bindEvent => event.bindEvent;
                new Module(id, args[1], args[2]);
                break;
            }
            return this;
        }
    };
    //基本类型判断
    'Function,String,Object,Array,Undefined,Boolean,Number'.replace(reg, function(t) {
        $['is' + t] = function(s) {
            return isType(s, t)
        }
    });
    //释放到window
    global[MixJSName] = $;
    MixJSName !== 'MixJS' && (global['MixJS'] = $);
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
    //销毁
    Module.prototype.destroy = function() {
        $.log('Module.destroy ' + this.id + ' destroy');
        delete this.maker;
        this.deps.length = 0;
        delete this.deps;
        delete this.root;
        try {
            this.queue.destroy();
        } catch(e) {}

        delete this.queue;

        // try{
        //     var q = Module._queue[this.id];
        //     q.destroy();
        //     delete q;
        // }catch(e){
        // }
        delete this.id;

    }
    Module.prototype.init = function() {
        if(Module.defined(this.id, this.root)) {
            //已经定义过的
            return this;
        }
        var deps = this.deps,
            t = [];
        each(this.deps, function(v) {
            v !== '' && t.push(v /*.replace('.','/')*/ );
        });
        this.deps = deps = t;


        // var q = new Queue(this.id);
        //设置步长，订阅消息：命名空间和销毁
        moduleQueue.push(this.namespace, [], this);
        $.log('Module.init:[' + this.id + ']add to Queue');

        deps._qname = this.id;
        if(deps.length === 0) {
            moduleQueue.fire();
        } else {

            _require(deps, function() {
                moduleQueue.fire();
            });
        }

        return this;
    }
    /**
     * 模块是否定义
     * 判断一个模块是否通过define定义的
     * @param  {[type]} id   [description]
     * @return {[type]}      [description]
     */
    Module.defined = function(id) {
      
        return _requireModuleMap[id] === 3;
    }

    Module.prototype.namespace = function() {
        $.log('namespace===>' + this.id);
        if(!this.id) {
            return;
        }
        var needModules = Module._needModule[this.id];

        var selfFn = arguments.callee,
            self = this;
        if($.isArray(needModules)) {

            for(var i = 0, len = needModules.length; i < len; i++) {

                var file = _requireModuleMap[needModules[i]];

                if(file !== 3) {
                    $.log('namespage====' + this.id + '不符合ready要求');
                    //重新压入栈
                    moduleQueue.push(selfFn, [], self);
                    return;
                }
            }
        }

        var names = this.id.split('.'),
            root = this.root;

        var name;
        while(name = names.shift()) {
            if(names.length) {
                // console.log(root);            
                root = (root[name] = root[name] || {});
            } else {
                if($.isUndefined(root[name])) {

                    try {
                        var f = $.isFunction(this.maker) && this.maker(this.root);
                        if(f) {
                            f['@GOD'] = 'THEO';//加个尾巴~
                            root[name] = f;
                            _requireModuleMap[this.id] = 3;
                            // Module._definedModulesMap[this.id] = 1;
                            // q.shift();
                        }
                    } catch(e) {
                        // Module._definedModulesMap[this.id] = 2;//模块定义可能出错了
                        throw new Error('Module.namespace:id=>' + this.id + ',info=>' + e.message);
                    }
                }
            }
        }
        //检查下上级模块是否符合callback？
        moduleQueue.fire();

        this.destroy();
    }
    // Module._cache = {}; //缓存
    Module._depsMap = {}; //
    Module._needModule = {}; //进行定义还差哪些模块
    // Module._modules = {};//Module实例
    // Module._definedModulesMap = {};//已经定义过的module，1：定义过，2：定义出错过的
    // Module._queue = {};//队列实例
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
    /**
     * 高效队列
    var q = new Queue();
    var now = +new Date;
    q.on(function(){$.log('success')}).on(function(){$.log('success2')})
    for(var i = 0;i<10000;i++){
        q.push(i);
    }
    while(q.getLength(){
        q.shift();
    }
    $.log(new Date-now);
     * 
     */
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
     * 请求一个或者多个模块
     * @param  {[type]}   ids      模块ids
     * @param  {Function} callback 加载成功后回调函数
     * @param  {[type]}   fail     如果有没有加载成功，则执行fail
     * @return {[type]}            [description]
     */

    function _require(ids, callback /*, fail*/ ) {

        if(!ids) {
            return;
        }
        moduleQueue.push(check);
        var parentModule;

        if(parentModule = ids._qname) {

        } else {
            ids = String(ids).split(',');
        }
        var queue = [];
        if(ids.length === 0) {
            moduleQueue.fire();
        }

        each(ids, function(v, i, arr) {
            
            if(v) {
                var arr = getPath(v),
                    url = arr[0],
                    ext = arr[1],
                    mName = v.replace('/','.');

                // debugger;           
                //判断是否有依赖关系  
                if(parentModule) {
                    Module._depsMap[url] = parentModule;

                    $.log('发现&添加【依赖关系表】:' + mName);
                    if(!Module._needModule[parentModule]) {
                        Module._needModule[parentModule] = [];
                    }
                    Module._needModule[parentModule].push(mName);
                }

                //因为php实时合并或者提前引用，加一层判断，防止重复加载
                if(Module.defined(mName)) {
                    queue.push(url);
                    cb();
                    return;
                }

                if(!_requireModuleMap[mName]) {

                    queue.push(url);
                    // debugger;
                    _requireModuleMap[mName] = 1; //开始加载之前，beforeSend
                    if(ext === 'js') {

                        loadJS(url, cb);
                    } else {
                        loadCSS(url, cb);
                    }
                    _requireModuleMap[mName] = 2; //正在发送请求
                    $.log(url + '=====> loading');
                }
            }

        });                 

        function cb() {
            queue.shift();            

            if(queue.length === 0) {
                moduleQueue.fire();
            }
        }
        function check(){
            var doit = true;
            for(var i = 0,len = ids.length;i<len;i++){
                var v = ids[i].replace('/','.');
                if(!Module.defined(v)){
                    doit = false;
                    break;
                }
            }
            if(doit){
                callback();  

            }else{
                moduleQueue.push(check);
            }            
        
        }
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
    //log(str, showInPage=true, 5 )，
    //受mass框架启发~
    //level Number，通过它来过滤显示到控制台的日志数量。0为最少，只显示最致命的错误，
    //7则连普通的调试消息也打印出来。 显示算法为 level <= $.config.level。
    //这个$.colre.level默认为9。下面是level各代表的含义。
    //0 EMERGENCY 致命错误,框架崩溃
    //1 ALERT 需要立即采取措施进行修复
    //2 CRITICAL 危急错误
    //3 ERROR 异常
    //4 WARNING 警告
    //5 NOTICE 通知用户已经进行到方法
    //6 INFO 更一般化的通知
    //7 DEBUG 调试消息
    //

    function log(str, showInPage, level) {

        if($.isNumber(showInPage)) {
            level = showInPage;
            showInPage = true;
        } else {
            level = level || 5;
        }

        var show = level <= config.debugLevel;

        if(show) {
            if(showInPage === true) {
                var div = DOC.createElement('pre');
                div.className = 'MixJS_log';
                div.innerHTML = str + ''; //确保为字符串
                DOC.body.appendChild(div)
            } else if(global.console && global.console.log) {
                global.console.log(str);
            }
        }
        return str
    }
}(window, document, undefined));