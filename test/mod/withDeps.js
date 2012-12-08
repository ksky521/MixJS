MixJS.define('mod/withDeps',['mod/A','mod/B'],function($){
    console.log('mod.widthDeps 开始定义');
    $.mod.A();
    $.mod.B();
    return function(){
        console.log('i am mod.withDeps');
    }
})