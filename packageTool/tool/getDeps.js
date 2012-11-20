//获取依赖关系
var r = /define\(\s*['|"]([^, ]+?)['|"]\s*,\s*['|"|\[](.+)['|"|\]]\s*/mg,
    PATH =require('path');

Array.prototype.unique = function(){
      for(var 
            a = this.slice().sort(),  // sort this array
            c = a.length,             // length of sorted array
            b = [];                   // result array
            c--;                      // loop
            a[c] === a[c-1] ||        // if current item is equal with neighbor, do not
            b.push(a[c])              // push it
      );
      return b;                       // return the result
}

var getDeps = function(data,rootPath){
    
    return getModuleDependencies(data);
};


getDeps.getModuleDependencies = getModuleDependencies;
getDeps.getPaths = getPaths;



function getModuleDependencies(content){
    if(!content){
        return;
    }
    var depList = [];
    var result = content.replace(r,function(match,moduleName,needs){
        
        needs = needs.split(',').map(function(v){
            
            return v.replace(/['"\s*]/g,'');
        });
        // console.log(needs);
        depList = depList.concat(needs);

        return 'define("'+moduleName+'"';
    });
    // console.log(result);
    depList = depList.unique();
    
    return {content:result,list:getPaths(depList)};
}



function getPaths(list){
    
    return list.map(function(v){
        var extName = PATH.extname(v);
        if(!extName){
            v += '.js';
        }
        return v;
    })
}


module.exports = getDeps;