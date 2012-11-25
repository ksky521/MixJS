MixJS
=====

轻量级前端模块化解决方案，提供模块管理、php实时合并、打包工具等方案。可以用于提供给第三方开发者使用的小组件，核心文件可以单独拿出来作为框架core，在此基础上可以开发出一整套的前端框架

MixJS还在开发阶段。。。。

0.1开发完成了，不得不承认0.1的确有点乱，所以整理了思绪。。。开始0.2的开发计划

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
    MixJS.use('testLazy',function(){alert('success and over');});

    MixJS.use('testLazy,testModules/testA',function(){
        $.testLazy();
        alert('success 1');
    }).use('testLazy,testModules/testB',function(){
        $.testModules.testB();
        alert('success 2');
    });

* 注意：`MixJS.use` 不得在模块定义中使用，否则报错；`MixJS.use` 会先加载preload内容，然后在加载模块

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

## MixJS 其他方法

除此之外提供了：  

	MixJS.defined：判断模块是否定义
	MixJS.each：数组遍历
	MixJS.mix：杂糅
	MixJS.load：加载js、css
	MixJS.loadJS：加载js
	MixJS.loadCSS：加载css
	MixJS.isFunction等类型判断方法

## import.php
	
配合.htaccess文件，完成js文件url重写，通过php实时合并js，减少请求数

## packageTool

已经完成，详见packageTool

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

## LICENCE
* 本软件采用 `BSD` 开源协议，细节请阅读项目中的 `LICENSE.BSD` 文件内容。