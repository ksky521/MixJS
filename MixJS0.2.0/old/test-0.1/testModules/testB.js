MixJS.define('testModules.testB',function($){
    $.log('test B loaded','no fire');
    
    return function(){
        alert('i am testB');
    };
})