var fs = require("fs");
var engineCalled = false;

function engine(io) {
	var games = new Array();
	var group;
	
	var players = 0;
	var expectedPlayers = 4;
	var aiPlayers = 2;
	var startingFish = 40;
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
		this.actualCasts = 0;
	}
	
	function gameParameters () {
		this.expectedPlayers = 4;
		this.expectedHumans = 2;
		this.actualPlayers = 0;
		this.actualHumans = 0;
		this.mode = "standby";
		this.totalSeasons = 4;
		this.currentSeason = 0;
		this.seasonDuration = 0;
		this.pauseDuration = 10;
		this.certainFish = 40;
		this.mysteryFish = 0;
		this.actualMysteryFish = 0;
		this.costDepart = 10;
		this.costCast = 2;
		this.costAtSea = 1;
		this.valueFish = 5;
		this.chanceOfCatch = 1.00;
		this.spawnFactor = 4.00;
		this.players = new Array();
		this.status = "waiting";
		
		for (i = 0; i < this.expectedPlayers - this.expectedHumans; i++) {
			this.players[i] = new aiAgent('Robot ' + i);
			this.actualPlayers++;
		}
	}

	var beginTimer = false;
	io.sockets.on('connection', function (socket) {
		var myID;
		socket.on('join group', function (group) {
			socket.set('group', group, function() {
				socket.emit("myGroup", group);
			});
			socket.join(group);
			
			if (group in games) {
				console.log("Group " + group + " already exists; user joined.");
			} else {
				games[group] = new gameParameters();
				console.log("New group added, and parameters created: " +group);
			}
			io.sockets.in(group).emit("join", "A player joined this group.");
			
			games[group].players[games[group].actualPlayers] = new humanAgent(games[group].actualPlayers);
			myID = games[group].actualPlayers++;
			games[group].actualHumans++;
			io.sockets.in(group).emit("gamesettings", games[group]);

		socket.set('gamesettings', games[group], function() {
			socket.emit('gamesettings', games[group]);
		});
	
		socket.set('myID', myID, function() {
			socket.emit('myID', myID);
		});
	
		//socket.set('agents', players, function() {
		//	socket.emit('agents', games[group].players);
		//});
	
		if (games[group].actualPlayers == games[group].expectedPlayers) {
			games[group].status = 'running';
			games[group].currentSeason = 1;
			io.sockets.in(group).emit('gamesettings', games[group]);
			io.sockets.in(group).emit('begin', 'All agents connected!');
		}
		
		socket.on('toSea', function (data) {
			console.log("A player sailed to sea: " + data.id);
			games[group].players[data.id].status = 'At sea';
			games[group].players[data.id].money -= games[group].costDepart;
			io.sockets.in(group).emit('gamesettings', games[group]);
		});

		socket.on('toPort', function (data) {
			console.log("A player returned to port: " + data.id);
			games[group].players[data.id].status = 'At port';
			io.sockets.in(group).emit('gamesettings', games[group]);
		});

		socket.on('fishing', function (data) {
			console.log("A player tried to fish: " + data.id);
			games[group].players[data.id].money -= games[group].costCast;
			games[group].players[data.id].actualCasts++;
			if (games[group].certainFish + games[group].actualMysteryFish > 0) {
				games[group].players[data.id].money += games[group].valueFish;
				games[group].players[data.id].fishCaught++;
				// Right now we're only removing actual fish, not mystery fish...
				games[group].certainFish -= 1;
			}
			io.sockets.in(group).emit('gamesettings', games[group]);
		});
	
		// Begin timekeeping
		if (beginTimer == false) {
			beginTimer = true;
			timer();
		}
		
		function timeStep() {
		if (games[group].actualPlayers == games[group].expectedPlayers) {
			if (games[group].status == 'running') {
				secondsSinceStart += 1;
				if (games[group].seasonDuration <= secondsSinceStart) {
					games[group].status = 'paused';
					secondsSinceStart = 0;
					for (i = 0; i < games[group].players.length; i++) {
						games[group].players[i].status = 'At port';
						games[group].players[i].actualCasts = 0;
					}
					if (games[group].currentSeason < games[group].totalSeasons) {
						console.log('Season ended, beginning pause period.');
						io.sockets.in(group).emit('gamesettings', games[group]);
						io.sockets.in(group).emit('endseason', games[group].currentSeason);
					} else {
						games[group].status = 'over';
						console.log('Simulation ended.');
						io.sockets.in(group).emit('gamesettings', games[group]);
						io.sockets.in(group).emit('gameover', 'gameover');
						endTimer = true;
					}
				} else {
					console.log('Seconds since start of season: ' + secondsSinceStart);
					io.sockets.in(group).emit('time', secondsSinceStart);
					for (i = 0; i < games[group].players.length; i++) {
						if (games[group].players[i].type == 'ai') {
							aiActions(i, gs, group);
						}
						if (games[group].players[i].status == 'At sea') {
							games[group].players[i].money -= games[group].costAtSea;
						}
					}
					io.sockets.in(group).emit('gamesettings', games[group]);
				}
			} else {
				secondsSinceStart += 1;
				if (games[group].pauseDuration <= secondsSinceStart) {
					games[group].certainFish *= games[group].spawnFactor;
					games[group].actualMysteryFish *= games[group].spawnFactor;
					games[group].status = 'running';
					secondsSinceStart = 0;
					games[group].currentSeason += 1;
					console.log('Beginning new season.');
					io.sockets.in(group).emit('begin', 'New season');
				} else {
					console.log('Seconds since pausing: ' + secondsSinceStart);
					io.sockets.in(group).emit('pausetime', secondsSinceStart);
				}
			}
		} else {
			console.log('Waiting for players.');
		}
		
		}

	function aiActions(ag) {
		if ((games[group].players[ag].intendedCasts > games[group].players[ag].actualCasts) && 	(games[group].players[ag].status == 'At port') &&
		(games[group].certainFish + games[group].actualMysteryFish > 0)) {
			console.log("A player sailed to sea: " + ag);
			games[group].players[ag].status = 'At sea';
			games[group].players[ag].money -= games[group].costDepart;
		} else if ((games[group].players[ag].intendedCasts > games[group].players[ag].actualCasts) && 	(games[group].players[ag].status == 'At sea') &&
		(games[group].certainFish + games[group].actualMysteryFish > 0)) {
			console.log("A player tried to fish: " + ag);
			games[group].players[ag].money -= games[group].costCast;
			games[group].players[ag].money += games[group].valueFish;
			games[group].players[ag].actualCasts ++;
			games[group].certainFish -= 1;
			games[group].players[ag].fishCaught++;
		} else if (((games[group].players[ag].intendedCasts <= games[group].players[ag].actualCasts) || (games[group].certainFish + games[group].actualMysteryFish <= 0)) && games[group].players[ag].status == 'At sea') {
			games[group].players[ag].status = 'At port';
		}
		io.sockets.in(group).emit('gamesettings', games[group]);
	}
		
		});

	});

	var secondsSinceStart = 0;
	var t;
	var endTimer = false;

	function timer() {
		if (!endTimer) {
			timeStep();
			t = setTimeout(timer, 1000);
		} else {
			console.log('Over and out.');
			beginTimer = false;
		}
	}


}


function fish(response, io) {
	console.log("Request handler 'fish' was called.");
	fs.readFile(__dirname + '/main.html',
	function (err, data) {
		if (err) {
			response.writeHead(500);
			return response.end('Error loading main.html');
		}
    	response.writeHead(200);
    	response.end(data);
  	});
  	
  	if (engineCalled == false) {
  		engineCalled = true;
  		engine(io);
  	}
}

function mainadmin(response, io) {
  console.log("Request handler 'mainadmin' was called.");
  fs.readFile(__dirname + '/mainadmin.html',
  function (err, data) {
    if (err) {
      response.writeHead(500);
      return response.end('Error loading mainadmin.html');
    }
    response.writeHead(200);
    response.end(data);
  });
}

exports.fish = fish;
exports.mainadmin = mainadmin;

