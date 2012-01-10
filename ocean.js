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
var expectedPlayers = 4;
var aiPlayers = 3;

function aiAgent (name) {
	this.name = name;
	this.greediness = 0.5;
}

function humanAgent (name) {
	this.name = name;
	this.greediness = null;
}

var gs = { expectedPlayers : 4,
           expectedHumans : 1,
           actualPlayers : 0,
           actualHumans : 0 };

var agents = new Array();

for (i = 0; i < gs.expectedPlayers - gs.expectedHumans; i++) {
	agents[i] = new aiAgent(i);
	gs.actualPlayers++;
}

io.sockets.on('connection', function (socket) {
	agents[gs.actualPlayers] = new humanAgent(gs.actualPlayers);
	var myID = gs.actualPlayers++;
	gs.actualHumans++;
	
	socket.set('gamesettings', gs, function() {
		socket.emit('gamesettings', gs);
	});
	
	socket.set('myID', myID, function() {
		socket.emit('myID', myID);
	});
	
	socket.set('agents', agents, function() {
		socket.emit('agents', agents);
	});
	
	if (gs.actualPlayers == gs.expectedPlayers) {
		io.sockets.emit('news', 'All agents connected!');
	}
});