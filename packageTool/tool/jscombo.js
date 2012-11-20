//通用模块

var Util = require('util'),
    FS = require('fs'),
    getDeps = require('./getDeps'),
    Uglify = require('../uglify/uglify-js'),
    removeBOMChar = require('./removeBOM').removeBOMChar,
    PATH =require('path');


//var rootPath = 'E:\\www\\MixJS\\nodejstool\\';

var packagedObj = {};//是否已经打包过



module.exports = function(filePath, rootPath, opts){
    opts = opts || {};

    var str = jscombo(filePath,rootPath);
    if(opts.unzip){
        return str;
    }else{
        return Uglify(str);   
    }

};

function jscombo(filePaths, rootPath){

    if(Util.isArray(filePaths)){

        return filePaths.map(function(filePath){
            
            filePath = PATH.join(rootPath,filePath);

            //只打包一次
            if(packagedObj[filePath]){
                return '';
            }

            packagedObj[filePath] = 1;

            //是否存在
            if(FS.existsSync(filePath)){
                //异步读取内容
                var str = FS.readFileSync(filePath, 'utf-8');
                //移出BOM头
                str = removeBOMChar(str);
                var result = getDeps(str, rootPath);
                var content = result.content;
                content = '\n//'+filePath+'----->\n'+content;

                //递归打包
                if(result.list){

                    return jscombo(result.list, rootPath) + content;
                }
                
                //返回内容
                return content;
            }else{
                //文件不存在错误信息
                console.error('jsCombo Error: ' + filePath + ' does not exsist! the path is:'+rootPath);
                return ';alert("' + filePath + ' does not exsist!");';
            }
            
        }).join(';\n');
        
    }else{
        return jscombo([filePaths],rootPath);
    }
}

