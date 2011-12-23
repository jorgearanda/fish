var ocean = require('http').createServer(handler)
  , io = require('socket.io').listen(ocean)
  , fs = require('fs')

ocean.listen(80);

function handler (req, res) {
  fs.readFile(__dirname + '/main.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading main.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var players = 0;

io.sockets.on('connection', function (socket) {
	players = ++players;
	myNumber = players;
	gs = { player : myNumber, test : "passed" };
	
	socket.set('gamesettings', gs, function() {
		socket.emit('gamesettings', gs);
	
	});
});