
(function(global, DOC) {

    var version = '0.1',
        curScriptNode = (function(scripts, node) {
            scripts = DOC.getElementsByTagName('script');
            node = scripts[scripts.length - 1]; //FF下可以使用DOC.currentScript
            return node;
        })(),
        isDebug = !!curScriptNode.getAttribute('data-debug'),
        mixJSName = curScriptNode.getAttribute('data-name') || 'mixJS',
        //获取当前文件父路径
        PATH = (function(node) {
            var url = getScriptAbsoluteSrc(node);
            return url.substr(0, url.lastIndexOf('/'));
        })(curScriptNode),

        HEAD = DOC.head ||
              DOC.getElementsByTagName('head')[0] ||
              DOC.documentElement,
        baseElement = HEAD.getElementsByTagName('base')[0] || null, 
        reg = /\S+/g,
        regSPACE_SPLIT = /\s*,\s*/g,
        regComments =  /\/\*(?:[^*]|\*+[^\/*])*\*+\/|\/\/.*/g,//注释正则
        regRequire = /require\s*\(\s*["']([^"']+)["']\s*\)|(?:[^\\]?)(["'])/g,
        now = +new Date,
        _timeout = 3e4,//20秒
        _cleanObj = {},
        _emptyArr = [],
        _arrSlice = _emptyArr.slice,
        _filesMap = {},//文件粒度上的map
        _definedMap = {},//定义模块粒度上的map
        _emptyFn = function(){},
        UA = navigator.userAgent,
        isWebKit = ~UA.indexOf('AppleWebKit');
    //  /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g
    //  /require\s*\(\s*["']([^"']+)["']\s*\)|(?:[^\\]?)(["'])/g,
    //  /(?:^|[^.$])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g
    var $ = {
        emptyFn:_emptyFn,
        now:now,
        path:PATH,
        log:log,
        /**
         * 文件加载
         * 主要用于非MixJS的业务模块加载，包括js css等资源
         * @param {Object} modules [path/path1/a.js] 两种传参方法，Array||String(a,b)
         * @param {Object} callback
         * @param {Object} refURL [http://www.qq.com/]
         */
        require: function(modules, callback, refURL) {
            modules = $.isArray(modules) ? modules : modules.split(regSPACE_SPLIT);
            var module, queue = [];
            refURL = refURL || PATH;
            refURL.slice(-1) !== '/' && (refURL += '/');

            while(module = modules.shift()) {                
                var turl = refURL + module; //url处理

                if(!_isFileLoaded(turl)) {
                    queue.push(turl);                    
                    
                    fetch(turl, cb);
                }
            }

            function cb() {
                var url = queue.shift();
                _filesMap[url] = 1;
                if(queue.length === 0) {
                    callback && $.isFunction(callback) && callback();
                }
            }
            return this;
        },
        addConfig:function(){},
        use:function(){},
        /**
         * 命名空间
         * @param {Object} names
         * @param {Object} root
         * @param {Object} maker
         */
        namespace: function(names, root, maker) {
            root = root || $;
            names = $.isArray(names) ? names : names.split('.');
            var name;
            while(name = names.shift()) {
                if(names.length) {
                    if(!root[name]) {
                        root[name] = {};
                    }
                    root = root[name];
                } else {
                    if($.isUndefined(root[name])) {
                        try {
                            root[name] = maker($);
                            root[name]['@MAKER'] = 'THEO';//添加命名空间创建者标记
                        } catch(e) {
                            log('$.namespace:moduleName:'+name+';msg:'+e.message);                            
                        }
                    }
                }
            }
            return root;
        },
        
        /**
         * 模块加载函数接口
         * @param {String||Array} moduleName 模块名称
         * @param {String||Array} needModules 依赖关系的模块名称
         * @param {Function} fn 回调函数
         */
        define: function(moduleName, needModules, fn) {
            var args = _arrSlice.call(arguments, 0);
            if(args.length===2){
                //如果第二个参数是fn，则补充依赖关系
                _emptyArr.splice(args,1,0,[]);
            }
            if($.isFunction(fn)){
                var source = fn.toSource ? fn.toSource() : fn.toString();
                source.replace(regComments,'')
                .replace(regRequire,function(a,b){
                    args[1].push(b);
                    return a;
                });
            }
            
        },
        /**
         * 判断是否定义过本模块
         * @param  {[type]} names [description]
         * @return {[type]}       [description]
         */
        defined:function(name){
            return _definedMap[name] === '@THEO';//添加命名空间创建者标记
            
        }
    };
    'Function String Object Array Undefined Boolean'.replace(reg,function(t){
        $['is'+t] = function(s){
            isType(s,t)
        }
    })
    window[mixJSName] = $;


    /**
     * 文件粒度上是否加载过
     * @param {Object} fileName
     */
    function _isFileLoaded(fileName) {
        return _filesMap[fileName] === 1;
    }

    function Module(){

    }
    
    /**
     * 模块依赖关系定制的队列
     * @param {[type]} moduleName [description]
     */
    function ModuleQueue(moduleName) {
        this.moduleName = moduleName;
        this.taskList = [];
    }
    ModuleQueue.modules = {};//绑定到队列上的加载过的module
    /**
     * 添加任务
     * @param {Function} fn    [description]
     * @param {[type]}   args  参数array
     * @param {[type]}   scope 上下文
     */
    ModuleQueue.prototype.add = function(fn, args, scope) {
        args = _arrSlice.call(arguments, 0);
        if(args.length === 0) {
            return;
        }

        this.taskList.push(args);
        return this;
    }
    ModuleQueue.prototype.doit = function() {
        if(this.canDo()) {
            var fn = this.taskList.pop();
            var args = $.isArray(fn[1]) ? fn[1] : [],
                scope = fn[2] || null;
            fn = fn[0];

            $.isFunction(fn) && fn.apply(scope, args);
            this.clear();
        }
        return this;
    }
    ModuleQueue.prototype.clear = function() {
        if(!this.canDo()) delete ModuleQueue.modules[this.moduleName];
    }
    ModuleQueue.prototype.canDo = function() {
        return this.taskList.length !== 0;
    }

    /**
     * 日志功能
     * @param  {[type]} msg [description]
     * @return {[type]}     [description]
     */
    function log(msg){
        console.log(msg);
    }
    /**
     * 获取js和css文件
     * @param  {[type]}   url      [description]
     * @param  {Function} callback [description]
     * @param  {[type]}   cfg      [description]
     * @return {[type]}            [description]
     */
    var _fetchConfig = {
        isCSS:false,
        charset:'utf-8',
        async:'async'
    }
    function fetch(url, callback, cfg){
        if($.isObject(callback)){
            cfg = callback;
            callback = _emptyFn;
        }

        var opts = cfg && mix(_fetchConfig, cfg) || _fetchConfig,
            isCSS = opts.isCSS,
            charset = opts.charset,
            node;
        if($.isBoolean(isCSS)) {
            isCSS = /\.css(?:\?|$)/i.test(url);
        }
        node = DOC.createElement(isCSS ? 'link' : 'script');

        if($.isFunction(callback)){
            bindCallback(node,callback)
        }

        url = normalize(url);

        if(isCSS) {
            node.rel = 'stylesheet';
            node.href = url;
        } else {
            opts.async && (node.async = opts.async);
            node.src = url;
            // charset = charset || 'UTF-8';
            charset = $.isFunction(charset) ? charset(url) : charset;
            charset && (node.charset = charset)
        }

        

        // ref: #185 & http://dev.jquery.com/ticket/2709
        HEAD.insertBefore(node, baseElement);
    }
    /**
     * 绑定入口，timeout配置
     * @param  {[type]}   node     [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    function bindCallback(node,callback){
        var timer = setTimeout(function() {
            log('fetch file time out:' + (node.src ? node.src : node.href));
            cb();
        }, _timeout);

        if(node.nodeName === 'SCRIPT') {
            jscallback(node, cb);
        } else {
            csscallback(node, cb);
        }

        function cb() {
            if(!cb.isCalled) {
                cb.isCalled = true;
                clearTimeout(timer);

                callback();
            }
        }
    }
    /**
     * 获取script节点路径
     * @param  {[type]} node script元素
     * @return {[type]}      返回src
     */
    function getScriptAbsoluteSrc(node) {
        return node.hasAttribute ? // non-IE6/7
        node.src :
        // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        node.getAttribute('src', 4)
    }
    /**
     * 是否为绝对路径
     * @param  {[type]}  url [description]
     * @return {Boolean}     [description]
     */
    function isAbsoluteURL(url){
        return /^\/|^[^:]+:\/\//.test(url);
    }
    /**
     * 是否为根路径
     * @param  {[type]}  id [description]
     * @return {Boolean}    [description]
     */
    function isRoot(url) {
        return url.charAt(0) === '/' && url.charAt(1) !== '/'
    }
    /**
     * 是否为相对路径
     * @param  {[type]}  url [description]
     * @return {Boolean}     [description]
     */
    function isRelativeURL(url){
        //两种表现../ ./
        return url.charAt(0) == '.';
    }
    /**
     * 正常化url
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    function normalize(url) {
        url = realpath(url);
        if(/#$/.test(url)) {
            url = url.slice(0, -1);
        } else if(!~url.indexOf('?') && !/\.(?:css|js)$/.test(url)) {
            url += '.js';
        }
        // Remove ':80/' for bug in IE
        // IE bug  :80/ -> /
        if(url.indexOf(':80/') > 0) {
            url = url.replace(':80/', '/')
        }
        return url;
    }
    /**
     * 获取规范url
     * @param  {[type]} path [description]
     * @return {[type]}      [description]
     */
    var MULTIPLE_SLASH_RE = /([^:\/])\/\/+/g; //用于削减多个‘/’情况
    function realpath(path) {
        MULTIPLE_SLASH_RE.lastIndex = 0

        // 'file:///a//b/c' ==> 'file:///a/b/c'
        // 'http://a//b/c' ==> 'http://a/b/c'
        if(MULTIPLE_SLASH_RE.test(path)) {
            path = path.replace(MULTIPLE_SLASH_RE, '$1\/')
            //匹配到多个/情况后用一个/予以替换
        }

        // 'a/b/c', just return. 
        //如果路径中没有出现 '.' 则返回路径
        if(!~path.indexOf('.')) {
            return path
        }

        var original = path.split('/')
        var ret = [],
            part;

            //用于处理路径中存在a/b/../c 的形式，该形式下将会直接被替换成为 a/c
        for(var i = 0; i < original.length; i++) {
            part = original[i]

            if(part === '..') {
                if(ret.length === 0) {
                    log('The path is invalid: ' + path)
                }
                ret.pop()
            } else if(part !== '.') {
                ret.push(part)
            }
        }

        return ret.join('/')
    }
    /**
     * js绑定回调函数
     * @param  {[type]}   node     [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    function jscallback(node, callback) {

        // onload为IE6-9/OP下创建CSS的时候，或IE9/OP/FF/Webkit下创建JS的时候  
        // onreadystatechange为IE6-9/OP下创建CSS或JS的时候
        node.onload = node.onerror = node.onreadystatechange = function() {
            
            if(/loaded|complete|undefined/.test(node.readyState)) {

                //先进行内存回收
                node.onload = node.onerror = node.onreadystatechange = null

                // Remove the script to reduce memory leak
                // 在存在父节点并出于非debug模式下移除node节点
                if(node.parentNode && !isDebug) {
                    head.removeChild(node)
                }

                // Dereference the node
                // 废弃节点，这个做法其实有点巧妙，对于某些浏览器可能同时支持onload或者onreadystatechange的情况，只要支持其中一种并执行完一次之后，把node释放，巧妙实现了可能会触发多次回调的情况
                node = undefined

                //执行回调
                callback()
            }
        }
    }
    // `onload` event is supported in WebKit since 535.23
      // Ref:
      //  - https://bugs.webkit.org/show_activity.cgi?id=38995
      // css onload 事件的支持 从webkit 内核版本 535.23 开始
    var isOldWebKit = Number(UA.replace(/.*AppleWebKit\/(\d+)\..*/, '$1')) < 536,

      // `onload/onerror` event is supported since Firefox 9.0
      // onload/onerror 这个事件是从firefox9.0开始支持的，在判断中首先判断UA是否是Firefox 并且 在存在onload
      // Ref:
      //  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
      //  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
        isOldFirefox = UA.indexOf('Firefox') > 0 &&
          !('onload' in document.createElement('link'));
    /**
     * css加载事件绑定
     * 此部分和poll部分代码来自seajs
     * @param  {[type]}   node     [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    function csscallback(node,callback){

        // for Old WebKit and Old Firefox
        // iOS 5.1.1 还属于old --！ 但是 iOS6中 536.13
        // 这里用户采用了代理可能会造成一点的勿扰，可能代理中他是一个oldwebkit浏览器 但是实质却不是
        if(isOldWebKit || isOldFirefox) {
            setTimeout(function() {
                poll(node, callback)
            }, 1) // Begin after node insertion 
            // 延迟执行 poll 方法，确保node节点已被插入
        } else {
            node.onload = node.onerror = function() {
                node.onload = node.onerror = null
                node = undefined
                callback()
            }
        }

    }

    /**
     * css 加载过程轮询
     * @param {Object} node
     * @param {Object} callback
     */
    function poll(node, callback) {
        if(callback.isCalled) {
            return;
        }

        var isLoaded;

        if(isWebKit) {
            if(node.sheet) {
                isLoaded = true;
            }
        }
        // for Firefox
        else if(node.sheet) {
            try {
                if(node.sheet.cssRules) {
                    isLoaded = true;
                }
            } catch(e) {
                // NS_ERROR_DOM_SECURITY_ERR
                if(e.name === 'NS_ERROR_DOM_SECURITY_ERR') {
                    isLoaded = true
                }
            }
        }

        setTimeout(function() {
            if(isLoaded) {
                // Place callback in here due to giving time for style rendering.
                callback();
            } else {
                poll(node, callback);
            }
        }, 1);
    }
    /**
     * 获取类型
     * @param  {[type]} obj 要判断的对象
     * @return {String}     返回类型
     */
    function isType(obj,type){
        return _cleanObj.toString.call(obj).slice(8, -1)===type;
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

}(window, document));