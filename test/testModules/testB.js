MixJS.define('testB',function($){
    console.log('test B loaded','no fire');
    
    return function(){
        console.log('i am testB');
    };
})