var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/public', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/pebble', function (req, res) {
	var data = {
		x: req.query.x,
		y: req.query.y,
		z: req.query.z
	};
	console.log(data);
	res.end();
	io.emit('get data', data);
});

io.on('connection', function (socket) {
	console.log('a connetion');
});

http.listen(3000, function () {
	console.log('listening');
});
