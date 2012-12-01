MixJS
=====

轻量级前端模块化解决方案，提供模块管理、php实时合并、打包工具等方案。可以用于提供给第三方开发者使用的小组件，核心文件可以单独拿出来作为框架core，在此基础上可以开发出一整套的前端框架

MixJS还在开发阶段。。。。

0.2开发完成，现在开发基于0.2模块的开放平台部分代码，主要包括：Deferred（延迟队列）、API（API接口调用）、Widget（小组件）和XDomain（跨域）

* 模块加载不是单纯的文件加载，需要根据模块规范来写模块哦~

## MixJS模块编写规范

### 模块定义 MixJS.define

* MixJS.define(moduleName, dependencies, factory)

> `moduleName` 为模块名称

> `dependencies` 数组

> `factory` 工厂函数，是个闭包函数，return是实际 `moduleName` 的主体，会被绑定到MixJS上，即： `MixJS.moduleName`

> * `factory` 接受一个参数：MixJS对象

例如：

    MixJS.define('testModules/testA',['testModules/testB','testModules/testC'],function($){
        $.log('test A loaded','fire testB testC');
        $.testModules.testB();
        $.testModules.testC();
        return function(){
            $.log('i am testA');
        };
    })

推荐一个模块为一个文件，再次强调模块：文件定义严格按照下面的规范：

> 1、 `moduleName` 例如： `test/A` ，对应的路径是 `test/A.js`，而调用使用 `MixJS.test.A`

> 2、 `dependencies` 中的值为文件路径格式，例如： `test/A`，对应的文件 `test/A.js` 中的define第一个参数（`moduleName` ）就是 `test/A`

#### 为什么这样做？

MixJS中define过程实际是一个创建命名空间的过程，所以第一个参数 `moduleName` 是个命名空间的范畴，所以用 `/` 间隔，这样有利于相同模块分到同一父模块，这样模块的划分和文件夹结构就形成一一映射关系，例如：`MixJS.array.forEach` 和 `MixJS.array.indexOf` 同属于 `MixJS.array`，并且分别定义在于 `array` 文件夹下的 `forEach.js` 和 `indexOf.js` 中。

另外统一的规范，有利于文件重复加载的判断。

### 模块调用 MixJS.use

 * MixJS.use(moduleName, callback)

> moduleName：模块路径，以 `/` 间隔，实际就是文件路径，支持多个模块使用数组或者 `,` 间隔

> callback：回调函数

例如： 

    MixJS.use('testLazy', function(){alert('success and over');});
    MixJS.use('testLazy,testModules/testA',function(){
        $.testLazy();
        alert('success 1');
    }).use('testLazy,testModules/testB',function(){
        $.testModules.testB();
        alert('success 2');
    });

* 注意：`MixJS.use` 不得在模块定义中使用，否则报错；`MixJS.use` 会先加载preload内容，然后在加载模块

### 模块别名 MixJS.alias

 * MixJS.alias(name[, realurl])

> name：模块名称，模块别名引用的名称

> realurl：模块真实的url地址，假如为空，则返回别名的真实url

例如： 

    MixJS.alias('h-css', '../test/h1.css');
    MixJS.use('h-css,testModules/testA',function(){        
        alert('success');
    })

## MixJS引入方式

	<script type="text/javascript" src="mix.js" name="$" debug="true"></script>

> name：MixJS的全局名称，默认是MixJS

> debug：是否调试

## 配置

	MixJS.config({
		path: '路径，否则以MixJS的url为准',
		debug: true,
		charset: '模块js编码'
	});

## MixJS 其他方法

除此之外提供了：  

    MixJS.noConflict：命名冲突，返回MixJS对象
    MixJS.loaded：判断一个文件是否加载
	MixJS.defined：判断模块是否定义
	MixJS.each：数组遍历
	MixJS.mix：杂糅
	MixJS.loadJS：加载js
	MixJS.loadCSS：加载css
	MixJS.isFunction等基本类型判断方法

## import.php
	
配合.htaccess文件，完成css、js文件url重写，通过php实时合并js和css，减少请求数

可以合并的情况如下：

> css文件：@import url('css/a.css');

> MixJS define模块文件：`MixJS.define('mod/A', ['mod/B', 'mod/C'], function($){})`

## packageTool

nodejs上线打包工具，可以查找依赖关系，例如处理下面的代码：

    MixJS.define('mod/A', ['mod/B', 'mod/C'], function($){
        return {};
    })

处理后：

    MixJS.define('mod/B', function($){
        //
    });
    MixJS.define('mod/C', function($){
        //
    });
    MixJS.define('mod/A', function($){
        return {};
    })

详见packageTool/README.md

## 延迟队列模块：MixJS.Deferred

此模块是延迟队列，提供符合CommonJS的Promise/A标准的promise方法

### MixJS.when

详见：test/deferred.html

### MixJS.Deferred().promise

详见：test/deferred.html

## 开放平台api模块：MixJS.API

此模块是开放平台模块，主要用于开放平台api包装，方便接口开放，此模块依赖Deferred模块

### api设置：MixJS.API.config()

示例：

    $.API.config('sleep', {url:'sleep.php', type:'get', charset:'utf-8', dataType:'json'});
    $.API.config('sleep');//return config

### api执行：MixJS.API(name, data);

示例：

    $.api('sleep',{time:2}).done(function(data){
        console.log('success',data);
    }).fail(function(data){
        console.log('fail',data);
    });

## Widget模块：MixJS.Widget

提供开放平台widget模块定义，优雅的模块接口调用，开发中

## 联系方式

作者博客：[js8.in](http://js8.in)

作者新浪微博：[@三水清](http://weibo.com/sanshuiqing)

## LICENCE

本软件采用 `BSD` 开源协议，细节请阅读项目中的 `LICENSE.BSD` 文件内容。