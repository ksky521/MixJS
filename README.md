MixJS
=====

组件模块化前端解决方案，提供模块管理、跨域、事件广播等方案。可以用于提供给第三方开发者使用的小组件，核心文件可以单独拿出来作为框架core

MixJS还在开发阶段。。。。

* 模块加载不是单纯的文件加载，需要根据模块规范来写模块哦~

## MixJS模块编写规范

## MixJS引入方式

	<script type="text/javascript" src="mix.js" name="$" debug="true"></script>

* name：MixJS的全局名称，默认是MixJS
* debug：是否调试

## 配置

	MixJS.config({
		path: '路径，否则以MixJS的url为准',
		debug: true,
		charset: '模块js编码'
	});

## 模块定义 MixJS.define

* MixJS.define(moduleName, dependencies, factory)

> `moduleName` 为模块名称，不同于其他模块加载，这里的目录间隔符是 `.`

> `dependencies` 数组，或者 `,` 间隔的String

> `factory` 工厂函数，是个闭包函数，return是实际 `moduleName` 的主体，会被绑定到MixJS上

> * `factory` 接受一个参数：MixJS对象

例如：

	MixJS.define('test.A', ['test.B', 'b', 'c'], function($){
		$.test.B();
		return function(){
			alert('I am MixJS.test.A');
		}
	});

## 模块调用 MixJS.use
	
    MixJS.use('testLazy',function(){alert('success and over');});

    MixJS.use('testLazy,testModules/testA',function(){
        $.testLazy();
        alert('success 1');
    }).use('testLazy,testModules/testB',function(){
        $.testModules.testB();
        alert('success 2');
    });

* 注意：MixJS.use不得在模块定义中使用，否则报错

## 另外功能

除此之外提供了：  

	MixJS.defined：判断模块是否定义
	MixJS.each：数组遍历
	MixJS.mix：杂糅
	MixJS.load：加载js、css
	MixJS.loadJS：加载js
	MixJS.loadCSS：加载css
	MixJS.isFunction等类型判断方法

## import.php(开发中)
	
使用url重写和php实时合并js

## packageTool(计划中)

nodejs上线打包工具

## 版本库地址

支持三种访问协议：

* HTTP协议： `https://ksky521@github.com/ksky521/MixJS.git` 。
* Git协议： `git://github.com/ksky521/MixJS.git` 。
* SSH协议： `ssh://git@github.com:ksky521/MixJS.git` 。

## 克隆版本库

操作示例：

    $ git clone git://github.com/ksky521/MixJS.git
	
## 联系方式

作者博客：[js8.in](http://js8.in)

作者新浪微博：[@三水清](http://weibo.com/sanshuiqing)