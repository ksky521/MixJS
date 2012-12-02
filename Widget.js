/**
 * Widget
 * 只是提出一种开放平台widget组件开发和使用设想
 * 具体需要根据具体业务进行修改添加代码
 * $.Widget.define('invite',{
 * 	js:[],//依赖js
 * 	css:[],//依赖css样式表
 * 	loginRequired: true,//是否需要登录后操作
 * 	main: function(){}//主体函数，接收opt对象，this为promise的widget，包括了onSuccess、onCallback等事件
 * 	//可以执行fireCallback,fireCallbackWith,fireSuccess,fireFail方法
 * })
 *
 * $.Widget('invite', {appkey:'',appid:''}).onSuccess().onError().onCallback();
 */
MixJS.define('Widget', 'Deferred', function($) {
	var widgets = {}; //widgets集合
	/**
	 * 注册widget
	 * @return {[type]} [description]
	 */
	function define(name, opt) {
		if(typeof name === 'object') {
			opt = name;
			name = name.name
		}
		if($.isString(name) && name !== '') {

			if($.isUndefined(opt) && widget[name]) {
				//如果只有name参数，则认为是获取
				return widgets[name];
			} else if(widgets[name]) {
				throw = new Error('Widget.define: widget named ' + name + ' is already exist!');
				return $;
			}

			widgets[name] = opt;


		} else {
			throw new Error('Widget.define: name must a string');
		}
		return $;
	}
	/**
	 * widget主体函数
	 * @param  {String} name 名称
	 * @param  {Object} opt  初始化对象
	 * @return {[type]}      [description]
	 */

	function widget(name, opt) {
		if($.isString(name)) {
			//名称必须为string类型
			throw new Error('Widget name must a string');
			return;
		}
		if(!widgets[name]) {
			//检测是否存在
			throw new Error('Widget:' + name + ' is undefined!');
			return;
		}
		var wgConfig = widgets[name];
		var config = opt || {};
		var callbacks = $.getQueue(); //oncallback回调函数集合
		var defer = $.Deferred();
		var self = defer.promise({

			//销毁函数
			destroy: function() {
				callbacks.disable();
				callbacks = null;
				for(var i in this) {
					if(this.hasOwnProperty(i)) {
						delete this[i];
					}
				}
			},
			//提供给main函数调用callback的hook
			fireCallback: callbacks.fire,
			fireCallbackWith: callbacks.fireWith,
			//oncallback回调函数接口			
			onCallback: function() {
				callbacks.add.apply(self, arguments);
				return self;
			},
			show: function() {
				load();
			}
		});
		self.onSuccess = defer.success
		self.onFail = self.onError = defer.fail
		self.fireSuccess = defer.resolve
		self.fireFail = defer.reject;

		var mainFn = wgConfig.main;
		//初始化


		function init() {
			if($.isFunction(mainFn)) {
				mainFn.call(self, opt);
			}
		}

		function load() {
			if(wgConfig.loginRequired) {
				//判断是否登录，此处未完成！
			}
			
			//加载依赖的js和css文件
			var len;
			var js = $.isArray(wgConfig.js) ? wgConfig.js || [];
			var css = $.isArray(wgConfig.css) ? wgConfig.css || [];
			len = js.length + css.length;
			$.each(js, function(v) {
				$.loadJS(v, cb, function() {
					fail(v + ' is loaded fail!');
				});
			})
			$.each(css, function(v, i) {
				$.loadCSS(v, cb, function() {
					fail(v + ' is loaded fail!');
				});
			}, $);

			function cb() {
				if(--len === 0) {
					init();
				}
			}

		}


		

		function fail(msg) {
			self.reject(msg);
		}
		return self;
	}
	widget.all = function
	widget.define = define
	return widget;
});