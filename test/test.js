MixJS.define('test',function($){
    alert('test开始定义');
    return function(){
        alert('i am module test from test.js');
    }
})