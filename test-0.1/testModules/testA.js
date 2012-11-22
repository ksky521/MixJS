MixJS.define('testModules.testA',['testModules/testB','testModules/testC'],function($){
    $.log('test A loaded','fire testB testC');
    $.testModules.testB();
    $.testModules.testC();
    return function(){
        alert('i am testA');
        $.log('i am testA');
    };
})