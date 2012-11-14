(function(global,DOC,undefined){
	var VERSION = '0.1',
		curScriptNode = (function(scripts, node) {
            scripts = DOC.getElementsByTagName('script');
            node = scripts[scripts.length - 1]; //FF下可以使用DOC.currentScript
            return node;
        })(),
        isDebug = !!curScriptNode.getAttribute('debug'),
        MixJSName = curScriptNode.getAttribute('name') || 'MixJS',
        //获取当前文件父路径
        PATH = (function(node) {
            var url = node.hasAttribute ? // non-IE6/7
		        node.src :
		        // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
		        node.getAttribute('src', 4);
            return url.substr(0, url.lastIndexOf('/')) + '/';
        })(curScriptNode),
        HEAD = DOC.head ||
              DOC.getElementsByTagName('head')[0] ||
              DOC.documentElement,
        BASE = HEAD.getElementsByTagName('base')[0] || null, 
        now = +new Date,
        reg =  /[^, ]+/g,
        _timeout = 3e4,//30秒超时
        _cleanObj = {},
        _emptyArr = [],
        _emptyFn = function(){},
        _arrSlice = _emptyArr.slice;
    var config = {

    };
    var $ = {
    	VERSION:VERSION,
    	now:now,
    	path:PATH,
    	reg:reg,
    	emptyFn:_emptyFn,
    	mix:mix,
    	load:fetch,
    	config:function(cfg){

    	},
    	/**
    	 * 请求一个或者多个模块
    	 * @param  {[type]}   ids      模块ids
    	 * @param  {Function} callback 加载成功后回调函数
    	 * @param  {[type]}   fail     如果有没有加载成功，则执行fail
    	 * @return {[type]}            [description]
    	 */
    	require:function(ids, callback, fail){
    		String(ids).replace(reg, function(id){
    			//获取完整路径→加载js|css
    			//获取完整路径：判断是否是完整路径→不是，添加rooturl→最后格式化url
    			
    		})
    		return this;
    	},
    	/**
    	 * 模块定义
    	 * @param  {[type]} ids     模块id。支持event.broadcast这样的
    	 * @param  {[type]} deps    依赖关系
    	 * @param  {[type]} maker   模块制造工厂函数，return出来的才是真正的module
    	 * @return {[type]}         this
    	 */
    	define:function(){
    		var args = _arrSlice.call(arguments, 0);
    		switch(args.length){
    			case 0:
    				throw new Error('define error: arguments length error');
    				break;
    			case 1:
    				//假如为一个，并且是object，那么mix到$
    				$.isObject(args[0]) && mix($,args[0]);
    				break;
    			case 2:
    				//如果第二个参数是fn，则补充依赖关系，后执行case 3
    				_emptyArr.splice.call(args,1,0,[]);
    			case 3:
    				args[1] = String(args[1]).split(',');
    				new Module(args[0],args[1],args[2]);
    				break;
    		}
    		return this;
    	},
    	use:function(){}
    };
    'Function String Object Array Undefined Boolean'.replace(reg,function(t){
        $['is'+t] = function(s){
            return isType(s,t)
        }
    });
    function Module(){

    }
    Module.cache = {};//Module实例缓存
    Module.state = {};//模块的状态

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
    function Queue(){
    	this.listeners = [];
    	this.waitArr = [];
    }
    Queue.prototype.getLength = function(){
    	return this.waitArr.length;
    }
    //压入栈
    Queue.prototype.push = function(i){
    	return this.waitArr.push(i);    	
    }
    //出栈
    Queue.prototype.shift = function(){
    	this.waitArr.shift();
    	if(this.getLength===0){
    		//符合fire条件，开始爆发
    		this.fire();
    	}
    	return this;
    }
    /**
     * 触发事件
     * @return {[type]} [description]
     */
    Queue.prototype.fire = function(){
    	each(this.listeners,function(v,i){
    		var fn = v.fn, args = v.args, scope = v.scope;
    		fn.apply(scope,args);
    	},this);
    	this.destroy();//销毁
    	return this;
    }
    /**
     * 订阅队列
     * @param  {Function} callback 订阅函数
     * @param  {[type]}   args     函数参数
     * @param  {[type]}   scope    函数上下文
     * @return {[type]}            [description]
     */
    Queue.prototype.on = function(callback,args,scope){
    	if($.isFunction(callback)){
    		args = args || _emptyArr;
    		scope = scope || global;
    		this.listeners.push({fn:callback,args:args,scope:scope});	
    	}
    	
    	return this;
    }
    //销毁
    Queue.prototype.destroy = function(){
    	this.listeners.length = 0;
    	this.waitArr.length = 0;
    }
    function fetch(){}
    function loadJS(url,callback,fail){
    	var node = DOC.createElement('script');

    }
    function loadCSS(){}
    /**
     * 数组遍历
     * @param  {[type]}   arr      [description]
     * @param  {Function} callback [description] arrvalue index arr
     * @param  {[type]}   scope    [description]
     * @return {[type]}            [description]
     */
    var each = [].forEach?function(arr, callback, scope){
        [].forEach.call(arr, callback, scope);
    }:function(arr, callback, scope) {
        for (var i = 0, len = arr.length; i < len; i++) {
            if (i in arr) {
                callback.call(scope, arr[i], i, arr);
            }
        }
    };
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
}(window,document,undefined));