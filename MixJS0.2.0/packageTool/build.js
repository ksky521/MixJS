//加载配置
require('./config.js');

//用到的模块
var FS = require('fs'),
    PATH = require('path'),
    jscombo = require('./tool/jscombo'),
    Util = require('util');


//获取参数
var args = process.argv;
args = [].slice.call(args,2);

var opts = {};//配置
var curPath, rootPath = curPath = process.cwd();

//根据config.js的相对路径设置，变换rootPath
if(typeof relativePath!=='undefined'){
    rootPath = PATH.join(rootPath, relativePath);
}

var filename;//要处理的文件名字

//处理参数
out: while(args.length){

    var v = args.shift();
    
    switch(v){
        case '-uz':
        case '--unzip':
        //combo后压缩
            opts.unzip = true;
        break;
        default:
            filename = v;
            break out;
    }
}

// var filePath = PATH.join(rootPath,filename);
//将要压缩的js文件路径 转化为相对rootpath的路径
var rPath = PATH.relative(rootPath,PATH.join(curPath,filename));


var str = jscombo(rPath, rootPath, opts);
    
var fileout = process.stdout;
fileout.write(str);

