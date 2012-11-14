MixJS.define('testLazy',['b','c.css'],function($){
    return function(){
        // $.require('a',function(){
        //     console.log('lazy require callback fire!');
        // });
        $.require('a',['c'],function(){
            console.log('lazy require callback fire!');
        });

        console.log('testLazy==>',$.testLazy);
    }
})