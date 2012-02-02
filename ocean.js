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

	var t;
	var beginTimer = false;
	var endTimer = false;

	function timer() {
		if (!endTimer) {
			for (game in games) {
				if (games[game].timable == true) {
					timeStep(game);
				}
			}
			t = setTimeout(timer, 1000);
		} else {
			console.log('Finishing timer---we are done.');
			beginTimer = false;
			endTimer = true;
		}
	}

	function timeStep(gameName) {
		g = games[gameName];
		if (g.actualPlayers == g.expectedPlayers) {
			if (g.status == 'running') {
				g.currentSeconds += 1;
				if (g.seasonDuration <= g.currentSeconds) {
					g.status = 'paused';
					g.currentSeconds = 0;
					for (i = 0; i < g.players.length; i++) {
						g.players[i].status = 'At port';
						g.players[i].actualCasts = 0;
					}
					if (g.currentSeason < g.totalSeasons) {
						console.log('Season ended on gameroom ' + gameName + ', beginning pause period.');
						io.sockets.in(gameName).emit('gamesettings', g);
						io.sockets.in(gameName).emit('endseason', g.currentSeason);
					} else {
						g.status = 'over';
						console.log('Simulation ended for gameroom ' + gameName);
						io.sockets.in(gameName).emit('gamesettings', g);
						io.sockets.in(gameName).emit('gameover', 'gameover');
						g.timable = false;
					}
				} else {
					console.log('Seconds in season for gameroom ' + gameName + ': ' + g.currentSeconds);
					io.sockets.in(gameName).emit('time', g.currentSeconds);
					for (i = 0; i < g.players.length; i++) {
						if (g.players[i].type == 'ai') {
							aiActions(g, gameName, i);
						}
						if (g.players[i].status == 'At sea') {
							g.players[i].money -= g.costAtSea;
						}
					}
					io.sockets.in(gameName).emit('gamesettings', g);
				}
			} else {
				g.currentSeconds += 1;
				if (g.pauseDuration <= g.currentSeconds) {
					g.certainFish *= g.spawnFactor;
					g.actualMysteryFish *= g.spawnFactor;
					g.status = 'running';
					g.currentSeconds = 0;
					g.currentSeason += 1;
					console.log('Beginning new season in gameroom ' + gameName);
					io.sockets.in(gameName).emit('begin', 'New season');
				} else {
					console.log('Seconds since pausing gameroom ' + gameName + ': ' + g.currentSeconds);
					io.sockets.in(gameName).emit('pausetime', g.currentSeconds);
				}
			}
		} else {
			console.log('Waiting for players in gameroom ' + gameName);
		}
	}

	function aiActions(g, gameName, agentID) {
		agent = g.players[agentID];
		if ((agent.intendedCasts > agent.actualCasts) && 	(agent.status == 'At port') && (g.certainFish + g.actualMysteryFish > 0)) {
			console.log("A player sailed to sea: " + agent.name + ", gameroom " + gameName + ".");
			agent.status = 'At sea';
			agent.money -= g.costDepart;
		} else if ((agent.intendedCasts > agent.actualCasts) && 	(agent.status == 'At sea') && (g.certainFish + g.actualMysteryFish > 0)) {
			console.log("A player tried to fish: " + agent.name + ", gameroom " + gameName + ".");
			agent.money -= g.costCast;
			agent.money += g.valueFish;
			agent.actualCasts ++;
			g.certainFish -= 1;
			agent.fishCaught++;
		} else if (((agent.intendedCasts <= agent.actualCasts) || (g.certainFish + g.actualMysteryFish <= 0)) && agent.status == 'At sea') {
			agent.status = 'At port';
		}
		io.sockets.in(gameName).emit('gamesettings', g);
	}
		
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
		this.timable = true;
		this.totalSeasons = 4;
		this.currentSeason = 0;
		this.seasonDuration = 10;
		this.pauseDuration = 5;
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
		this.currentSeconds = 0;
		
		for (i = 0; i < this.expectedPlayers - this.expectedHumans; i++) {
			this.players[i] = new aiAgent('Robot ' + i);
			this.actualPlayers++;
		}
	}

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
	
			if (games[group].actualPlayers == games[group].expectedPlayers) {
				games[group].status = 'running';
				games[group].currentSeason = 1;
				io.sockets.in(group).emit('gamesettings', games[group]);
				io.sockets.in(group).emit('begin', 'All agents connected!');
			}
		
			socket.on('toSea', function (data) {
				console.log("A player sailed to sea: " + data.id + ", gameroom " + group + ".");
				games[group].players[data.id].status = 'At sea';
				games[group].players[data.id].money -= games[group].costDepart;
				io.sockets.in(group).emit('gamesettings', games[group]);
			});

			socket.on('toPort', function (data) {
				console.log("A player returned to port: " + data.id + ", gameroom " + group + ".");
				games[group].players[data.id].status = 'At port';
				io.sockets.in(group).emit('gamesettings', games[group]);
			});

			socket.on('fishing', function (data) {
				console.log("A player tried to fish: " + data.id + ", gameroom " + group + ".");
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
		});
	});
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

