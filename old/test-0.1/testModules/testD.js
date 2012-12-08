MixJS.define('testModules.testD',function($){
    $.log('test D loaded','no fire');
    
    return function(){
        alert('i am testD');
    };
})