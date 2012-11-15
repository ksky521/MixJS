MixJS.define('testNormal',['a','b','c.css'],function($){
    console.log('testNormal==> executing');
    return function(){
        alert(1);
        console.log('testNormal==>maked');
    }

})