/**
 * Widget
 * 只是提出一种开放平台widget组件开发和使用设想
 * 具体需要根据具体业务进行修改添加代码
 * $.Widget.define('invite',{
 * 	js:[],//依赖js
 * 	css:[],//依赖css样式表
 * 	loginRequired: true,//是否需要登录后操作
 * 	main: function(){}//主体函数，接收opt对象，this为promise的widget，包括了onSuccess、onCallback等事件
 *  //可以执行fireCallback,fireCallbackWith,fireSuccess,fireFail方法
 * })
 *
 * $.Widget('invite', {appkey:'',appid:''}).onSuccess().onError().onCallback();
 */
MixJS.define('Widget', 'Deferred', function($) {
	var widgets = {}; //widgets集合
	var _loadWidgetFiles = {}; //加载过的widget文件

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
				throw new Error('Widget.define: widget named ' + name + ' is already exist!');
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
		if(!$.isString(name)) {
			//名称必须为string类型
			throw new Error('Widget name must a string');
		}

		var config = opt || {};
		var callbacks = $.getQueue(); //oncallback回调函数集合
		var defer = $.Deferred();
		var loadPromise;
		if(!widgets[name]) {
			//检测是否存在
			//不存在就加载下
			loadPromise = $.Deferred();

			$.loadJS($.path + '/widget/' + name + '.js', function() {
				loadPromise.resolve(name + ' loaded');

			}, function() {
				var errorMsg = 'widget ' + name + ' load error';
				
				loadPromise.reject(errorMsg);
				fail(errorMsg);
				throw new Error(errorMsg);
			})

		}



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
				if(loadPromise && loadPromise['@THEO'] === 'promise') {
					loadPromise.then(load);
				} else {
					load();
				}
				return self;
			}
		});
		self.onSuccess = defer.success
		self.onFail = self.onError = defer.fail
		self.fireSuccess = defer.resolve
		self.fireFail = defer.reject;


		//初始化

		function init() {
			var mainFn = widgets[name].main;
			widgets[name]._status = 'loaded'
			if($.isFunction(mainFn)) {
				mainFn.call(self, opt);
			}
		}

		function load() {
			var wgConfig = widgets[name];
			if(wgConfig.loginRequired) {
				//判断是否登录，此处未完成！
			}

			//加载依赖的js和css文件
			var len;
			var js = $.isArray(wgConfig.js) ? wgConfig.js : [];
			var css = $.isArray(wgConfig.css) ? wgConfig.css : [];
			len = js.length + css.length;
			if(len > 0 && wgConfig._status!=='loaded') {
				var cb = function() {
					if(--len === 0) {
						init();
					}
				}
				wgConfig._status = 'pending';
				$.each(js, function(v) {
					if(_loadWidgetFiles[v] === 1) {
						cb();
					} else {
						$.loadJS(v, function() {
							_loadWidgetFiles[v] = 1;
							cb();
						}, function() {
							fail(v + ' is loaded fail!');
						});
					}

				})
				$.each(css, function(v) {
					if(_loadWidgetFiles[v] === 1) {
						cb();
					} else {
						$.loadCSS(v, function() {
							_loadWidgetFiles[v] = 1;
							cb();
						}, function() {
							fail(v + ' is loaded fail!');
						});
					}
				}, $);


			} else {
				init();
			}


		}



		function fail(msg) {
			defer.reject(msg);
		}
		return self;
	}
	widget.all = function() {
		var back = [];
		for(var i in widgets) {
			if(widgets.hasOwnProperty(i)) {
				back.push(i);
			}
		}
		return back.join(',');
	}
	widget.define = define
	return widget;
});