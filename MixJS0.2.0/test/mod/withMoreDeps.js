MixJS.define('mod/withMoreDeps',['mod/withDeps'],function(){
    console.log('mod.withMoreDeps 开始定义');
    $.mod.withDeps();
    return function(){
        console.log('i am mod.withMoreDeps');
    }
})