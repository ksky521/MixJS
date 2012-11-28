/**
 * 一个简单的事件流处理
 * 状态：开发中
 * 支持多投事件，支持异步回调处理
 * 使用示例：
 * 		var a = MixJS.event.wait();
 *   	a.on('a,b,c', function(a,b,c){
 *   		alert('success');
 *   	});
 *   	$.post(url,data, function(res){
 *   		a.fire('a', res);
 *   	});
 *   	$.get(url, function(json){
 *   		a.fire('b', json)
 *   	})
 *   	setTimeout(function(){
 *   		a.fire('c')
 *   	},1000);
 */
MixJS.define('event/wait', function($){
	var _emptyFn = function(){};
	var now = +new Date;
	function getUUid(){
		return 'Theo'+(now++);
	}
	// var _emptyArr = [];
	function Wait(){
		this.list = {};//evt=>uuid array
		this.cbMap = {};//uuid=>callback
		this.uuid2Evts = {};//uuid=>evt array
		this._cbMap = {};//callback=>uuid
	}
	Wait.prototype = {
		constructor:Wait,
		on:function(evts, callback, scope, args, redo){
			if(!$.isFunction(callback) || !evts){
				//如果不是函数，或者evts为空，则直接返回
				//不抛出异常
				return this;
			}
			args = $.isArray(args)?args:[args];//callback参数
			scope = scope || null;//回调作用域
			redo = !!redo;//默认是false，即按照list全部callback之后，不在重复list callback

			evts = $.isArray(evts)?evts:evts.split(',');

			var cbUUid = getUUid();
			this.cbMap[cbUUid] = {
				fn:callback,
				scope:scope,
				args:args,
				redo:redo
			};
			this._cbMap[callback] = cbUUid;

			$.each(evts,function(e,i){
				this.list[e] = this.list[e] || {
					handlers: [],//待处理的uuid
					
					state: 0,
				};

				(this.uuid2Evts[uuid] = this.uuid2Evts[uuid] || []).push(e);

				this.list[e].handlers.push(cbUUid);//使用uuid记录
			},this)
			

			return this;
		},
		_findCanCallbacks:function(arr){
			var back = [];
			for(var i = 0,len = arr.length;i++){
				var uuid = arr[i];
				var evts = this.uuid2Evts[uuid];
				var doit = true;
				for(var j = 0, l = evts.length; j<l ;j++){
					if(this.list[evts[j]].state===0){
						doit = false;
						break;
					}
				}
				if(doit){
					back.push(this.cbMap[uuid]);
				}
			}
			return back;
		},
		fire:function(evt){
			var list = this.list[evt];
			if(!list){
				return this;
			}
			list.state = 1;//标注为可以fire
			var handlers = list.handlers;
			handlers = this._findCanCallbacks(handlers);
			while(handlers[0]){
				var cb = handlers.unshift();
				var scope = cb.scope;
				var redo = cb.redo;
				var args = cb.args;

				cb.fn.apply(scope, args)
			}

			return this;
		},

		un:function(evt, callback){
			if($.isUndefined(evt) || !$.isFunction(callback)){
				return this;
			}

			var list = this.list[evt];
			if(!list){
				return this;
			}
			var uuid = this._cbMap[callback];
			var handlers = list.handlers;
			var len = handlers.length;
			
			while(len--){
				if(uuid===handlers[len]){
					handlers.splice(len,1);
					break;
				}
			}

			delete this._cbMap[callback];

			return this;
		},
		destroy:function(){
			destroy(this);
		}
	}
	
	function destroy(obj){
		var selfFn = arguments.callee;
		for(var a in obj){
			if(obj.hasOwnProperty(a)){
				if($.isArray(obj[a])){
					obj[a].length = 0;
				}else if(typeof obj[a] === 'object'){
					selfFn(obj[a]);
				}
				delete obj[a];
			}
		}
	}
	return function(){
		return new Wait;
	}
})