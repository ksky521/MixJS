MixJS.define('API', 'Deferred', function($) {
	var APIS = {};
	//初始化获取api的xhr对象
	var xhr, xhrfns = [function() {
		return new ActiveXObject('Microsoft.XMLHTTP');
	}, function() {
		return new ActiveXObject('Msxml2.XMLHTTP');
	}, function() {
		return new XMLHttpRequest();
	}],
		xhrI = xhrfns.length;
	while(xhrI--) {
		try {
			xhrfns[xhrI]();
			xhr = xhrfns[xhrI];
			break;
		} catch(e) {}
	}

	/**
	 * api config
	 * opt = {
	 * 	url:'',
	 * 	charset:'utf-8',
	 * 	type:'get',
	 * 	dataType:'json'
	 * }
	 * @param  {String} name config的name
	 * @param  {Object} opt  config的内容
	 * @return {[type]}      [description]
	 */
	function config(name, opt) {
		if($.isString(name) || name != null) {
			//opt = {url:'', type:'get'}
			if($.isString(opt)){
				//如果是string类型，认为是url
				opt = {
					url:opt
				}
			}
			return opt && opt.url !== '' ? (APIS[name] = opt, $) : APIS[name];

		} else if(typeof name === 'object') {
			APIS = $.mix(APIS, name);
		}
		return $;
	}

	function api(name, data) {
		var opt = APIS[name];

		if($.isUndefined(opt) || opt.url === '') {
			throw new Error('api不存在,或者url为空');
			return $;
		}
		data = data || '';
		var i;
		var url = opt.url,
			type = opt.type ? opt.type.toUpperCase() : 'GET';//默认get
		var charset = opt.charset ? opt.charset : 'UTF-8';//默认utf-8
		var http = xhr();
		var timer, timeout = APIS.timeout || 3E4; //30秒过期
		var dataType = opt.dataType || data.dataType || 'json';
		var defer = $.Deferred();

		defer.promise(http);
		var responseTypes = {
			xml: 'responseXML',
			json: 'responseText'
		}

		// 设定状态变换时的事件
		http.onreadystatechange = function() {
			if(http.readyState == 4) {
				var status = http.status | 0;

				http.onreadystatechange = null;
				clearTimeout(timer);

				if(status === 200) {
					var text = http[responseTypes[dataType.toLowerCase()]];
					http.resolve(text);
				} else {

					var statusText = '请求失败 ';
					try {
						statusText = http.statusText;
					} catch(e) {}
					statusText += '，http状态码:'+status;
					http.reject(statusText);
				}
				
				setTimeout(function() {
					clear();
				}, 0);
			}
		}

		//设置头
		if(typeof opt.headers === 'object') {
			for(i in opt.headers) {
				http.setRequestHeader(i, opt.headers[i]);
			}
		}
		timer = setTimeout(function() {
			http.abort();
			//timeout
			http.reject(url + ' timeout');
			setTimeout(function() {
				clear();
			}, 0);
		}, timeout);

		if(type === 'GET') {

			if(data) {
				url += ~url.indexOf('?') ? '&' : '?';//添加&或者？
				if(typeof data === 'object') {
					var arr = [];
					for(i in data) {
						arr.push(i + '=' + data[i]);
					}
					url += arr.join('&');
				} else if($isString(data)) {
					url += data;
				}
			}
			http.open('GET', url, true);
			http.send(null)
		} else {
			http.open('POST', url, true);
			http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=' + charset);
			http.send(data)
		}

		function clear() {
			for(i in http) {
				if(http.hasOwnProperty(i)) {
					delete http[i];
				}
			}
			http = null;
			defer = null;
			clear = null;
		}
		return http;
	}
	api.config = config;


	return api;
});