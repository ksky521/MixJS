/**
 * MixJS介绍PPT
 * html5+css3版本
 * @param  {[type]}
 * @return {[type]}
 */
MixJS.define('module/slide',['module/qrcode'], function(F) {
    var $win = window,
        $doc = document;
    var controlUID;
    var webSocket, doWebSocket = true,
        webSocketHost; //'http://192.168.2.4:3000';
    var touchSensitivity = 15;
    var $body = $doc.body;
    var ctrlType = 'bind';
    var doHash = true;
    var touchStartX = 0;
    var touchStartY = 0;
    var transition = '';
    var touchDX = 0; //touch事件x数据
    var touchDY = 0; //touch事件y数据
    var stepWidth = 1100; //翻页单步宽度
    var curIndex = 0; //当前幻灯片索引
    var $progress;
    var $slideTip;//消息提示
    var $container; //幻灯片容器
    var $slides; //幻灯片集合
    var slideCount; //幻灯片总页数-1
    var $drawCanvas;


    //设置底部进度条
    function setProgress() {
        $progress.style.width = ((curIndex + 1) / (slideCount + 1)) * 100 + '%';
    }

    //泛数组转换为数组
    function toArray(arrayLike) {
        return [].slice.call(arrayLike);
    }
    //封装选择器
    function $(selector, context) {
        context = (context && context.nodeType === 1) ? context : $doc;
        return context.querySelectorAll(selector);
    }
    //getID方法
    function $$(id) {
        return $doc.getElementById(id);
    }
    $doc.cancelFullScreen = $doc.webkitCancelFullScreen ||
                            $doc.mozCancelFullScreen
    //pc键盘翻页事件逻辑
    function evtDocDown(e) {
        var key = e.keyCode;
        switch(key) {
            case 81://Q: Toggle qrcode
                $$('qrcodeContainer').classList.toggle('show');
                break;
            case 72: // H: Toggle code highlighting
                if(e.shiftKey){
                    //打开帮助
                    $$('helpContainer').classList.toggle('show');
                }else{
                    $doc.body.classList.toggle('highlight-code');
                }
              
              break;
            case 78: // N打开笔记
                if(!controlUID){
                    $doc.body.classList.toggle('with-notes');
                }
                
                break;
            case 70: // F: Toggle fullscreen
               // Only respect 'f' on body. Don't want to capture keys from an <input>.
               // Also, ignore browser's fullscreen shortcut (cmd+shift+f) so we don't
               // get trapped in fullscreen!
              if(e.target == $doc.body && !(e.shiftKey && e.metaKey)) {
                    if($doc.mozFullScreen !== undefined && !$doc.mozFullScreen) {
                        $doc.body.mozRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                    } else if($doc.webkitIsFullScreen !== undefined && !$doc.webkitIsFullScreen) {
                        $doc.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                    } else {
                        $doc.cancelFullScreen();
                    }
                }
              break;

            case 87: // W: Toggle widescreen
              // Only respect 'w' on body. Don't want to capture keys from an <input>.
              if (e.target == $doc.body && !(e.shiftKey && e.metaKey)) {
                    $doc.body.classList.toggle('layout-widescreen');
              }
              break;

            case 80://
                showPaint();
                break;
            case 67://c
                removePaint();
                break;
                //上一页
            case 33:; // pg up
            case 37:; // left
            case 38:// up
                (controlUID || ctrlType !== 'bindAll') && prevSlide();
                break;
                //下一页
            case 9:; // tab
            case 32:; // space
            case 34:; // pg down
            case 39:; // right
            case 40:
                // down
                (controlUID || ctrlType !== 'bindAll') && nextSlide()
                break;
        }

        //      $container.style.marginLeft = -(curIndex * stepWidth) + 'px';
        //      setProgress();
        //      setHistory();
    }
    //上一页
    function prevSlide() {
        if(!controlUID){
            $doc.body.classList.remove('with-notes');
        }
        
        slideOutCallBack($slides[curIndex]);
        --curIndex < 0 && (curIndex = 0);
        doSlide();
    }
    //下一页
    function nextSlide() {
        if(!controlUID){
            $doc.body.classList.remove('with-notes');
        }
        if(buildNextItem()) {
            doWebSocket && sendWebSoketMessage({
                donext: curIndex,
                action: 'update'
            });
            return;
        }
        slideOutCallBack($slides[curIndex]);
        ++curIndex > slideCount && (curIndex = slideCount);
        doSlide();
        preload($slides[curIndex])($slides[curIndex + 1]);
    }
    //slide转换incallback
    function slideInCallBack() {
        var $cur = $slides[curIndex];
        if(!$cur || ($cur && $cur.nodeType !== 1)) {
            return;
        }
        //如果有data-incallback那么就执行callback
        $cur.dataset.incallback && typeof window[$cur.dataset.incallback] === 'function' && proxyFn($cur.dataset.incallback);
    }
    //slide转换outcallback
    function slideOutCallBack(prev) {
        if(!prev || (prev && prev.nodeType !== 1)) {
            return;
        }
        //如果有data-outcallback那么就执行callback
        prev.dataset.outcallback && typeof window[prev.dataset.outcallback] === 'function' && proxyFn(prev.dataset.outcallback);
    }
    //预加载资源
    function preload(node) {
        var self = arguments.callee;
        if(node && node.nodeType === 1) {
            var $preload = $('preload', node),
                len = $preload.length;
            while(len--) {
                var tmpNode = $preload[len],
                    dataset = $preload[len].dataset,
                    type = dataset.type,
                    url = dataset.url;
                var fn = $win['load' + type.toUpperCase()];
                F.isFunction(fn) && fn(url, function(tmpNode) {
                    return function() {
                        tmpNode.parentNode && tmpNode.parentNode.removeChild(tmpNode);
                        tmpNode = null;
                    }
                }(tmpNode));
            }
        }
        return self;
    }
    //单行前进
    function buildNextItem() {
        var toBuild = $('.to-build', $slides[curIndex]);

        if(!toBuild.length) {
            return false;
        }
        toBuild[0].classList.remove('to-build', '');

        return true;
    };
    //设置单行页面添加
    function makeBuildLists() {
        var i = slideCount,
            slide;
        while(slide = $slides[--i]) {
            if(!controlUID && transition!==''){
                slide.dataset.transition = transition;
            }
            var items = $('.build > *', slide);
            for(var j = 0, item; item = items[j]; j++) {
                if(item.classList) {
                    item.classList.add('to-build');
                }
            }
        }

    };

    //切换动画
    function doSlide(slideID) {
        

        slideID = slideID || curIndex;
        //$container.style.marginLeft = -(slideID * stepWidth) + 'px';
        updateSlideClass();
        setProgress();
        doWebSocket && sendWebSoketMessage({
            slideID: slideID,
            action: 'update'
        });
        doHash && ($win.location.hash = "#" + slideID);
        slideInCallBack();
        removePaint();
    }
    function updateSlideClass(){
         var curSlide = curIndex;
          for (var i = 0,len = $slides.length; i < len; ++i) {
            switch (i) {
              case curSlide - 2:
                updateSlideClass_(i, 'far-prev');
                break;
              case curSlide - 1:
                updateSlideClass_(i, 'prev');
                break;
              case curSlide:
                updateSlideClass_(i, 'current');
                break;
              case curSlide + 1:
                updateSlideClass_(i, 'next');
                break;
              case curSlide + 2:
                updateSlideClass_(i, 'far-next');
                break;
              default:
                updateSlideClass_(i);
                break;
            }
          };
    }
    function updateSlideClass_(slideNo, className) {
        var el = $slides[slideNo];

        if(!el) {
            return;
        }

        if(className) {
            el.classList.add(className);
        }
        var arr = ['next','prev','far-next','far-prev','current'];

        for(var i = 0, slideClass; slideClass = arr[i]; ++i) {
            if(className != slideClass) {
                el.classList.remove(slideClass);
            }
        }
    }
    //绑定事件
    function bindEvent() {
        $doc.addEventListener('keyup', evtDocDown, false);
        $body.addEventListener('touchstart', evtTouchStart, false);
        // !controlUID && bindHelp();
        $win.addEventListener('hashchange', function() {
            if(location.hash) {
                doHash = false;
                slideOutCallBack($slides[curIndex]);
                curIndex = location.hash.substr(1) | 0;
                doSlide();
                doHash = true;
            }

        }, true);
        //      $win.addEventListener('popstate', evtHistory, false);
    }
   
    var config = {
        control: true,//是否控制
        webSocketHost: 'http://127.0.0.1:30000/',//nodejs websocket地址
        controlUID: false,//是否为控制端
        progressID: 'progress',//进度条id
        containerID: 'container',//容器ID
        slidesClassName: 'slide',//slideclassname
        canvasID:'drawCanvas',//canvas绘画ID
        slideTipID:'slideTip',
        transition:''//翻页效果
    };
    //初始化

    function init(opt) {
        config = F.mix(config, opt);

        doWebSocket = config.control;
        // console.log(config);
        controlUID = config.controlUID;
        transition = config.transition;

        webSocketHost = config.webSocketHost + (controlUID ? 'phone' : 'pc');
        
        stepWidth = config.stepWidth;
        $slideTip = $$(config.slideTipID);

        $progress = $$(config.progressID);
        $container = $$(config.containerID); //幻灯片容器
        $slides = toArray($('.' + config.slidesClassName, $container)); //幻灯片集合
        slideCount = $slides.length; //幻灯片总页数-1
        
        slideCount--;

        $drawCanvas = $$(config.canvasID);
        
        $drawCanvas && ($drawCanvas.style.display = 'none') && ($doc.onselectstart = function() {
            return false
        });

        if(doWebSocket) {
            F.loadJS('js/socket.io.js', connWebSoket);
        }
     

        makeBuildLists();
        bindEvent();

        location.hash && (curIndex = (location.hash.substr(1) | 0))
        doSlide();
        preload($slides[curIndex])($slides[curIndex + 1]);

        $doc.body.classList.add('loaded');
        
    }

    /******************************** Touch events *********************/
    function evtTouchStart(event) {
        if(event.touches.length == 1) {
            touchDX = 0;
            touchDY = 0;

            touchStartX = event.touches[0].pageX;
            touchStartY = event.touches[0].pageY;
            //捕获，尽早发现事件
            $body.addEventListener('touchmove', evtTouchMove, true);
            $body.addEventListener('touchend', evtTouchEnd, true);
        }
    };
    //touch事件
    function evtTouchMove(event) {
        if(event.touches.length > 1) {
            cancelTouch();
        } else {
            touchDX = event.touches[0].pageX - touchStartX;
            touchDY = event.touches[0].pageY - touchStartY;
        }
    };
    //touchend事件
    function evtTouchEnd(event) {
        var dx = Math.abs(touchDX);
        var dy = Math.abs(touchDY);

        if((dx > touchSensitivity) && (dy < (dx * 2 / 3))) {
            if(touchDX > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        }
        cancelTouch();
    };

    //取消绑定
    function cancelTouch() {
        $body.removeEventListener('touchmove', evtTouchMove, true);
        $body.removeEventListener('touchend', evtTouchEnd, true);
    };

    
    /***============================soket控制部分>>>>>>>>>>>>>>>>*/
    var socketUid = 0,
        lastSocketTime = 0;
    //链接websoket
    function connWebSoket(){
        try{
            if(doWebSocket){
                doWebSocket = false;
                webSocket = io.connect(webSocketHost);

                webSocket.on('server time', function(data){
                    doWebSocket = true;
                    socketUid = data.uid;
                    // console.log(data.uid);
                    lastSocketTime = data.time;
                    // console.log(socketUid);
                    if(!controlUID){

                        webSocket.emit('get phone uid',{uid:socketUid});

                        var url = location.href;
                        // console.log(F);
                        F.module.qrcode({
                            text: url.substr(0, url.lastIndexOf('/'))+'/?ctrl='+socketUid,
                            container:document.getElementById('qrcode')
                        });
                        // console.log(url.substr(0, url.lastIndexOf('/'))+'/?ctrl='+socketUid);
                    }else{
                        webSocket.emit('get pc uid',{uid:controlUID});
                    }
                });

                //系统消息
                webSocket.on('system', function(data){
                    
                    showTips(data.msg);
                    if(data.dowhat==='free'){
                        ctrlType = 'bind';
                    }
                });

                if (controlUID) {
                    //如果是控制端，则接收pc端更新消息:update
                    // webSocket.on('server update', function(data){
                    //     doWebsocketUpdate(data);
                    // });
                    // webSocket.on('client handle', function(data){
                    //     var handler;
                    //     if(data.handleFnName && F.isFunction(handler = window[data.handleFnName])){
                    //         handler.call(window,data.args);
                    //     }
                    // });
                    webSocket.on('message from pc',function(data){
                        // console.log(data);
                        if(lastSocketTime < data._serverTime){
                            lastSocketTime = data._serverTime;
                            switch(data.action){
                                case 'update':
                                    doWebsocketUpdate(data);
                                    break;
                                case 'handle':
                                    var handler;
                                    if(data.handleFnName && F.isFunction(handler = window[data.handleFnName])){
                                        handler.call(window,data.args);
                                    }
                                    break;

                            }
                        }
                    });
                    
                }else{
                    //如果是pc端，则接收控制消息:order
                    // webSocket.on('server order', function(data){
                    //     doWebsocketUpdate(data);
                    // });
                    // webSocket.on('server handle', function(data){
                    //     var handler;
                    //     if(data.handleFnName && F.isFunction(handler = window[data.handleFnName])){
                    //         handler.apply(window,data.args);
                    //     }
                    // });
                    webSocket.on('message from phone',function(data){
                        // console.log(data);
                        if(lastSocketTime < data._serverTime){
                            lastSocketTime = data._serverTime;
                            switch(data.action){
                                case 'update':
                                    doWebsocketUpdate(data);
                                    break;
                                case 'handle':
                                    var handler;
                                    if(data.handleFnName && F.isFunction(handler = window[data.handleFnName])){
                                        handler.apply(window,data.args);
                                    }
                                    break;
                                case 'status':
                                    switch(data.status){
                                        case 'bind'://完全同步
                                        ctrlType = data.status;
                                        showTips('状态转化：目前是完全同步状态');
                                        break;
                                        case 'unbind':
                                        //释放状态
                                        ctrlType = data.status;
                                        showTips('状态转化：目前是释放控制状态');
                                        break;
                                        case 'bindAll':
                                        //完全绑定
                                        ctrlType = data.status;
                                        showTips('状态转化：目前是完全控制状态');
                                        break;
                                    }
                                    break;
                            }
                        }
                    });
                }
            }
        }catch(e){
            throw new Error('websocket connect error!');
        }
    }
    //控制状态
    function sendControlState(status){
        //bind
        //bindAll
        //unbind    
        // console.log(111111111,controlUID,doWebSocket,webSocket);    
        if( controlUID && doWebSocket && webSocket){
            ctrlType = status;
            webSocket.emit('message from phone',{action:'status',status:status});
            'bind bindAll unbind'.replace(/\S+/g,function(a){
                $$(a).classList.remove('orange');
                if(status===a){
                    $$(status).classList.add('orange');
                }
            });
        }
    }
    
    //控制端代码=========================>
    function doWebsocketUpdate(data){
        //控制端
        doWebSocket = 0;
        if (data.donext && curIndex === data.donext) {
            nextSlide();
            doWebSocket = 1;
            return;
        }
        curIndex = data.slideID;
        
        doSlide();
        preload($slides[curIndex])($slides[curIndex+1]);
        doWebSocket = 1;
    }
    //<==========end==============pc端代码
    //显示tips
    function showTips(msg){
        if(!$slideTip){
            return;
        }
        $slideTip.innerHTML = msg;
        $slideTip.style.display = 'block';
        setTimeout(function(){
            $slideTip.style.display = 'none';
        },3E3);
    }
    
    //发送webSocket消息
    function sendWebSoketMessage(json){
        if(doWebSocket && webSocket && ctrlType!=='unbind'){
            // json.uid = socketUid;
            // json.action = 'update';
            webSocket.emit(controlUID?'message from phone':'message from pc',json);

        }
    }
    //发送webSocket执行函数命令
    function sendWebSoketOrder(handleFnName,args){
//      console.log(handleFnName);message from phone
        if(doWebSocket && webSocket && ctrlType!=='unbind'){
//          console.log('send order');
         
            webSocket.emit(controlUID?'message from phone':'message from pc',{action:'handle', handleFnName:handleFnName,args:args});
        }
    }

    /***********画图部分事件处理函数************/
    //画图前准备
    function drawCanvasReady() {
        if(!$drawCanvas) {
            return;
        }
        var t = $drawCanvas.context = $drawCanvas.getContext('2d');
        t.lineWidth = 3;
        t.lineCap = 'round';
        t.strokeStyle = "red";
    }
    //显示画板
    function showPaint() {
        if(!$drawCanvas) {
            return;
        }
        drawCanvasReady();
        $drawCanvas.style.display = '';

        $drawCanvas.addEventListener('mousedown', pMouseDown, true);
        $drawCanvas.addEventListener('mouseup', pMouseUp, true);
        $drawCanvas.addEventListener('mousemove', pMouseMove, true);

    }
    //清除画板内容
    function clearPaint() {
        if(!$drawCanvas) {
            return;
        }
        $drawCanvas.context && $drawCanvas.context.clearRect(0, 0, 800, 600);
        $drawCanvas.style.display = 'none';
    }
    //删除画板
    var removePaint = function() {
            if(!$drawCanvas) {
                return;
            }
            clearPaint();
            $drawCanvas.removeEventListener('mousedown', pMouseDown);
            $drawCanvas.removeEventListener('mouseup', pMouseUp);
            $drawCanvas.removeEventListener('mousemove', pMouseMove);
        },
        pMouseDown = function(e) {
            $drawCanvas.isMouseDown = true;
            $drawCanvas.iLastX = e.layerX || e.offsetX || (e.clientX - $drawCanvas.offsetLeft + ($win.pageXOffset || $doc.body.scrollLeft || $doc.documentElement.scrollLeft));
            $drawCanvas.iLastY = e.layerY || e.offsetY || (e.clientY - $drawCanvas.offsetTop + ($win.pageYOffset || $doc.body.scrollTop || $doc.documentElement.scrollTop));
        },
        pMouseUp = function() {
            $drawCanvas.isMouseDown = false;
            $drawCanvas.iLastX = -1;
            $drawCanvas.iLastY = -1;
        },
        pMouseMove = function(e) {
            if($drawCanvas.isMouseDown) {
                var iX = e.layerX || e.offsetX || (e.clientX - $drawCanvas.offsetLeft + ($win.pageXOffset || $doc.body.scrollLeft || $doc.documentElement.scrollLeft));
                var iY = e.layerY || e.offsetY || (e.clientY - $drawCanvas.offsetTop + ($win.pageYOffset || $doc.body.scrollTop || $doc.documentElement.scrollTop));
                var t = $drawCanvas.context;
                t.beginPath();
                t.moveTo($drawCanvas.iLastX, $drawCanvas.iLastY);
                t.lineTo(iX, iY);
                t.stroke();
                $drawCanvas.iLastX = iX;
                $drawCanvas.iLastY = iY;
            }
        };

    //代理函数
    function proxyFn(fnName, args) {
        if(controlUID) {

            doWebSocket && ctrlType !== 'unbind' && sendWebSoketOrder(fnName, args);
        } else if(typeof window[fnName] === 'function') {
            window[fnName](args);
        }
    }

    var slide = function(opt){
        init(opt);
    }

    slide.nextSlide = nextSlide;
    slide.prevSlide = prevSlide;
    slide.sendControlState = sendControlState;
    slide.sendWebSoketOrder = sendWebSoketOrder;

    slide.proxyFn = proxyFn;


    return slide;
});