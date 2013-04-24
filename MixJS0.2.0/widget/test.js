MixJS.Widget.define('test',{
	js:['http://lib.sinaapp.com/js/jquery/1.4.2/jquery.min.js'],
	main:function(opt){
		console.log('arguments',opt);
		console.log(this);
		this.fireSuccess('test widget success fire');
		this.fireCallback('test widget callback fire');
	}
})