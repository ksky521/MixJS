MixJS.define('testModules.testC',['testModules/testD'],function($){
    console.log('test C loaded','fire testD');
    $.testModules.testD();
    return function(){
        console.log('i am testC');
    };
})