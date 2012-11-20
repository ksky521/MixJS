var io = require('socket.io').listen(30000);
io.set('origins = *');
io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);

var pcUserSockets = {}, phoneUserSockets = {};
var pc2phoneMap = {}, phone2pcMap = {};

//手机端
var phone = io.of('/phone').on('connection', function(socket) {
	var uid = socket.id;
	phoneUserSockets[uid] = socket;

	socket.emit('server time', {
		uid: uid,
		time: +new Date
	});

	socket.on('message from phone', function(data) {	
		var s = getPcSocketByPhoneUid(uid);
		if(s) {
			data._serverTime = +new Date;

			s.emit('message from phone', data)
		}
	});

	socket.on('get pc uid', function(data){
		var u = data.uid;
		phone2pcMap[uid] = u;
		pc2phoneMap[u] = uid;
	});

	socket.on('disconnect', function() {
		var s = getPcSocketByPhoneUid(uid);

		s && s.emit('system', {
			msg: '控制端失去通信',
			dowhat: 'free'
		});
		delete phoneUserSockets[uid];
		var pcuid = phone2pcMap[uid];
		delete phone2pcMap[uid];
		delete pc2phoneMap[pcuid];
	});
});
//pc端
var user = io.of('/pc').on('connection', function(socket) {
	var uid = socket.id;
	pcUserSockets[uid] = socket;

	socket.emit('server time', {
		uid: uid,
		time: +new Date
	});

	socket.on('message from pc', function(data) {		
		var s = getPhoneSocketByPcUid(uid);

		if(s) {
			data._serverTime = +new Date;
			s.emit('message from pc', data)
		}
	});
	socket.on('get phone uid', function(data){
		var u = data.uid;
		pc2phoneMap[uid] = u;
		phone2pcMap[u] = uid;
	});

	socket.on('disconnect', function() {
		var s = getPhoneSocketByPcUid(uid);

		s && s.emit('system', {
			msg: '客户端失去通信',
			dowhat: 'free'
		});
		delete pcUserSockets[uid];
		var phoneuid = pc2phoneMap[uid];
		delete pc2phoneMap[uid];
		delete phone2pcMap[phoneuid];
	});

});

function getPcSocketByPhoneUid(uid){
	uid = phone2pcMap[uid];
	return pcUserSockets[uid];
}
function getPhoneSocketByPcUid(uid){
	uid = pc2phoneMap[uid];
	return phoneUserSockets[uid];
}