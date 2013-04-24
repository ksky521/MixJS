MixJS.define('testModules.testC',['testModules/testD'],function($){
    $.log('test C loaded','fire testD');
    $.testModules.testD();
    return function(){
        alert('i am testC');
    };
})