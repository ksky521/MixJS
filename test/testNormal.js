alert('i am testNormal');
MixJS.define('testNormal', ['a','b','c.css','c'], function($){
    console.log('testNormal==> executing');
    abc();
    return function(){
        alert(1);
        console.log('testNormal==>maked');
    }

})