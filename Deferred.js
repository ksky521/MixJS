/**
 * 延迟队列
 * 从jQuery中抽离的
 * 用法见test-0.2/deferred.html
 */
MixJS.define('Deferred', function($, undefined) {
	var emptyArr = [];

	var getQueue = function() {
			var list = [];
			var queue = {
				//添加
				add: function() {
					if(list) {
						var args = toArray(arguments);
						(function _add(args) {
							$.each(args, function(v) {
								if($.isArray(v)) {
									_add(v);
								} else {
									//保证是函数
									if($.isFunction(v)) {
										list.push(v);
									}
								}
							})

						}(args));
					}
					return this;
				},
				//触发
				fire: function() {
					return queue.fireWith(queue, arguments);
				},
				//触发with上下文
				fireWith: function(scope, args) {

					if(list) {
						args = toArray(args);
						$.each(list, function(v) {
							v.apply(scope, args);
						}, queue)
					}

					return queue.disable();
				},
				disable: function() {
					list = undefined;
					return this;
				}
			};
			return queue;
		}

	var Deferred = function(func) {
			var state = 'unfulfilled'; //fulfilled,failed
			var deferred = {};
			var arr = [
				['resolve', 'done', getQueue(), 'fulfilled'],
				['reject', 'fail', getQueue(), 'failed'], ];
			var promise = {
				'@THEO': 'promise',
				//加个特征，用于判断
				state: function() {
					return state
				},
				then: function() {
					var fns = toArray(arguments);
					return Deferred(function(newDefer) {

						$.each(arr, function(v, i) {
							var action = v[0],
								fn = fns[i];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[v[1]]($.isFunction(fn) ?
							function() {
								var returned = fn.apply(this, arguments);

								if(returned && returned['@THEO'] === 'promise') {
									//异步
									returned.promise().done(newDefer.resolve).fail(newDefer.reject);
								} else {
									//同步
									newDefer[action + 'With'](this === deferred ? newDefer : this, [returned]);
								}
							} : newDefer[action]);
						});
						fns = null;
					}).promise();
				},
				always: function(fn) {
					return promise.done(fn).fail(fn);
				},
				promise: function(obj) {
					//如果obj是promise，直接返回，不是则mix
					//如果obj不存在，返回promise
					return obj != null ? (obj['@THEO'] === 'promise' ? obj : $.mix(obj, promise)) : promise;
				}
			};


			$.each(arr, function(v, i) {
				var resolve = v[0],
					done = v[1],
					queue = v[2],
					stateString = v[3];

				queue.add(function() {
					state = stateString; //切换状态
					//清空另外的数组
				}, arr[i ^ 1][2].disable);

				promise[done] = queue.add;
				promise[resolve] = queue.fire;
				promise[resolve + 'With'] = queue.fireWith
			}, promise);
			//添加别名
			promise.success = promise.done;
			promise.error = promise.fail;
			promise.complete = promise.always;

			promise.promise(deferred);

			if(func) {
				func.call(deferred, deferred);
			}
			return deferred;
		}

	function toArray(a) {
		return emptyArr.slice.call(a);
	}
	$.mix($, {
		getQueue:getQueue,//队列
		// Deferred helper
		when: function(subordinate /* , ..., subordinateN */ ) {
			var i = 0,
				resolveValues = toArray(arguments),
				length = resolveValues.length,

				// the count of uncompleted subordinates
				remaining = length !== 1 || (subordinate && subordinate['@THEO'] === 'promise') ? length : 0,

				// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
				deferred = remaining === 1 ? subordinate : $.Deferred(),

				// Update function for both resolve and progress values
				updateFunc = function(i, contexts, values) {
					return function(value) {
						contexts[i] = this;
						values[i] = arguments.length > 1 ? toArray(arguments) : value;
						if(!(--remaining)) {
							deferred.resolveWith(contexts, values);
						}
					};
				},
				progressValues, progressContexts, resolveContexts;

			// add listeners to Deferred subordinates; treat others as resolved
			if(length > 1) {
				progressValues = new Array(length);
				progressContexts = new Array(length);
				resolveContexts = new Array(length);
				for(; i < length; i++) {
					if(resolveValues[i] && resolveValues[i]['@THEO'] === 'promise') {
						resolveValues[i].promise().done(updateFunc(i, resolveContexts, resolveValues)).fail(deferred.reject);
					} else {
						--remaining;
					}
				}
			}

			// if we're not waiting on anything, resolve the master
			if(!remaining) {
				deferred.resolveWith(resolveContexts, resolveValues);
			}

			return deferred.promise();
		}
	});

	return Deferred;

})