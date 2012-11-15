MixJS.define('testA',['testModules/testB','testModules/testC'],function($){
    console.log('test A loaded','fire testB testC');
    $.testB();
    $.testC();
    return function(){
        console.log('i am testA');
    };
})