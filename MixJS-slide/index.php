<?php
$version = '20121105';
?>
<!DOCTYPE HTML>
<html>
<head>
    <meta charset="UTF-8">
    <!--<meta name="viewport" content="width=device-width, initial-scale=1.0" />-->
    <title>FX设计的思考</title>
    <link rel="stylesheet" href="css/mixjs.css?v=<?=$version?>" />
    <link rel="stylesheet" media="only screen and (max-device-width: 480px)" href="css/iphone.css">
    <?php    
    $agent = strtolower($_SERVER['HTTP_USER_AGENT']);
    $is_iphone = (strpos($agent, 'iphone')) ? true : false;  
    $is_ipad = (strpos($agent, 'ipad')) ? true : false;  
    $isControl = false;
    if(isset($_GET['ctrl']) && !empty($_GET['ctrl'])){
        $ctrlUID = $_GET['ctrl'];
        $isControl = true;
           ?>
           <script type="text/javascript">var controlUID = '<?=$ctrlUID?>';</script>         
           <?php
       
    }else{
    ?>
        <script type="text/javascript">var controlUID = false;</script> 
    <?php
   }
    ?>
    <base target="_blank" />
</head>
<body style="opacity: 0" class="layout-widescreen <?if($isControl){echo 'popup with-notes';}?>">
<section class="help" id="helpContainer">
    <article class="flexbox vcenter">
      <h1>操作说明</h1>
        <p>本网页内容由 <a href="//js8.in/" target="_blank">TheoWang</a> (微博 @<a href="//weibo.com/sanshuiqing" target="_blank">三水清</a>)，操作指南：</p>
        <ul>

            <li>向上翻页：← ↑ 及pageUp键</li>
            <li>向下翻页：→ ↓ 及pageDown键</li>
            <li>Q键：开启/关闭 二维码页面</li>
            <li>P键：开启画板 / C键：清空画板</li>
            <li>F键：开启/关闭 全屏</li>
            <li>N键：开启/关闭 备注笔记（限有备注页）</li>
            <li>H键：开启/关闭 高亮（限有高亮页）</li>
            <li>W键：切换宽窄屏</li>
            <li>Shift+H键：开启/关闭 帮助页面</li>
            <li>Ctrl+(-)键：缩放页面，Ctrl+0还原100%比例页面</li>
            <li>触摸设备支持左右滑屏进行翻页</li>
        </ul>
        <p>如果选择打开配置webSocket控制功能，手机通过扫描二维码，可以实现控制功能:</p>
        <ul>
            <li>命令进入nodejs文件夹，运行：node server.js开启websocket功能</li>
            <li>控制端简化界面操作，带有下页预览，实时备注和控制按钮</li>
            <li>同websocket来通信，完成控制，所以需要浏览器支持websoket功能</li>
            <li>所有外部暴露函数采用代理方式，控制端执行则发送到client执行</li>
        </ul>
    </article>
</section>
<section class="help" id="qrcodeContainer">
    <article class="flexbox vcenter">
        <h1>扫描二维码，就能控制</h1>
        <div id="qrcode" style="width:256px;height:256px;">            
        </div>
    </article>
</section>
    <section class="slides" id="container">
            <section class="slide title-slide segue" style="background:url(./bg/Maldives_Travel_02001.jpg) no-repeat center center">
                <hgroup class="auto-fadein">
                  <h1>FX设计的思考</h1>
                  <p>三水清</p>
                </hgroup>
            </section>
            <section class="slide" style="background:url(./bg/Maldives_Travel_01004.jpg) no-repeat center center">
                <article class="flexbox vcenter"><h1 class="yellow fsize42 reflect">了解MixJS产生的背景</h1></article>
            </section>
            <section class="slide">
                <aside class="note">
                  <section>
                    <ul>
                    <li>面向模块化开发</li>
                    <li>保证代码安全不受干扰</li>
                    <li>但是第三方网站可能真的很乱</li>
                    </ul>
                  </section>
                </aside>
                <hgroup>
                   <h2>MixJS产生的背景</h2>  
                   <h3>MixJS是个前端模块化管理的东东，提供模块管理、打包、解耦机制等</h3>                     
                </hgroup>   
                <h4 class="build"><span>第三方网站可能很脏很乱</span></h4>              
                <ul class="build">                            
                    <li>会污染我们的代码
                    <ul>
                            <li>
                                <pre class="prettyprint" data-lang="javascript">Array.prototype.forEach = function(){}</pre>
                            </li>
                        </ul>    
                    </li>

                    <li>会跟我们代码冲突
                        <ul>
                            <li><pre class="prettyprint" data-lang="javascript">function $(){}</pre></li>
                            <li><pre class="prettyprint" data-lang="css">
#id {width:100px}
.content {display:none;}</pre></li>
                        </ul>
                    </li>
                    <li>代码不够标准
                        <ul>
                            <li><pre class="prettyprint" data-lang="javascript">document.getElementsByTagName('head')[0]//没有head？</pre></li>
                        </ul>
                    </li>
                </ul>                        
            </section>
            <section class="slide">
                <hgroup>
                   <h2>风行产品特点</h2>          
                </hgroup>   
                
                <ul class="build">                            
                    <li>风行按照功能来拆分后会有很多交集
                        <ul>
                            <li>发布框组件，图形化@也是发布框</li>
                            <li>话题有发布框</li>
                            <li>瀑布流有发布框</li>
                            <li>评论转发也是发布框</li>
                        </ul>
                    </li>
                    <li>外形相似，功能相似，但是接口不同
                        <ul>
                            <li>邀请类组件</li>
                            <li>排行榜类组件</li>
                        </ul>
                    </li>
                    <li>有些隐性功能是每个模块必备的
                        <ul>
                            <li>登录与判断</li>
                            <li>pv统计</li>
                        </ul>
                    </li>
                </ul>                        
            </section>
            <section class="slide">
                <aside class="note">
                  <section>
                    <h2>一个程序员可能是这样的</h2>
                    <ul>
                    <li>外表邋遢，却有代码洁癖</li>
                        <li>懒惰，但是却愿意花时间去格式化代码</li>
                        <li>Don't repeat yourself</li>
                        <li>觉得自己很cool</li>                            
                        <li>想拯救世界</li>
                    </ul> 
                  </section>
                </aside>
                <h4 style="text-align:center" class="reflect">怎么解决上面的这些问题呢？</h4>           
                <article class="flexbox vcenter">
                  <img src="img/think.png" />                  
                </article>
            </section>
            <section class="slide">
                <hgroup>
                    <h2>MixJS思考 1</h2>
                    <h3>功能交集可以通过模块划分来解决</h3>
                </hgroup>
                <article>                       
                    <ul class="build">
                        <li>模块化
                            <ul>
                                <li>“懒惰”</li>
                                <li>轻便</li>
                                <li>复用性</li>
                            </ul>  
                        </li>
                        <li>解耦
                           <ul>
                                <li>松耦合</li>
                                <li>EventBus</li>
                            </ul> 
                        </li>                    
                        <li>高内聚
                            <ul>
                                <li>html和js紧密</li>
                            </ul>
                        </li>
                    </ul>
                </article>
            </section>
            <section class="slide">
                <hgroup>
                    <h2>风行架构思考 2</h2>
                    <h3>环境脏乱，除了注意自己行为，能否利用呢？</h3>
                </hgroup>
                <article>
                    <ul class="build">
                        <li>环境再“利用”
                            <ul>
                                <li>怎么利用jQuery？</li>
                                <li>减少http请求</li>
                            </ul>
                        </li>
                        <li>和谐的代码
                            <ul>
                                <li>我们的代码不要“小三”</li>
                                <li>但也要尊重公婆</li>
                            </ul>
                        </li>
                    </ul>
                </article>
            </section>
            <section class="slide">
                <hgroup>
                    <h2>风行架构思考 3</h2>
                    <h3>降低学习成本，标准化组件</h3>
                </hgroup>
                <article>
                    <ul class="build">
                        <li>降低学习成本
                            <ul>
                                <li>（活动）开发者往往并不不关心实现，只关心方法/接口/参数</li>
                                <li>开发者作为用户，Don’t Make Me Think！</li>
                            </ul>
                        </li>
                        <li>标准化
                            <ul>
                                <li>代码风格</li>
                                <li>参数统一</li>
                                <li>调用一致</li>
                                <li>也可以降低学习成本</li>
                            </ul>
                        </li>                                                   
                        <li>渐进增强 || 平稳退化</li>
                    </ul>
                </article>
            </section>
            <section class="slide" style="background:url(./bg/Maldives_Travel_02007.jpg) no-repeat center center">
                <aside class="note">
                  <section>
                    <ul>  
                    <li>根据产品特点制定解决方案</li>   
                    <li>fx.js的提出</li>                 
                    </ul>
                  </section>
                </aside>
                <article class="flexbox vcenter"><h1 class="fsize42 reflect blue">风行前端解决方案</h1></article>
            </section>
            <section class="slide">
                <hgroup>
                    <h2>js解决方案：fx.js</h2>
                    <h3 class="build"><span>从业务出发，做好自己！</span> </h3>
                </hgroup>
                <article>                    
                    <ul class="build">
                        <li>fx.js：微核心，核心是种子模块
                            <ul>
                                <li>命名空间</li>
                                <li>模块定义、加载、管理</li>
                                <li>类型判断</li>
                                <li>调试机制</li>
                                <li>pv统计、错误收集</li>
                            </ul>
                        </li>
                        <li>base.js：jQuery
                            <ul>
                                <li>利用环境，判断是否存在jQuery，不存在再加载</li>
                            </ul>
                        </li>
                    </ul>
                </article>
            </section>
            <section class="slide">
                <hgroup>
                    <h2>MixJS代码示例</h2>
                    <h3><a href="https://github.com/amdjs/amdjs-api/wiki/AMD">AMD规范</a>的模块定义</h3>
                </hgroup>
                <article>   
                    <pre class="prettyprint" data-lang="javascript">
//定义，第二个参数除了依赖模块，还可以为css样式表
MixJS.define('test', ['tool/cookie', 'js/at'], function($){
    var a = 1;
    //固定形式，return出的就是模块内容
    <b>return function(){
        var c = $.cookie('abc');
        $.at(document.getElementById('test'));
        alert(a);
        alert(c);
    }</b>
});
//使用模板
MixJS.use('test', callback);
</pre>
    </article>
                                 
                    <p class="build"><span>本模块依赖的模块（文件）提前加载，加载后执行maker函数</span> </p>
                    <p class="build"><span class="green">maker函数是工厂函数，闭包可以解决外界冲突</span> </p>
                </article>
            </section>
            <section class="slide">
                <hgroup>
                    <h2>fx.js代码示例</h2>
                    <h3>风行组件调用</h3>
                </hgroup>
                <article>                     
                    <pre class="prettyprint" data-lang="javascript">
//回调调用，个性化定制
MixJS.use('moduleName', function($){
    $.moduleName.init({appkey:'xxx'}).show();
});</pre>
                    
                </article>
                <p class="build"><span class="green">使用use是对外包装的风行组件（例如board），采用<strong>callsafe</strong>技术</span></p>
                <ul class="build">
                    <li>变得更懒：不触发不加载</li>
                    <li>标准化调用方式</li>
                </ul>
            </section>
            <section class="slide">
                <hgroup>
                    <h2>callsafe技术背景</h2>
                    <h3 class="build"><span>一种安全回调的技术，可以打破接口与前置条件之间的依赖关系，使写代码更轻松</span></h3>
                </hgroup>
                <article class="build"> 
                    
                    <pre class="prettyprint" data-lang="javascript">
//A组件调用，传入参数为一个对象，代码如下
MixJS.use('A', function($){});
//那么fx加载A模块的js文件
MixJS.define('A',['tool/cookie', 'css/a.css'],maker);
//发现有依赖模块（cookie）和文件（a.css）
//此时A并未没达到初始化的条件
//callsafe发挥作用，保存上下文、作用域、参数
//等待依赖文件加载完成，再调用</pre>
                    
                </article>
                <p class="build"><span class="green">callsafe核心是队列</span></p>
            </section>
            <section class="slide">
                <hgroup>
                    <h2>css解决方案</h2>
                </hgroup>
                <article>   
                    <ul class="build">
                        <li>采用class选择器，避免id冲突</li>
                        <li>css命名空间 + <b>.FX_</b>前缀</li>
                        <li><a href="http://www.lesscss.net/">lesscss</a></li>
                    </ul>
                </article>
            </section>
            <section class="slide">
                <hgroup>
                    <h2>模块高内聚方案：html+js</h2>
                </hgroup>
                <article>
                    <ul class="build">
                        <li>自定义属性：data-node
                            <ul>
                                <li><pre class="prettyprint" data-lang="html">
&lt;div data-node="selector">
    &lt;span class="loading" data-node="loading">&lt;/span>
&lt;/div></pre></li>
                            </ul>
                        </li>
                        <li>FX.builder
                            <ul>
                                <li><pre class="prettyprint" data-lang="javascript">
FX.builder(html, {            
    close:[
        click:function(){
            $(this).parents('data-node="box"').hide()
        ]
    }
});</pre></li>
                            </ul>
                        </li>
                    </ul>
                    <p class="build"><span class="green">避免id和class样式冲突，模块更加机动灵活，同一页面可以多次使用、可以不同样式</p>
                </article>
            </section>
            <section class="slide">
                <aside class="note">
                  <section>
                    <p>这里说的粗粒度，也可以理解成模块很强大，但是通过参数配置实现不同功能</p>   
                  </section>
                </aside>
                <hgroup>
                    <h2>模块间低耦合方案</h2>
                </hgroup>
                <article>
                    <ul class="build">
                        <li>粗粒度
                            <ul>
                                <li>粒度!==多文件</li>
                                <li>拆分有度！</li>
                            </ul>
                        </li>
                        <li>模块间事件
                            <ul>
                                <li>EventBus</li>
                            </ul>
                        </li>
                        <li>模块依赖关系明确
                            <ul>
                                <li>模块分类管理</li>
                                <li>从复杂到简单</li>
                            </ul>
                        </li>
                    </ul>
                </article>
            </section>
            <section class="slide">
                <hgroup>
                    <h2>EventBus模型：MixJS.event.broadcast</h2>
                    <h3 class="build"><span>模块间实现广播事件，模块重要事件发送广播，其他模块可订阅广播事件</span> </h3>
                </hgroup>
                <article class="build">
                    <h4>应用场景举例：微博话题列表组件</h4>
                    <p>功能：发布框发布微博后，在发布框模块内调用话题列表模块方法</p>
                    <b>普通青年：</b>
     <pre class="prettyprint" data-lang="javascript">
//在发布框模块，进行回调执行
publisher.send(data,function(json){
    //做一些清理工作，例如清除textarea内容等
    //调用话题列表方法，假写微博内容
    topicList.add(json);
});</pre>               
                </article>
                <p class="build"><b>问题：</b><span>假如没有列表（如定制不显示），那么发布框会报错，那你只能通过加一层判断来解决，增加了耦合度</span></p>
            </section>
            <section class="slide">
                <aside class="note">
                  <section>
                    <ul>  
                    <li>为适用复杂功能需求</li>
                    <li>广播还有很多扩展写法</li>   
                    <li>例如：预存参数和上下文等</li>                 
                    </ul>
                  </section>
                </aside>
                <hgroup>
                    <h2>EventBus模型：MixJS.event.broadcast</h2>
                </hgroup>
                <article>
                    <b>文艺青年：</b>
                    <pre class="prettyprint" data-lang="javascript">
//发布框内抛出广播
publisher.send(data,function(json){
    //做一些清理工作，例如清除textarea内容等
    //派发广播
    <b>MixJS.event.broadcast.fire('publisher.send', json);</b>
});

//topicList内部===>话题列表订阅广播
<b>MixJS.event.broadcast.on('publisher.send', function(data){
    topicList.add(json);
});</b>
</pre>  
                </article>
                <p class="build"><span>通过文艺的解耦手法，即使我没有话题列表功能，也不再影响到发布框功能</span></p>
            </section>
            
            <section class="slide">
                <hgroup>
                    <h2>打包工具</h2>
                </hgroup>
                <article>
                    <article class="flexbox vcenter">
                        <img src="img/fx-nodetool.jpg" class="reflect" />
                        <footer class="green" style="margin-top:60px;font-size:18px;text-align:center;">对于iframe引入的组件（话题、瀑布流），js统一合并打包；对于非iframe的（邀请）进行粗粒度优化</footer>
                    </article>
                </article>                   
            </section>
            
            <section class="slide">
                <hgroup>
                    <h2>未来：请允许一个程序猿YY一下</h2>
                    <h3 class="build"><span>是的，每个类库都在标榜自己</span> </h3>
                </hgroup>
                <article>             
                    <ul class="build">
                        <li>可视化定制打包工具及php combo</li>
                        <li>详细的文档</li>
                        <li>单元测试和前端错误监测
                            <ul>
                                <li><pre class="prettyprint" data-lang="javascript">&lt;script data-name="FX" data-debug="true" src="fx.js"&gt;&lt;/script&gt;</pre></li>
                            </ul>
                        </li>                        
                        <li>下一盘很大的棋？
                            <ul>
                                <li>目前是组件库</li>
                                <li>业务逻辑层代码</li>
                                <li>fx.js核心来自theo YY的MixJS</li>
                                <li>不是框架，而是工具集(Utilities)和UI集(Widgets)</li>
                            </ul>
                        </li>
                    </ul>
                </article>
            </section>
            <section class="slide">
                <aside class="note">
                  <section>
                    <ul>
                    <li>fx.js只是开始阶段，还有很多工作要做</li>
                    </ul>
                  </section>
                </aside>
                <article class="flexbox vcenter">
                    综上，<br/>fx.js（MixJS）前景是基于现有成熟框架（jQ等）和具体业务逻辑关系，而开发的一种前端组件（模块）化解决方案，就像名字（MixJS）他可能是个“杂种”
                </article>
            </section>
            <section class="slide" style="background:url(./bg/Maldives_Travel_02005.jpg) no-repeat center center">
                <article class="flexbox vcenter"><h1 class="fsize42 reflect yellow">所以，还有很长的路要走。。。</h1></article>
            </section>
            <section class="slide thank-you-slide segue nobackground">
                <article class="flexbox vleft auto-fadein">
                  <h2>&lt;Q A & Thank You!&gt;</h2>
                  <p class="auto-fadein contact">
                    <span>RTX</span><a href="#" onclick="return false;">theowang</a><br>
                    <span>www</span><a href="http://js8.in">js8.in</a><br>
                </p>
                </article>                
            </section>
        <div class="slideTip" id="slideTip"></div>
        
<?php
if($isControl){ 
?>
    <section class="backdrop" ></section>
    
<?php
}
?>
    </section>
    

    <div class="progress"><span id="progress"></span></div>
    
    <canvas id="drawCanvas" width="1100" height="700" class="qcanvas" ></canvas>
<?php
if($isControl){ 
?>
<footer id="ctrlBtns">
   <button onclick="MixJS.module.slide.prevSlide();return false;">上一页</button>
   <button onclick="MixJS.module.slide.nextSlide();return false;">下一页</button>
   <button id="bindAll" onclick="MixJS.module.slide.sendControlState('bindAll');return false;">完全控制</button>
   <button id="unbind" onclick="MixJS.module.slide.sendControlState('unbind');return false;">释放控制</button>
   <button id="bind" onclick="MixJS.module.slide.sendControlState('bind');return false;">相互同步</button>
</footer> 
<?php
}else{
?>
<div class="helpTip">
    Shift+H for help
</div>
<?php
}
?>
    <script type="text/javascript" src="../mix-0.2.js"></script>
    <script type="text/javascript">
    MixJS.loadJS('js/prettify.js',function(){
        prettyPrint();
    }).use('module/slide',function($){
        $.module.slide({
            controlUID: controlUID,
            transition: 'horizontal'
        });
        
    })
    </script>
    
</body>
</html>