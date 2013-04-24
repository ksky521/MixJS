;alert("E:\www\git\MixJS\packageTool\testModules\testC.js does not exsist!");;
;alert("E:\www\git\MixJS\packageTool\testModules\testB.js does not exsist!");
//E:\www\git\MixJS\test\testModules\testA.js----->
MixJS.define("testModules.testA",function($){
    $.log('test A loaded','fire testB testC');
    $.testModules.testB();
    $.testModules.testC();
    return function(){
        alert('i am testA');
        $.log('i am testA');
    };
})