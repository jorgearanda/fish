var fs = require("fs");
var engineCalled = false;
var runningSims = "--none currently--";
var _ = require("underscore");
_.str = require("underscore.string");

process.on('uncaughtException', function(err) {
    console.log(err);
});

function engine(io) {
    // The object "settings" holds the ocean settings for each simulation. It is used to regenerate the oceans object.
    var settings = loadSettings();

    // Every ocean has a log in this object with the same index
    var logs = new Object();

    // The "oceanGroups" object holds all active simulation groups. Every oceanGroup has at least one ocean.
    // Every ocean has a single corresponding oceanGroup entry.
    var oceanGroups = new Object();
    loadOceanGroups();

    // The object "oceans" holds all active simulations. If one simulation group has more than one ocean, then
    // there is one entry for each ocean in this array.
    // Oceans are indexed by their name.
    var oceans = new Object();
    loadOceans();

    var timestamper = new Date();
    var t;  // timer function variable
    var timerIsRunning = false;
    var keepTimerGoing = true;

    // Every FISH experimenter on record will have an object here
    var users = new Object();
    loadUsers();

    function timer() {
        // This function looks for "timable" simulations (those currently having action of any kind),
        // and sends them to timeStep every second.
        // When there are no more simulations to timestep, it wraps its own cycle up.
        if (keepTimerGoing) {
            keepTimerGoing = false;
            for (oceanName in oceans) {
                if (oceans[oceanName].timable == true) {
                    keepTimerGoing = true;
                    try {
                        oceans[oceanName].timeStep();
                    } catch (err) {
                        console.log("Exception processing ocean " + oceanName + ":");
                        console.log(err.message);
                        console.log("Taking " + oceanName + " out of the timable set of oceans.");
                        oceans[oceanName].timable == false;
                    }
                }
            }
            t = setTimeout(timer, 1000);
        } else {
            console.log('Finishing timer---we are done.');
            timerIsRunning = false;
        }
    }


    function Agent (name, type, greed) {
        this.name = name;
        this.type = type;
        this.greediness = greed;
        this.fishCaught = 0;
        this.fishCaughtPerSeason = new Array();
        this.startMoney = 0;
        this.money = 0;
        this.startMoneyPerSeason = new Array();
        this.endMoneyPerSeason = new Array();
        this.greedPerSeason = new Array();
        this.status = "At port";
        this.intendedCasts = null;
        this.actualCasts = 0;
        this.ready = false;
        this.hasLeftAndReturned = false;
        if (this.type == "ai") {
            this.ready = true;
        }

        this.isBot = function() {
            return (this.type == "ai");
        };

        this.calculateSeasonGreed = function (overallGreed, greedUniformity, currentSeason, totalSeasons, erratic) {
            // greedSpread determines how far the low and high greed bounds will deviate from the mean.
            // Perhaps it should be a simulation parameter eventually.
            var greedSpread = 2.0;
            var currentGreed = overallGreed;
            var lowBound = overallGreed;
            var highBound = overallGreed;
            var increment = 0.0;
            if (overallGreed < 0.5) {
                lowBound = overallGreed / greedSpread;
                highBound = overallGreed + lowBound;
            } else {
                highBound = ((1.0 - overallGreed) / greedSpread) + overallGreed;
                lowBound = greedSpread * overallGreed - highBound;
            }

            increment = (highBound - lowBound) /  (1.0 * (totalSeasons - 1));
            if (totalSeasons > 1) {
                if (greedUniformity == -1) {
                    currentGreed = highBound - (increment * (currentSeason - 1));
                } else if (greedUniformity == 1) {
                    currentGreed = lowBound + (increment * (currentSeason - 1));
                }
            }

            if (erratic) {
                var variation = 1.0 + ((Math.random() - 0.5) / 2.0);
                currentGreed = currentGreed * variation;
            }
            return currentGreed;
        };

        this.calculateSeasonCasts = function (currentGreed, expectedPlayers, startingFish, actualMysteryFish, spawnFactor, chanceOfCatch) {
            return Math.round(((startingFish + actualMysteryFish - ((startingFish + actualMysteryFish) / spawnFactor)) / expectedPlayers) * 2 * currentGreed / chanceOfCatch);;
        };

        this.prepareAgent = function (ocean) {
            // This method does bookkeeping for all agents for the new season. It also calculates the greed and intended casts of bots.
            if (this.type == "ai") {
                this.greedPerSeason[ocean.currentSeason] =
                    this.calculateSeasonGreed(this.greediness, ocean.greedUniformity, ocean.currentSeason, ocean.totalSeasons, ocean.erratic);
                this.intendedCasts =
                    this.calculateSeasonCasts(this.greedPerSeason[ocean.currentSeason], ocean.expectedPlayers, ocean.certainFish, ocean.actualMysteryFish, ocean.spawnFactor, ocean.chanceOfCatch);
            }
            this.actualCasts = 0;
            this.fishCaughtPerSeason[ocean.currentSeason] = 0;
            this.startMoneyPerSeason[ocean.currentSeason] = 0;
            this.endMoneyPerSeason[ocean.currentSeason] = 0;
            this.hasLeftAndReturned = false;
        };

        this.readRules = function () {
            this.ready = true;
        };

        this.goToPort = function(ocean) {
            this.status = "At port";
            this.hasLeftAndReturned = true;
            logs[ocean.name].addEvent("Fisher " + this.name + " returned to port.");
        };

        this.goToSea = function(ocean) {
            this.status = "At sea";
            this.money -= ocean.costDepart;
            this.endMoneyPerSeason[ocean.currentSeason] -= ocean.costDepart;
            logs[ocean.name].addEvent("Fisher " + this.name + " sailed to sea.");
        };

        this.tryToFish = function(ocean) {
            this.money -= ocean.costCast;
            this.endMoneyPerSeason[ocean.currentSeason] -= ocean.costCast;
            this.actualCasts++;

            if (ocean.isSuccessfulCastAttempt()) {
                logs[ocean.name].addEvent("Fisher " + this.name + " cast for a fish, and succeeded.");
                this.money += ocean.valueFish;
                this.fishCaught++;
                this.fishCaughtPerSeason[ocean.currentSeason]++;
                this.endMoneyPerSeason[ocean.currentSeason] += ocean.valueFish;
                ocean.takeOneFish();
            } else {
                logs[ocean.name].addEvent("Fisher " + this.name + " cast for a fish, and failed.");
            }
        };

        this.botActions = function(ocean) {
            // We assume the bot will take an action, except if it behaves erratically, in which case whether there's an action or not
            // depends on the hesitation parameter
            var doSomething = true;
            if (ocean.erratic) {
                doSomething = (Math.random() < ocean.hesitation);
            }

            if (doSomething) {
                if ((this.intendedCasts > this.actualCasts) && (this.status == 'At port') && (ocean.certainFish + ocean.actualMysteryFish > 0)) {
                    this.goToSea(ocean);
                } else if ((this.intendedCasts > this.actualCasts) && (this.status == 'At sea') && (ocean.certainFish + ocean.actualMysteryFish > 0)) {
                    // Try to fish!
                    for (castAttempts = 0; castAttempts < Math.min(ocean.castsPerSecond, this.intendedCasts - this.actualCasts); castAttempts++) {
                        if (Math.random() < ocean.castingProbability) {
                            this.tryToFish(ocean);
                        }
                    }
                } else if (((this.intendedCasts <= this.actualCasts) || (ocean.certainFish + ocean.actualMysteryFish <= 0)) && this.status == 'At sea') {
                    this.goToPort(ocean);
                }
            }
        }
    }

    function seasonData (number) {
        this.number = number;
        this.initialFish = 0;
        this.endFish = 0;
    }

    function fishSpot (minX, minY, maxX, maxY) {
        this.x = 10 * Math.floor(minX + Math.random() * (maxX - minX));
       if (this.x > 600) {
          console.log(this.x + ' because ' + minX + ' and ' + maxX);
       }
        this.y = 10 * Math.floor(minY + Math.random() * (maxY - minY));
    }

    function Ocean (gs, oceanName, oceanGroup, owner) {
        this.name = oceanName;
        this.oceanGroup = oceanGroup;
        this.owner = owner;
        this.players = new Array();
        this.seasonsData = new Array();
        this.actualPlayers = 0;
        this.actualHumans = 0;
        this.timable = true;
        this.currentSeason = 0;
        this.status = "waiting";
        this.currentSeconds = 0;
        this.debug = true;
        this.unpauseState = "";
        this.pausedBy = null;
        this.depleted = false;
        this.timeSinceEveryoneReturned = 0;

        // Parameters from gameSettings object
        this.numOceans = gs.numOceans;
        this.expectedPlayers = gs.numFishers;
        this.expectedHumans = gs.numHumans;
        this.totalSeasons = gs.numSeasons;
        this.seasonDuration = gs.seasonDuration;
        this.initialDelay = gs.initialDelay;
        this.restDuration = gs.restDuration;
        this.spawnFactor = gs.spawnFactor;
        this.chanceOfCatch = gs.chanceOfCatch;
        this.costDepart = gs.costDepart;
        this.costAtSea = gs.costAtSea;
        this.costCast = gs.costCast;
        this.valueFish = gs.valueFish;
        this.currencySymbol = gs.currencySymbol;
        this.startingFish = gs.certainFish;
        this.certainFish = gs.certainFish;
        this.maximumFish = gs.maximumFish ? gs.maximumFish : gs.certainFish;
        this.mysteryFish = gs.mysteryFish;
        this.startingMysteryFish = gs.actualMysteryFish;
        this.actualMysteryFish = gs.actualMysteryFish;
        this.showOtherFishers = gs.showOtherFishers;
        this.showFisherNames = gs.showFisherNames;
        this.showFisherStatus = gs.showFisherStatus;
        this.showFishCaught = gs.showFishCaught;
        this.showBalance = gs.showBalance;
        this.pauseEnabled = gs.pauseEnabled;
        this.earlyEndEnabled = gs.earlyEndEnabled;
        this.greedUniformity = gs.greedUniformity;
        this.erratic = gs.erratic;
        this.hesitation = gs.hesitation;
        this.castsPerSecond = gs.castsPerSecond;
        this.castingProbability = gs.castingProbability;
        this.prepText = gs.prepText;
        this.depletedText = gs.depletedText;
        this.endText = gs.endText;
        for (i = 0; i < this.expectedPlayers - this.expectedHumans; i++) {
            this.players[i] = new Agent(gs.robots[i].name, "ai", gs.robots[i].greed);
            this.actualPlayers++;
        }
        for (i = 0; i <= this.totalSeasons; i++) {
            this.seasonsData[i] = new seasonData(i);
        }

        this.fishSpots = new Array();
        for (i = 1; i <= this.certainFish + this.mysteryFish; i++) {
            this.fishSpots[i] = new fishSpot(1, 1, 65, 40);
        }

        // Object methods
        this.sendGameSettings = function () {
            io.sockets.in(this.name).emit('gamesettings', this);
        };

        this.allPlayersLoaded = function () {
            return (this.actualPlayers == this.expectedPlayers);
        };

        this.isNotOver = function () {
            return (this.status != "over");
        };

        this.isWaiting = function () {
            return (this.status == "waiting");
        };

        this.isReadying = function () {
            return (this.status == "readying");
        };

        this.isRunning = function () {
            return (this.status == "running");
        };

        this.isResting = function () {
            return (this.status == "resting");
        };

        this.isPaused = function () {
            return (this.status == "paused");
        };

        this.tick = function () {
            this.currentSeconds += 1;
        };

        this.resetTimer = function () {
            this.currentSeconds = 0;
        };

        this.hasReachedInitialDelay = function () {
            return (this.currentSeconds > this.initialDelay);
        };

        this.hasReachedInterseasonDelay = function () {
            return (this.currentSeconds > this.restDuration);
        };

        this.hasReachedSeasonDuration = function () {
            return (this.currentSeconds > this.seasonDuration) ||
                (this.earlyEndEnabled && this.timeSinceEveryoneReturned >= 3);
        };

        this.hasRoom = function () {
            return (this.actualHumans < this.expectedHumans);
        };

        this.isEveryoneReady = function () {
            var allReady = true;
            if (this.actualPlayers != this.expectedPlayers) {
                allReady = false;
            }
            for (player in this.players) {
                if (!this.players[player].ready) {
                    allReady = false;
                }
            }
            return allReady;
        };

        this.hasEveryoneLeftAndReturned = function () {
            var everyoneReturned = true;
            for (player in this.players) {
                if (!this.players[player].hasLeftAndReturned) {
                    everyoneReturned = false;
                }
            }
            return everyoneReturned;
        }

        this.getOceanReady = function () {
            // We assume this.isEveryoneReady returned true
            this.status = "readying";
            io.sockets.in(this.name).emit("readying", this);
            logs[this.name].addEvent("All fishers now ready to start.");
        };

        this.startNextSeason = function () {
            this.currentSeason += 1;
            logs[this.name].addEvent("Beginning season " + this.currentSeason + ".");
            this.resetTimer();
            this.status = "running";
            this.timeSinceEveryoneReturned = 0;

            if (this.currentSeason > 1) {
                this.certainFish = Math.round(Math.min(this.certainFish * this.spawnFactor, this.maximumFish ? this.maximumFish : this.startingFish));
                this.actualMysteryFish = Math.round(Math.min(this.actualMysteryFish * this.spawnFactor, this.startingMysteryFish));
            }
            this.seasonsData[this.currentSeason].initialFish = this.certainFish + this.actualMysteryFish;

            // Repeating this, which is not good.
            this.fishSpots = new Array();
            for (i = 1; i <= this.certainFish + this.mysteryFish; i++) {
                this.fishSpots[i] = new fishSpot(1, 1, 65, 40);
            }

            for (player in this.players) {
                this.players[player].prepareAgent(this);
            }
            io.sockets.in(this.name).emit("begin", this);
        };

        this.endCurrentSeason = function () {
            // Bring all players to port; reset their casting tally
            for (player in this.players) {
                this.players[player].goToPort(this);
            }
            this.seasonsData[this.currentSeason].endFish = this.certainFish + this.actualMysteryFish;
            if (this.currentSeason < this.totalSeasons) {
                this.status = "resting";
                this.resetTimer();
                logs[this.name].addEvent("Ending season " + this.currentSeason + ".");
                io.sockets.in(this.name).emit("endseason", this);
            } else {
                this.endSimulation();
            }
        };

        this.resolveSeasonActions = function () {
            // For all bots, prompt them to action
            for (player in this.players) {
                // May be able to send this to agent object -----------------------
                if (this.players[player].isBot()) {
                    this.players[player].botActions(this)
                }
                // Charge players that are at sea
                if (this.players[player].status == "At sea") {
                    this.players[player].money -= this.costAtSea;
                    this.players[player].endMoneyPerSeason[this.currentSeason] -= this.costAtSea;
                }
            }
            this.sendGameSettings();
        };

        this.checkForDepletion = function () {
            if (this.certainFish + this.actualMysteryFish <= 0) {
                this.depleted = true;
                this.endSimulation();
            }
        };

        this.endSimulation = function () {
            // Wrap it up for this simulation
            this.timable = false;
            this.status = "over";
            logs[this.name].addEvent("Simulation ended.");
            io.sockets.in(this.name).emit('gameover', this);
            delete settings[this.name];
            oceanGroups[this.oceanGroup].remainingOceans -= 1;

            // Create the log file for this ocean run.
            logs[this.name].writeReport();

            // Check if oceanGroup needs to be taken down.
            if (oceanGroups[this.oceanGroup].allOver()) {
                delete oceanGroups[this.oceanGroup];
            }
            saveCurrentOceans();
        };

        this.isSuccessfulCastAttempt = function () {
            return ((this.certainFish + this.actualMysteryFish > 0) && Math.random() <= this.chanceOfCatch);
        };

        this.takeOneFish = function () {
            if (Math.floor(Math.random() * (this.certainFish + this.actualMysteryFish)) < this.certainFish) {
                this.certainFish -= 1;
            } else {
                this.actualMysteryFish -= 1;
            }
            this.checkForDepletion();
        };

        this.pause = function (pauseRequester) {
            if (this.isRunning() || this.isResting()) {
                this.unpauseState = this.status;
                this.status = "paused";
                this.pausedBy = pauseRequester;
                logs[this.name].addEvent("Ocean paused by fisher " + this.players[pauseRequester].name + ".");
                io.sockets.in(this.name).emit("paused", {id: pauseRequester});
                io.sockets.in(this.name).emit('gamesettings', this);
            }
        };

        this.resume = function (resumeRequester) {
            if (this.isPaused() && this.pausedBy == resumeRequester) {
                this.status = this.unpauseState;
                io.sockets.in(this.name).emit("resumed", {id: resumeRequester});
                io.sockets.in(this.name).emit('gamesettings', this);
                logs[this.name].addEvent("Ocean resumed by fisher " + this.players[resumeRequester].name + ".");
            }
        };

        this.timeStep = function () {
            // Perform one tick of the clock for this simulation.
            // This entails moving the timer forward one second, checking if that pushes the simulation
            // into the next phase, and asking the bots to perform actions.
            if (this.allPlayersLoaded() && this.isNotOver()) {
                if (this.isReadying()) {
                    // The "readying" phase happens after everyone said they are ready, and before the simulation runs.
                    // Advance the clock for the object
                    this.tick();
                    if (this.hasReachedInitialDelay()) {
                        this.startNextSeason();
                    }
                } else if (this.isRunning()) {
                    this.tick();
                    if (this.hasReachedSeasonDuration()) {
                        this.endCurrentSeason(); // endCurrentSeason also ends the simulation if this is the last season.
                    } else {
                        this.resolveSeasonActions();
                        if (this.hasEveryoneLeftAndReturned()) {
                            this.timeSinceEveryoneReturned += 1;
                        }
                    }
                } else if (this.isResting()) {
                    this.tick();
                    if (this.hasReachedInterseasonDelay()) {
                        this.startNextSeason();
                    } else {
                        this.sendGameSettings();
                    }
                } else if (this.isWaiting() || this.isPaused()) {
                    // Do nothing (used to have a console.log message for both conditions)
                } else {
                    // Weird state
                    console.log(this.name + ": Unexpected simulation state: " + this.status);
                }
            }
        }
    }

    function Settings (oceanSettings, oceanID) {
        this.name = oceanID;
        this.settings = oceanSettings;
    }

    function OceanGroup (oceanGroupName, numOceans, remainingOceans, owner) {
        this.name = oceanGroupName;
        this.numOceans = numOceans;
        this.remainingOceans = remainingOceans;
        this.owner = owner;

        this.generateOceanID = function (idx) {
            return this.name + "-" + (1000 + idx).toString().substr(1);
        };

        this.allocateFisherToOcean = function() {
            // Warning: there's a race condition here; we check if there's room, and a bit later we assign the fisher
            // to the ocean. Given the expected usage of FISH this should not be an issue, and in fact there could
            // be other race conditions around. Still, something to fix eventually.
            var availableOcean = "";
            var oID;
            for (i = 1; i <= this.numOceans; i++) {
                oID = this.generateOceanID(i);
                if (oceans[oID] != null && oceans[oID].hasRoom()) {
                    availableOcean = oID;
                    break;
                }
            }
            return availableOcean; // returns the empty string if no ocean with space available was found
        };

        this.createOceans = function(oceanSettings, source) {
            if (oceanSettings != null) {
                var i;
                for (i = 1; i <= this.numOceans; i++) {
                    oceanID = this.generateOceanID(i);
                    oceans[oceanID] = new Ocean(oceanSettings, oceanID, this.name, this.owner);
                    logs[oceanID] = new OceanLog(oceanID, this.owner);
                    logs[oceanID].addEvent("Ocean created from the page " + source + ".");
                    settings[oceanID] = new Settings(oceanSettings, oceanID);
                }
            } else {
                console.log("The method createOceans was called without any parameters. Aborting.");
            }
        };

        this.createSingleOcean = function(oceanSettings, oceanID, source) {
            if (oceanSettings != null) {
                oceans[oceanID] = new Ocean(oceanSettings, oceanID, this.name, this.owner);
                logs[oceanID] = new OceanLog(oceanID, this.owner);
                logs[oceanID].addEvent("Ocean created from the page " + source + ".");
                settings[oceanID] = new Settings(oceanSettings, oceanID);
            } else {
                console.log("The method createOceans was called without any parameters. Aborting.");
            }
        };

        this.allOver = function() {
            var isAllOver = true;
            var oID;
            for (i = 1; i <= this.numOceans; i++) {
                oID = this.generateOceanID(i);
                if (oceans[oID] != null && oceans[oID].status != "over") {
                    isAllOver = false;
                }
            }
            return isAllOver;
        }
    }


    function OceanLog (oceanName, owner) {
        this.name = oceanName;
        this.events = "";
        this.owner = owner;

        this.addEvent = function (text) {
            var timeStampedText = new Date().toString() + ", " + this.name + ": " + text;
            console.log(timeStampedText);
            this.events += timeStampedText + "\n";
        };

        this.writeReport = function () {
            // r is the output string
            var g = oceans[this.name];
            var currentTime = new Date();
            var r = "";
            var p;
            r += "FISH simulation log\n";
            r += "-------------------\n\n";

            r += "Run name: " + this.name + "\n";
            r += "Date and time: " + currentTime.toString() + "\n\n";

            r += "Number of fishers: " + g.expectedPlayers + "\n";
            r += "Number of humans: " + g.expectedHumans + "\n";
            r += "Number of seasons: " + g.totalSeasons + "\n";
            r += "Season length (in seconds): " + g.seasonDuration + "\n";
            r += "Delay to begin simulation (in seconds): " + g.initialDelay + "\n";
            r += "Resting time between seasons (in seconds): " + g.restDuration + "\n";
            r += "Spawn factor: " + g.spawnFactor + "\n";
            r += "Chance of catch (0.00 to 1.00): " + g.chanceOfCatch + "\n";
            r += "Currency symbol: " + g.currencySymbol + "\n";
            r += "Cost to depart: " + g.currencySymbol + g.costDepart + "\n";
            r += "Cost per second at sea: " + g.currencySymbol + g.costAtSea + "\n";
            r += "Cost to cast for a fish: " + g.currencySymbol + g.costCast + "\n";
            r += "Value of fish caught: " + g.currencySymbol + g.valueFish + "\n";
            r += "Number of starting certain fish: " + g.startingFish + "\n";
            r += "Number of starting mystery fish: " + g.startingMysteryFish + "\n";
            r += "Number of ending certain fish: " + g.certainFish + "\n";
            r += "Number of ending mystery fish: " + g.actualMysteryFish + "\n";
            r += "Maxumum number of fish in ocean: " + g.maximumFish ? g.maximumFish : g.startingFish + "\n";
            r += "Showing other fishers' information?: " + (g.showOtherFishers ? "Yes" : "No") + "\n";
            r += "Showing other fishers' names?: " + (g.showFisherNames ? "Yes" : "No") + "\n";
            r += "Showing other fishers' status?: " + (g.showFisherStatus ? "Yes" : "No") + "\n";
            r += "Showing other fishers' number of fish caught?: " + (g.showFishCaught ? "Yes" : "No") + "\n";
            r += "Showing other fishers' money balance?: " + (g.showBalance ? "Yes" : "No") + "\n";
            r += "Pause enabled?: " + (g.pauseEnabled ? "Yes" : "No") + "\n";
            r += "Erratic behaviour enabled?: " + (g.erratic ? "Yes" : "No") + "\n";
            r += "Hesitation enabled?: " + (g.hesitation ? "Yes" : "No") + "\n";
            r += "Maximum bot casts per second: " + g.castsPerSecond + "\n";
            r += "Casting probability factor: " + g.castingProbability + "\n\n";

            r += "The following paragraphs were presented to participants as the preparation text:\n";
            r += "--------------------------------------------------------------------------------\n";
            r += g.prepText + "\n";
            r += "--------------------------------------------------------------------------------\n\n";

            r += "Measurements per fisher:\n\n";
            r += "    Fisher,  Type, Greed, Season, FishInit, FishTaken,     Profit,    IR,    GR,    IE,    GE\n";
            r += "---------------------------------------------------------------------------------------------\n";
            for (agent in g.players) {
                p = g.players[agent];
                for (j = 1; j <= g.totalSeasons; j++) {
                    r += _.str.pad(p.name, 10) + ", ";
                    r += ((p.type == "ai") ? "  bot" : "human") + ", ";
                    r += ((p.type == "ai" && p.greedPerSeason[j] != null) ? _.str.pad(p.greedPerSeason[j].toFixed(2), 5) : "  n/a") + ", ";
                    r += _.str.pad(j, 6) + ", ";
                    r += _.str.pad(g.seasonsData[j].initialFish, 8) + ", ";
                    r += _.str.pad(p.fishCaughtPerSeason[j], 9) + ", ";
                    r += _.str.pad(g.currencySymbol + (Math.round((p.endMoneyPerSeason[j] - p.startMoneyPerSeason[j]) * 100) / 100).toFixed(2), 10) + ", ";
                    r += _.str.pad(individualRestraint(g.seasonsData[j].initialFish, g.expectedPlayers, p.fishCaughtPerSeason[j]).toFixed(2), 5) + ", ";
                    r += _.str.pad(groupRestraint(g.seasonsData[j].initialFish, g.seasonsData[j].endFish).toFixed(2), 5) + ", ";
                    r += _.str.pad(individualEfficiency(g.startingFish + g.startingMysteryFish, g.seasonsData[j].initialFish, g.spawnFactor, g.expectedPlayers, p.fishCaughtPerSeason[j]).toFixed(2), 5) + ", ";
                    r += _.str.pad(groupEfficiency(g.startingFish + g.startingMysteryFish, g.seasonsData[j].initialFish, g.seasonsData[j].endFish, g.spawnFactor).toFixed(2), 5) + "\n";
                }
            }
            r += "\n";
            r += "---------------------------------------------------------------------------------------------\n\n";

            r += "Logged simulation events:\n\n";
            r += this.events;


            // We're assuming the user directory exists.
            var oceanName = this.name;
            var filename = "data/" + this.owner + "/" + oceanName + ".txt";
            fs.writeFile(filename, r, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log(oceanName + ": Simulation run logged under " + filename);
            });

        };
    }

    function User (id, name) {
        this.id = id;
        this.name = name;

        this.runningSimulationsList = function () {
            var sims = new Object();
            var oceanGroup;
            for (oceanGroup in oceanGroups) {
                if (oceanGroups[oceanGroup].owner == this.id) {
                    sims[oceanGroup] = new Object();
                    sims[oceanGroup].name = oceanGroups[oceanGroup].name;
                    sims[oceanGroup].numOceans = oceanGroups[oceanGroup].numOceans;
                    sims[oceanGroup].remainingOceans = oceanGroups[oceanGroup].remainingOceans;
                    sims[oceanGroup].owner = oceanGroups[oceanGroup].owner;
                }
            }
            return sims;
        };

        this.archivedSimulationsList = function () {
            var archivedSims = new Object();
            var userDir = "data/" + this.id + "/";
            try {
                files = fs.readdirSync(userDir);
                var file;
                for (file in files) {
                    archivedSims[files[file]] = new Object();
                    archivedSims[files[file]].name = files[file];
                }

            } catch (err) {
                console.log("Error reading simulations for user " + this.id);
                console.log(err.message);
            }
            return archivedSims;
        };
    }


    // The following contains all the functions to communicate with our various clients.
    io.sockets.on('connection', function (socket) {
        var oceanID = "";

        // Admins trying to log in (admin.html)
        socket.on("validate user", function (uid) {
            console.log("Core: Validating user " + uid);
            if (uid in users) {
                console.log("Core: User " + uid + " exists. Logging in.");
                socket.emit("user-valid");
            } else {
                console.log("Core: User " + uid + " does not exist.");
                socket.emit("user-not-valid");
            }
        });

        // Participants trying to log in (index.html)
        socket.on("validate group", function (gid) {
            console.log("Core: Validating group from participant input " + gid);
            if (gid in oceanGroups) {
                console.log("Core: Group " + gid + " exists. Logging participant in.");
                socket.emit("valid-group");
            } else {
                console.log("Core: Group" + gid + " does not exist.");
                socket.emit("invalid-group");
            }
        });

        // Mainadmin communication
        socket.on("get running simulations", function (uid) {
            socket.emit("running simulations list", users[uid].runningSimulationsList());
        });

        socket.on("get archived simulations", function (uid) {
            socket.emit("archived simulations list", users[uid].archivedSimulationsList());
        });

        // Creating a group from newgroup.html
        socket.on('create group', function (gs) {
            console.log("Core: Attempting to create oceanGroup " + gs.name);
            try {
                if (gs.name in oceanGroups) {
                    console.log("Core: Group " + gs.name + " already exists. No action taken.");
                    socket.emit("group-not-created");
                } else {
                    oceanGroups[gs.name] = new OceanGroup(gs.name, gs.numOceans, gs.numOceans, gs.owner);
                    console.log("Second");
                    oceanGroups[gs.name].createOceans(gs, "newgroup");
                    socket.emit("group-created");
                    saveCurrentOceans();
                }
            } catch (err) {
                console.log("Exception raised when attempting to create oceanGroup " + gs.name);
                console.log(err.message);
                socket.emit("group-not-created");
            }
        });

        // Responding to main.html
        var myID;
        socket.on('join group', function (group, pid) {
            if (!(group in oceanGroups)) {
                // Register group
                oceanGroups[group] = new OceanGroup(group, 1, 1, "na");
                oceanGroups[group].createOceans(null, "fish");
            }

            var myOceanGroup = oceanGroups[group];

            var allocatedOcean = myOceanGroup.allocateFisherToOcean();
            if (allocatedOcean != "") {
                var myOcean = oceans[allocatedOcean];
               var mySpot = myOcean.actualPlayers;

                socket.set("group", myOcean.name, function() {
                    socket.emit("myGroup", myOcean.name);
                });

                // Register client in the socket for the ocean it was assigned to
                socket.join(myOcean.name);

                // Create object for client
                myOcean.players[mySpot] = new Agent(pid, "human", null);
                logs[myOcean.name].addEvent("Fisher " + pid + " joined.");
                myID = myOcean.actualPlayers++;
                myOcean.actualHumans++;

                // Done with upkeep, broadcast new state
                myOcean.sendGameSettings();


                // Setting all the functions to communicate with the client
                socket.set('gamesettings', myOcean, function() {
                    socket.emit('gamesettings', myOcean);
                });

                socket.set('myID', myID, function() {
                    socket.emit('myID', myID);
                });

                socket.on('pauseRequest', function (data) {
                    myOcean.pause(data.id);
                });

                socket.on('resumeRequest', function (data) {
                    myOcean.resume(data.id);
                });

                socket.on('toSea', function (data) {
                    myOcean.players[data.id].goToSea(myOcean);
                    myOcean.sendGameSettings();
                });

                socket.on('toPort', function (data) {
                    myOcean.players[data.id].goToPort(myOcean);
                    myOcean.sendGameSettings();
                });

                socket.on('readRules', function(data) {
                    myOcean.players[data.id].readRules();
                    if (myOcean.isEveryoneReady()) {
                        myOcean.getOceanReady();
                    }
                });

                socket.on('fishing', function (data) {
                    myOcean.players[data.id].tryToFish(myOcean);
                    myOcean.sendGameSettings();
                });

               socket.on('disconnect', function () {
                  logs[myOcean.name].addEvent('Fisher ' + pid + ' disconnected.');
                  if (myOcean.status === 'waiting') {
                     logs[myOcean.name].addEvent('Freeing space from disconnected fisher.');
                     myOcean.actualPlayers--;
                     myOcean.actualHumans--;

                     // Shift players array
                     for (var i = mySpot; i < myOcean.players.length - 1; i++) {
                        myOcean.players[i] = myOcean.players[i + 1];
                     }
                     delete myOcean.players[myOcean.players.length - 1]
                  } else {
                     logs[myOcean.name].addEvent('Proceeding with simulation anyway.');
                  }
               });

                // Begin timekeeping
                if (timerIsRunning == false) {
                    timerIsRunning = true;
                    keepTimerGoing = true;
                    timer();
                }

                saveCurrentOceans();
            } else {
                // There were no oceanGroups with room in them.
                console.log(group + ": A user tried to join this group, but it was already full.");
                socket.emit("fullroom", group);
            }
        });
    });


    // The following functions calculate the metrics that most experiments will be concerned with.
    function individualRestraint(pool, numFishers, fishCaught) {
        return (pool - numFishers * fishCaught) / pool;
    }

    function groupRestraint(pool, endPool) {
        return endPool / pool;
    }

    function individualEfficiency(originalPool, startPool, spawnFactor, numFishers, fishCaught) {
        var ie;
        if (originalPool <= spawnFactor * startPool) {
            // Not endangered
            ie = (startPool - fishCaught * numFishers) * spawnFactor / originalPool;
        } else {
            // Endangered
            ie = (startPool - fishCaught * numFishers) / startPool;
        }
        return ie;
    }

    function groupEfficiency(originalPool, startPool, endPool, spawnFactor) {
        var ge;
        if (originalPool <= spawnFactor * startPool) {
            // Not endangered
            ge = endPool * spawnFactor / originalPool;
        } else {
            // Endangered - unclear if this is the proper interpretation
            ge = endPool / startPool;
        }
        return ge;
    }


    // User management
    function loadUsers() {
        fs.readFile("data/users.txt", encoding="utf8", function(err, data) {
            if (err) {
                throw err;
            }
            var userLines = data.split("\n");
            var userData;
            for (i in userLines) {
                userData = userLines[i].split(", ");
                if (userData.length > 1 ) {
                    users[userData[0]] = new User(userData[0], userData[1]);
                }
            }
        });
    }

    function loadOceanGroups() {
        var allSavedFiles = fs.readdirSync("saved");
        var firstGroupsFile = null;
        var lastGroupsFile = null;
        for (savedFile in allSavedFiles) {
            if (_.str.startsWith(allSavedFiles[savedFile], "groups")) {
                if (lastGroupsFile == null || lastGroupsFile < allSavedFiles[savedFile]) {
                    lastGroupsFile = allSavedFiles[savedFile];
                }
                if (firstGroupsFile == null || firstGroupsFile > allSavedFiles[savedFile]) {
                    firstGroupsFile = allSavedFiles[savedFile];
                }
            }
        }

        var groupsString = null;
        if (lastGroupsFile != null) {
            console.log("Loading groups from saved/" + lastGroupsFile);
            groupsString = fs.readFileSync("saved/" + lastGroupsFile, encoding="utf8");
        }

        var oceanGroupsDetails = null;
        if (groupsString != null) {
            oceanGroupsDetails = JSON.parse(groupsString);
            for (detail in oceanGroupsDetails) {
                console.log("Restoring ocean group " + oceanGroupsDetails[detail].name);
                oceanGroups[oceanGroupsDetails[detail].name] = new OceanGroup(
                    oceanGroupsDetails[detail].name,
                    oceanGroupsDetails[detail].numOceans,
                    oceanGroupsDetails[detail].remainingOceans,
                    oceanGroupsDetails[detail].owner);
            }
        }

        if (firstGroupsFile !== lastGroupsFile && allSavedFiles.length >= 12) {
           // Take out oldest log file
           fs.unlink('saved/' + firstGroupsFile);
        }
    }

    function loadSettings() {
        var allSavedFiles = fs.readdirSync("saved");
        var firstOceanFile = null;
        var lastOceanFile = null;
        for (savedFile in allSavedFiles) {
            if (_.str.startsWith(allSavedFiles[savedFile], "oceans")) {
                if (lastOceanFile == null || lastOceanFile < allSavedFiles[savedFile]) {
                    lastOceanFile = allSavedFiles[savedFile];
                }
                if (firstOceanFile == null || firstOceanFile > allSavedFiles[savedFile]) {
                   firstOceanFile = allSavedFiles[savedFile];
                }
            }
        }
        var oceansString = null;
        if (lastOceanFile != null) {
            console.log("Loading oceans from saved/" + lastOceanFile);
            oceansString = fs.readFileSync("saved/" + lastOceanFile, encoding="utf8");
        }

        if (firstOceanFile !== lastOceanFile && allSavedFiles.length >= 12) {
           // Take out oldest log file
           fs.unlink('saved/' + firstOceanFile);
        }

        return oceansString != null ? JSON.parse(oceansString) : new Object();
    }

    function loadOceans() {
        for (oceanID in settings) {
            oceanGroups[settings[oceanID].settings.name].createSingleOcean(settings[oceanID].settings, oceanID, "restart");
        }
    }

    function saveCurrentOceans() {
        var ts = new Date().getTime().toString();
        var filenameGroups = "saved/groups" + ts + ".txt"
        var filenameOceans = "saved/oceans" + ts + ".txt"

       var allSavedFiles = fs.readdirSync("saved");
       var firstGroupsFile = null;
       var firstOceansFile = null;
       for (var savedFile in allSavedFiles) {
          if (_.str.startsWith(allSavedFiles[savedFile], "groups")) {
             if (firstGroupsFile == null || firstGroupsFile > allSavedFiles[savedFile]) {
                firstGroupsFile = allSavedFiles[savedFile];
             }
          }
          if (_.str.startsWith(allSavedFiles[savedFile], "oceans")) {
             if (firstOceansFile == null || firstOceansFile > allSavedFiles[savedFile]) {
                firstOceansFile = allSavedFiles[savedFile];
             }
          }
       }

       if (firstOceansFile && firstGroupsFile && allSavedFiles.length >= 12) {
          // Take out oldest log files
          fs.unlink('saved/' + firstOceansFile);
          fs.unlink('saved/' + firstGroupsFile);
       }

       fs.writeFile(filenameGroups, JSON.stringify(oceanGroups), function (err) {
            if (err) {
                return console.log(err);
            }
        });
        fs.writeFile(filenameOceans, JSON.stringify(settings), function (err) {
            if (err) {
                return console.log(err);
            }
        });
        console.log("Current simulation settings logged under " + filenameGroups +
            " and " + filenameOceans + ".");
    }
} // engine


// -----------------------------------------------------------------------------------------------
// From here on it's just boilerplate to deal with calls to different files, pages, and functions.
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
        }
    );

    if (engineCalled == false) {
        engineCalled = true;
        engine(io);
    }
}

function welcome(response, io) {
    console.log("Request handler 'welcome' was called.");
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                response.writeHead(500);
                return response.end('Error loading index.html');
            }
            response.writeHead(200);
            response.end(data);
        }
    );

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
        }
    );

    if (engineCalled == false) {
        engineCalled = true;
        engine(io);
    }
}

function newgroup(response, io) {
    console.log("Request handler 'newgroup' was called.");
    fs.readFile(__dirname + '/newgroup.html',
        function (err, data) {
            if (err) {
                response.writeHead(500);
                return response.end('Error loading newgroup.html');
            }
            response.writeHead(200);
            response.end(data);
        }
    );

    if (engineCalled == false) {
        engineCalled = true;
        engine(io);
    }
}

function admin(response, io) {
    console.log("Request handler 'admin' was called.");
    fs.readFile(__dirname + '/admin.html',
        function (err, data) {
            if (err) {
                response.writeHead(500);
                return response.end('Error loading admin.html');
            }
            response.writeHead(200);
            response.end(data);
        }
    );

    if (engineCalled == false) {
        engineCalled = true;
        engine(io);
    }
}

function certainfish(response, io) {
    console.log("Request handler 'certainfish' was called.");
    fs.readFile(__dirname + '/certain-fish.png',
        function (err, data) {
            if (err) {
                return response.end('Error loading certain-fish.png');
            }
            response.writeHead(200);
            response.end(data);
        }
    );
}

function mysteryfish(response, io) {
    console.log("Request handler 'mysteryfish' was called.");
    fs.readFile(__dirname + '/mystery-fish.png',
        function (err, data) {
            if (err) {
                return response.end('Error loading mystery-fish.png');
            }
            response.writeHead(200);
            response.end(data);
        }
    );
}

function underwater(response, io) {
    console.log("Request handler 'underwater' was called.");
    fs.readFile(__dirname + '/underwater.jpg',
        function (err, data) {
            if (err) {
                return response.end('Error loading underwater.jpg');
            }
            response.writeHead(200);
            response.end(data);
        }
    );
}

function anchor(response, io) {
    console.log("Request handler 'anchor' was called.");
    fs.readFile(__dirname + '/anchor.png',
        function (err, data) {
            if (err) {
                return response.end('Error loading anchor.png');
            }
            response.writeHead(200);
            response.end(data);
        }
    );
}

function world(response, io) {
    console.log("Request handler 'world' was called.");
    fs.readFile(__dirname + '/world.png',
        function (err, data) {
            if (err) {
                return response.end('Error loading world.png');
            }
            response.writeHead(200);
            response.end(data);
        }
    );
}

function bullet(response, io) {
    console.log("Request handler 'bullet' was called.");
    fs.readFile(__dirname + '/bullet_white.png',
        function (err, data) {
            if (err) {
                return response.end('Error loading bullet_white.png');
            }
            response.writeHead(200);
            response.end(data);
        }
    );
}

function archivedFile(query, response, io) {
    var filenameWanted = "data/" + query.substr(1);
    console.log("Request handler 'archivedFile' was called for file " + filenameWanted + ".");
    fs.readFile(filenameWanted,
        function (err, data) {
            if (err) {
                response.writeHead(500);
                return response.end('Error loading ' + filenameWanted);
            }
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end(data);
        }
    );
}

function jquery(response, io) {
    console.log("Request handler 'jquery' was called.");
    fs.readFile(__dirname + '/js/jquery-1.7.2.min.js',
        function (err, data) {
            if (err) {
                return response.end('Error loading /js/jquery-1.7.2.min.js');
            }
            response.writeHead(200);
            response.end(data);
        }
    );
}

function socketio(response, io) {
    console.log("Request handler '/socket.io/socket.io.js' was called.");
    fs.readFile(__dirname + '/socket.io/socket.io.js',
        function (err, data) {
            if (err) {
                return response.end('Error loading /socket.io/socket.io.js');
            }
            response.writeHead(200);
            response.end(data);
        }
    );
}

function localization(response, io) {
    console.log("Request handler '/localization.js' was called.");
    fs.readFile(__dirname + '/localization.js',
        function (err, data) {
            if (err) {
                return response.end('Error loading /localization.js');
            }
            response.writeHead(200, {"Content-Type": "text/javascript", "charset": "utf-8"});
            response.end(data);
        }
    );
}

exports.fish = fish;
exports.welcome = welcome;
exports.admin = admin;
exports.mainadmin = mainadmin;
exports.newgroup = newgroup;
exports.certainfish = certainfish;
exports.mysteryfish = mysteryfish;
exports.underwater = underwater;
exports.anchor = anchor;
exports.world = world;
exports.bullet = bullet;
exports.archivedFile = archivedFile;
exports.jquery = jquery;
exports.socketio = socketio;
exports.localization = localization;