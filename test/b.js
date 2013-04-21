define('b', ['a', 'c'], function(a, c) {
    a();
    c();
    d();
    return function() {
        alert('b test');
    }
});