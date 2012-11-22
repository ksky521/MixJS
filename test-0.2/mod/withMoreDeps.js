MixJS.define('mod/withMoreDeps',['mod/withDeps'],function(){
    alert('mod.withMoreDeps 开始定义');
    $.mod.withDeps();
    return function(){
        alert('i am mod.withMoreDeps');
    }
})