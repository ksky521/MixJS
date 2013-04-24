alert('i am testNormal');
MixJS.define('testNormal', ['a','b','c.css','c'], function($){
    $.log('testNormal==> executing');
    abc();
    return function(){
        alert(1);
        $.log('testNormal==>maked');
    }

})