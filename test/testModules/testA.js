MixJS.define('testModules.testA',['testModules/testB','testModules/testC'],function($){
    console.log('test A loaded','fire testB testC');
    $.testModules.testB();
    $.testModules.testC();
    return function(){
        console.log('i am testA');
    };
})