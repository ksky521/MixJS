MixJS.define('XDomain', 'Deferred', function($) {
	var win = window;
	var isPostMsg = win.postMessage ? true : false;
	var queue = $.getQueue(false);
	var node, origin = '*',
		timer;

	var sendMessage = function() {
			if(isPostMsg) {
				return function(data) {
					node && node.postMessage && node.postMessage(data, origin);
				}
			} else {
				var hash = '';

				timer = setInterval(function() {
					if(win.name !== hash) {
						hash = win.name;
						hash.slice(0,-20);
						queue.fire(hash)
					}
				}, 50);
				return function(data) {
					node.name = data+'###time'+ (+new Date);//加上时间尾巴
				};
			}
		}();



	function listener(e) {
		queue.fire(e.data||e)
	}
	var xdomain = {
		
		add: queue.add,
		send: sendMessage,
		remove: queue.remove,
		init: function(opt) {
			node = opt.node || window;
			origin = opt.origin || '*';
			if(win.addEventListener) {
				win.addEventListener('message', listener, false)
			} else if(win.attachEvent) {
				win.attachEvent('onmessage', listener);
			} else {
				win.onmessage = listener;
			}
			return xdomain;
		},
		destroy: function() {
			queue.disable();
			timer && clearInterval(timer);
			if(isPostMsg) {

				if(win.removeEventListener) {
					win.removeEventListener('message', listener)
				} else if(win.detachEvent) {
					win.detachEvent('onmessage', listener);
				} else {
					win.onmessage = null;
				}
			}
		}
	};

	return xdomain;
});