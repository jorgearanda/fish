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
var startingFish = 10;
var chanceOfCatch = 1.0;
var spawnFactor = 4.0;

function aiAgent (name) {
	this.name = name;
	this.type = 'ai';
	this.greediness = 0.5;
	this.fishCaught = 0;
	this.money = 100;
	this.status = 'At port';
	this.intendedCasts = Math.round(((startingFish - (startingFish / spawnFactor)) / expectedPlayers) * 2 * this.greediness / chanceOfCatch);
	this.actualCasts = 0;
}

function humanAgent (name) {
	this.name = name;
	this.type = 'human';
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
           chanceOfCatch : 1.00,
           spawnFactor : 4.0,
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

	socket.on('fishing', function (data) {
		console.log("A player tried to fish: " + data.id);
		gs.players[data.id].money -= gs.costCast;
		if (gs.certainFish + gs.actualMysteryFish > 0) {
			gs.players[data.id].money += gs.valueFish;
			// Right now we're only removing actual fish, not mystery fish...
			gs.certainFish -= 1;
		}
		io.sockets.emit('gamesettings', gs);
	});

	// Begin timekeeping
	timer();
});

var secondsSinceStart = 0;
var t;
function timer() {
	if (gs.actualPlayers == gs.expectedPlayers) {
		secondsSinceStart += 1;
		console.log('Seconds since start of season: ' + secondsSinceStart);
		io.sockets.emit('time', secondsSinceStart);
		
		for (i = 0; i < gs.players.length; i++) {
			if (gs.players[i].type == 'ai') {
				aiActions(i);
			}
		}
	} else {
		console.log('Waiting for players.');
	}
	t = setTimeout(timer, 1000);
}

function aiActions(ag) {
	if ((gs.players[ag].intendedCasts > gs.players[ag].actualCasts) && 	(gs.players[ag].status == 'At port') &&
	(gs.certainFish + gs.actualMysteryFish > 0)) {
		console.log("A player sailed to sea: " + ag);
		gs.players[ag].status = 'At sea';
		gs.players[ag].money -= gs.costDepart;
	} else if ((gs.players[ag].intendedCasts > gs.players[ag].actualCasts) && 	(gs.players[ag].status == 'At sea') &&
	(gs.certainFish + gs.actualMysteryFish > 0)) {
		console.log("A player tried to fish: " + ag);
		gs.players[ag].money -= gs.costCast;
		gs.players[ag].money += gs.valueFish;
		gs.players[ag].actualCasts ++;
		gs.certainFish -= 1;
	} else if (((gs.players[ag].intendedCasts <= gs.players[ag].actualCasts) || (gs.certainFish + gs.actualMysteryFish <= 0)) && gs.players[ag].status == 'At sea') {
		gs.players[ag].status = 'At port';
	}
	io.sockets.emit('gamesettings', gs);
}
