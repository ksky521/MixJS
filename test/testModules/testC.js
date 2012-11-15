MixJS.define('testC',['testModules.testD'],function($){
    console.log('test C loaded','fire testD');
    $.testD();
    return function(){
        console.log('i am testC');
    };
})