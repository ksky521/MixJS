MixJS.define('testLazy',['b'/*,'c.css','testNormal'*/],function($){
    console.log('testLazy ==>executing');
    // $.testNormal();
    return function(){
        // $.require('a',function(){
        //     console.log('lazy require callback fire!');
        // });
        
        
        console.log('testLazy==>',$.testLazy);
    }
})