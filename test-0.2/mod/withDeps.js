MixJS.define('mod/withDeps',['mod/A','mod/B'],function($){
    alert('mod.widthDeps 开始定义');
    $.mod.A();
    $.mod.B();
    return function(){
        alert('i am mod.withDeps');
    }
})