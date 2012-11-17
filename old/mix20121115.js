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
        ALIAS = {},//alias别名快速定位
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
        _timeout = 3e4,//30秒超时
        _requireFileMap = {},//require hashmap,1--->发送请求之前，2--->正在加载，3-->加载成功
        _cleanObj = {},
        _emptyArr = [],
        _emptyFn = function() {},
        _arrSlice = _emptyArr.slice;
    var config = {
        alias:ALIAS,
        path:PATH,
        timeout:_timeout,
        debug:isDebug,
        charset:CHARSET
    }
    var $ = {
        version: VERSION,
        now: now,
        path: PATH,
        head: HEAD,
        reg: reg,
        emptyFn: _emptyFn,
        mix: mix,
        each: each,
        load: load,
        loadJS: loadJS,
        loadCSS: loadCSS,
        Queue: Queue,
        defined:Module.defined,
        config: function(cfg) {
            config = mix(config,cfg);
        },
        /**
         * 请求一个或者多个模块
         * @param  {[type]}   ids      模块ids
         * @param  {Function} callback 加载成功后回调函数
         * @param  {[type]}   fail     如果有没有加载成功，则执行fail
         * @return {[type]}            [description]
         */
        require: function(ids, callback/*, fail*/) {
            if($.isUndefined(ids)){
                return this;
            }

            var cb,tq;
            if(ids._q && ids._q['@GOD'] === 'THEOQ'){
                tq = ids._q;//取出q

                cb = function(){
                    callback();
                    tq.shift();  
                }
            }else{
                ids = String(ids).split(',');                
                cb = callback;
            }

            var q = new Queue;//新Queue
            q.addSteps(ids.length).push(cb);

            each(ids, function(v, i) {
                var arr = getPath(v),
                    url = arr[0],
                    ext = arr[1];
                    
                if(_requireFileMap[url]) {                 
                    q.shift();
                } else {

                    var tcb = function() {  
                            _requireFileMap[url] = 3;//加载成功
                            q.shift();                                                                            
                        };
                   
                    _requireFileMap[url] = 1;//开始加载之前，beforeSend
                    if(ext === 'js') {
                        loadJS(url, tcb);
                    } else {
                        loadCSS(url, tcb);
                    }
                    _requireFileMap[url] = 2;//正在发送请求

                }
            }, this);
            //获取完整路径→加载js|css
            //取完整路径：判断是否是完整路径→不是，添加rooturl→最后格式化url            

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
                new Module(args[0], args[1], args[2]).load();
                break;
            }
            return this;
        },
        use: function() {}
    };
    //基本类型判断
    'Function,String,Object,Array,Undefined,Boolean'.replace(reg, function(t) {
        $['is' + t] = function(s) {
            return isType(s, t)
        }
    });
    //释放到window
    global[MixJSName] = $;
    MixJSName!=='MixJS' && (global['MixJS'] = $);
    /**
     * 模块类
     * @param {[type]} id    模块名称
     * @param {Array} deps  依赖模块
     * @param {[type]} maker 制造函数
     * @param {[type]} root  父模块，默认是MixJS
     */
    function Module(id, deps, maker, root) {
        id = id.replace('/', '.'); //event/bindEvent => event.bindEvent;
        this.id = id;

        this.deps = String(deps).split(',');//必须是数组
        this.maker = maker;
        this.root = root || $;
        this.queue = null;
    }
    //销毁
    Module.prototype.destroy = function(){
        delete this.maker;
        this.deps.length = 0;
        delete this.deps;
        delete this.root;
        try{
            this.queue.destroy();
        }catch(e){}

        delete this.queue;

        // try{
        //     var q = Module._queue[this.id];
        //     q.destroy();
        //     delete q;
        // }catch(e){
        // }
        
        delete this.id;
        
    }
    Module.prototype.load = function(){
        var deps = this.deps;
        var q = new Queue;
        //设置步长，订阅消息：命名空间和销毁
        q.addSteps(1)
            .push(this.namespace,[],this)
            .push(this.destroy,[],this);

        deps._q = this.queue = q;
        deps._qname = this.id;

        $.require(deps,function(){
            q.shift();
        });

        return this;
    }
    /**
     * 模块是否定义
     * 判断一个模块是否通过define定义的
     * @param  {[type]} id   [description]
     * @param  {[type]} root [description]
     * @return {[type]}      [description]
     */
    Module.defined = function(id,root){
        root = root || $;

        var names = id.split('.'), name;
        while(name = names.shift()){
            if(names.length){
                if(!root[name]){
                    return false;
                }
            }else{

                return !$.isUndefined(root[name]) && root[name]['@GOD'] === 'THEO';
            }            
        }
        return false;
    }
    Module.prototype.namespace = function() {
        console.log('namespace===>',this.id);
        var names = this.id.split('.'),
            root = this.root;
        var name;
        while(name = names.shift()){
            if(names.length){
                
                root = root[name] || {};
            }else{
                if($.isUndefined(root[name])){
                    try {
                        var f = $.isFunction(this.maker) && this.maker(this.root);
                        // console.log(f);
                        if(f) {
                            f['@GOD'] = 'THEO';
                            root[name] = f;

                        }
                    } catch(e) {
                        throw new Error('Module.namespace:id=>' + this.id + ',info=>' + e.message);
                    }
                }
            }
        }
    }
    Module._cache = {}; //缓存
    // Module._queue = {};//队列实例

    var regAlias = /^[-a-z0-9_$]{2,}$/i,//别名正则
        regProtocol = /^(\w+)(\d)?:.*/,//协议
        regISJS = /\.js$/,//是否为js
        regEXT = /\.(\w+)$/;//后缀
    /**
     * 获取真实url
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    function getPath(url,root,ret){
        root = root || config.path;

        //[]里面，不是开头的-要转义，因此要用/^[-a-z0-9_$]{2,}$/i而不是/^[a-z0-9_-$]{2,}
        //别名至少两个字符；不用汉字是避开字符集的问题
        if(regAlias.test(url) && config.alias[url] ){
            ret = config.alias[url]
        }else{
            root = root.substr( 0, root.lastIndexOf('/') );
            if(regProtocol.test(url)){  //如果用户路径包含协议
                ret = url
            }else {
                var tmp = url.charAt(0),_2 = url.slice(0,2);                

                if( tmp !== '.' && tmp != '/'){  //相对于根路径
                    ret = root + '/' + url;
                }else if( _2 === './'){ //相对于兄弟路径
                    ret = root + '/' + url.substr(2);
                    // console.log(ret,2);
                }else if( _2 === '..'){ //相对于父路径
                    var arr = root.replace(/\/$/,'').split('/');
                    tmp = url.replace(/\.\.\//g,function(){
                        arr.pop();
                        return '';
                    });
                    ret = arr.join('/')+'/'+tmp;
                    // console.log(ret);
                }
            }
        }
        var ext = 'js';//默认是js文件

        tmp = ret.replace(/[?#].*/, '');
        if(regEXT.test( tmp )){
            ext = RegExp.$1;
        }
        if( ext!=='css' &&tmp === ret && !regISJS.test(ret)){//如果没有后缀名会补上.js
            ret += '.js';
        }
        return [ret, ext];
    }
    /**
     * 高效队列
    var q = new Queue();
    var now = +new Date;
    q.on(function(){console.log('success')}).on(function(){console.log('success2')})
    for(var i = 0;i<10000;i++){
        q.push(i);
    }
    while(q.getLength(){
        q.shift();
    }
    console.log(new Date-now);
     * 
     */
    function Queue() {
        this.listeners = [];
        this.waitArr = [];
        this['@GOD'] = 'THEOQ';//添加唯一标示
    }
    Queue.prototype.getLength = function() {
        return this.waitArr.length;
    }
    //压入栈
    Queue.prototype.addStep = function(i) {
        return this.waitArr.push(i);
    }
    //一次性压入n个步骤
    Queue.prototype.addSteps = function(n) {
        n |= 0;
        if(n !== 0) this.waitArr = this.waitArr.concat(new Array(n));
        return this;
    }
    //出栈
    Queue.prototype.shift = function() {
        this.waitArr.shift();
        if(this.getLength() === 0) {
            //符合fire条件，开始爆发
            this.fire();
        }
        return this;
    }

    /**
     * 触发事件
     * @return {[type]} [description]
     */
    Queue.prototype.fire = function() {
        each(this.listeners, function(v, i) {
            var fn = v.fn,
                args = v.args,
                scope = v.scope;
            fn.apply(scope, args);
        }, this);
        this.destroy(); //销毁
        return this;
    }
    /**
     * 从底部压入队列
     * @param  {Function} callback 订阅函数
     * @param  {[type]}   args     函数参数
     * @param  {[type]}   scope    函数上下文
     * @return {[type]}            [description]
     */
    Queue.prototype.push = function(callback, args, scope) {
        if($.isFunction(callback)) {
            args = args || _emptyArr;
            scope = scope || global;
            this.listeners.push({
                fn: callback,
                args: args,
                scope: scope
            });
        }

        return this;
    }
    /**
     * 从顶部压入队列
     * @param  {Function} callback [description]
     * @param  {[type]}   args     [description]
     * @param  {[type]}   scope    [description]
     * @return {[type]}            [description]
     */
    Queue.prototype.unshift = function(callback, args, scope){
        if($.isFunction(callback)) {
            args = args || _emptyArr;
            scope = scope || global;
            this.listeners.unshift({
                fn: callback,
                args: args,
                scope: scope
            });
        }

        return this;
    }
    //销毁
    Queue.prototype.destroy = function() {
        this.listeners.length = 0;
        this.waitArr.length = 0;
    }

    /**
     * 加载js，css文件通用方法
     * @param  {[type]}   url      [description]
     * @param  {Function} callback [description]
     * @param  {[type]}   fail     [description]
     * @param  {[type]}   charset  [description]
     * @return {[type]}            [description]
     */
    var regISCSS = /\.css(?:\?|$)/i;

    function load(url, callback, fail, charset) {
        regISCSS.test(url) ? loadJS(url, callback, fail, charset) : loadCSS(url, callback);
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

                // Ensure only run once and handle memory leak in IE
                node.onload = node.onerror = node.onreadystatechange = null

                // Remove the script to reduce memory leak
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
     * 数组遍历
     * @param  {[type]}   arr      [description]
     * @param  {Function} callback [description] arrvalue index arr
     * @param  {[type]}   scope    [description]
     * @return {[type]}            [description]
     */
    var each = [].forEach ?
    function(arr, callback, scope) {
        [].forEach.call(arr, callback, scope);
    } : function(arr, callback, scope) {
        for(var i = 0, len = arr.length; i < len; i++) {
            if(i in arr) {
                callback.call(scope, arr[i], i, arr);
            }
        }
    };
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


/**
 * 目标: 为了尽可能的减少模块之间业务逻辑的耦合度, 而开发了这个eventbus, 主要用于业务逻辑的事件传递
 * 使用规范: 每个js模块尽可能通过事件去通信, 减少模块之间的直接调用和依赖(耦合)
    
 * @return {[type]} 
 * @author  theowang
 * $Id: broadcast.js 65871 2012-11-05 01:51:42Z theowang $
 */
$.broadcast = function($){
    var _cache = {};
    var broadcast = {
        
        /**
         * 派发         
         * @param  {[type]} type 事件类型
         * @param  {[type]} data 回调数据
         * @return {[type]}      [description]
         */
        fire:function(type, data){
            var listeners = _cache[type],len = 0;
            if(!$.isUndefined(listeners)){
                var args = _arrSlice.call(arguments,0);
                args = args.length > 2 ? args.splice(2, args.length-1) : [];
                args = [data].concat(args);

                len = listeners.length;
                for(var i = 0; i<len;i++){
                    var listener = listeners[i];
                    if(listener && listener.callback) {
                        args = args.concat(listener.args);
                        listener.callback.apply(listener.scope, args);
                    }
                }
            }
            return this;
        },
        /**
         * 订阅广播事件
         * @param  {[type]}   types     事件类型，支持,分隔符
         * @param  {Function} callback 回调函数
         * @param  {[type]}   scope    回调函数上下文
         * @return {[type]}            this
         */
        subscribe:function(types, callback, scope){
            types = types || [];
            var args = _arrSlice.call(arguments,0);

            if($.isString(types)){
                types = types.split(',');
            }
            var len = types.length;
            if(len===0){
                return this;
            }
            args = args.length > 3 ? args.splice(3, args.length-1) : [];
            for(var i = 0;i<len;i++){
                var type = types[i];
                _cache[type] = _cache[type] || [];
                _cache[type].push({callback:callback,scope:scope,args:args});
            }
            return this;
        },
        /**
         * 退订
         * @param  {[type]}   type     [description]
         * @param  {Function} callback 假如传入则移出传入的监控事件，否则移出全部
         * @return {[type]}            [description]
         */
        unsubscribe:function(type, callback, scope){
            var listeners = _cache[type];
            if (!listeners) {
                return this;
            }
            if(callback){
                var len = listeners.length,
                    tmp = [];
                
                for(var i=0; i<len; i++) {
                    var listener = listeners[i];
                    if(listener.callback == callback && listener.scope == scope) {
                    } else {
                        tmp.push(listener);
                    }
                }
                listeners = tmp;
            }else{
                listeners.length = 0;
            }
            return this;
        },
        /**
         * 订阅别名
         * @return {[type]} [description]
         */
        on:function(){
            return this.subscribe.apply(this,arguments);
        },
        /**
         * 退订别名
         * @return {[type]} [description]
         */
        un:function(){
            return this.unsubscribe.apply(this,arguments);
        },
        dispatch:function(){
            return this.fire.apply(this,arguments);
        },
        
        removeAll:function(){
            _cache = {};
            return this;
        }
    };
    return broadcast;
}($);

}(window, document, undefined));