
//E:\www\git\MixJS\test-0.2\mod\B.js----->
MixJS.define('mod/B',function(){
    return function(){
        alert('i am mod.B');
    }
});

//E:\www\git\MixJS\test-0.2\mod\A.js----->
MixJS.define('mod/A',function(){
    return function(){
        alert('i am mod.A');
    }
})
//E:\www\git\MixJS\test-0.2\mod\withDeps.js----->
MixJS.define("mod/withDeps",function($){
    alert('mod.widthDeps 开始定义');
    $.mod.A();
    $.mod.B();
    return function(){
        alert('i am mod.withDeps');
    }
})
//E:\www\git\MixJS\test-0.2\mod\withMoreDeps.js----->
MixJS.define("mod/withMoreDeps",function(){
    alert('mod.withMoreDeps 开始定义');
    $.mod.withDeps();
    return function(){
        alert('i am mod.withMoreDeps');
    }
})