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
	this.fishCaught = 0;
	this.money = 100;
	this.status = 'At port';
}

function humanAgent (name) {
	this.name = name;
	this.greediness = null;
	this.fishCaught = 0;
	this.money = 100;
	this.status = 'At port';
}

var agents = new Array();
var gs = { expectedPlayers : 4,
           expectedHumans : 2,
           actualPlayers : 0,
           actualHumans : 0,
           mode : 'standby',
           totalSeasons : 4,
           currentSeason : 0,
           seasonDuration : 60,
           certainFish : 10,
           mysteryFish : 0,
           actualMysteryFish : 0,
           costDepart : 10,
           costCast : 2,
           costAtSea : 1,
           valueFish : 5,
           players : agents,
           status : 'waiting' };


for (i = 0; i < gs.expectedPlayers - gs.expectedHumans; i++) {
	agents[i] = new aiAgent('Robot ' + i);
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
		gs.status = 'running';
		gs.currentSeason = 1;
		io.sockets.emit('gamesettings', gs);
		io.sockets.emit('begin', 'All agents connected!');
	}
	
	socket.on('toSea', function (data) {
		console.log("A player sailed to sea: " + data.id);
		gs.players[data.id].status = 'At sea';
		gs.players[data.id].money -= gs.costDepart;
		io.sockets.emit('gamesettings', gs);
	});
});