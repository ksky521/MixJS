MixJS.define('testLazy',['b','c.css','testNormal'],function($){
    console.log('testLazy ==>executing');
    $.testNormal();
    return function(){
        // $.require('a',function(){
        //     console.log('lazy require callback fire!');
        // });
        
        
        console.log('testLazy==>',$.testLazy);
    }
})
.define('testLazy2',['b','a'],function(){
	// alert('testLazy2');
	$.a();
	return function(){

	}
})