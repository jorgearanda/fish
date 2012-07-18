var fs = require("fs");
var engineCalled = false;
var runningSims = "--none currently--";

function engine(io) {
    // The array "oceans" holds all active simulations. If one simulation group has more than one ocean, then
    // there is one entry for each ocean in this array.
    // Oceans are indexed by their name.
    var oceans = new Array();

    // The "oceanGroups" array holds all active simulation groups. Every oceanGroup has at least one ocean.
    // Every ocean has a single corresponding oceanGroup entry.
    var oceanGroups = new Array();

    // Every ocean has a log in this array with the same index
    var logs = new Array();

    var timestamper = new Date();
    var t;  // timer function variable
    var timerIsRunning = false;
    var keepTimerGoing = true;

    function timer() {
        // This function looks for "timable" simulations (those currently having action of any kind),
        // and sends them to timeStep every second.
        // When there are no more simulations to timestep, it wraps its own cycle up.
        if (keepTimerGoing) {
            keepTimerGoing = false;
            for (oceanName in oceans) {
                if (oceans[oceanName].timable == true) {
                    keepTimerGoing = true;
                    oceans[oceanName].timeStep();
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
        if (this.type == "ai") {
            this.ready = true;
        }

        this.isBot = function() {
            return (this.type == "ai");
        };

        this.calculateSeasonGreed = function (overallGreed, greedUniformity, currentSeason, totalSeasons) {
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
            return currentGreed;
        };

        this.calculateSeasonCasts = function (currentGreed, expectedPlayers, startingFish, actualMysteryFish, spawnFactor, chanceOfCatch) {
            return Math.round(((startingFish + actualMysteryFish - ((startingFish + actualMysteryFish) / spawnFactor)) / expectedPlayers) * 2 * currentGreed / chanceOfCatch);;
        };

        this.prepareAgent = function (ocean) {
            // This method does bookkeeping for all agents for the new season. It also calculates the greed and intended casts of bots.
            if (this.type == "ai") {
                this.greedPerSeason[ocean.currentSeason] =
                    this.calculateSeasonGreed(this.greediness, ocean.greedUniformity, ocean.currentSeason, ocean.totalSeasons);
                this.intendedCasts =
                    this.calculateSeasonCasts(this.greedPerSeason[ocean.currentSeason], ocean.expectedPlayers, ocean.certainFish, ocean.actualMysteryFish, ocean.spawnFactor, ocean.chanceOfCatch);
            }
            this.actualCasts = 0;
            this.fishCaughtPerSeason[ocean.currentSeason] = 0;
            this.startMoneyPerSeason[ocean.currentSeason] = this.money;
            this.endMoneyPerSeason[ocean.currentSeason] = this.money;
        };

        this.readRules = function () {
            this.ready = true;
        };

        this.goToPort = function(ocean) {
            this.status = "At port";
            logs[ocean.name].addEvent("Fisher " + this.name + " returned to port.");
        };

        this.goToSea = function(ocean) {
            this.status = "At sea";
            this.money -= ocean.costDepart;
            this.endMoneyPerSeason[ocean.currentSeason] = this.money;
            logs[ocean.name].addEvent("Fisher " + this.name + " sailed to sea.");
        };

        this.tryToFish = function(ocean) {
            this.money -= ocean.costCast;
            this.endMoneyPerSeason[ocean.currentSeason] = this.money;
            this.actualCasts++;

            if (ocean.isSuccessfulCastAttempt()) {
                logs[ocean.name].addEvent("Fisher " + this.name + " cast for a fish, and succeeded.");
                this.money += ocean.valueFish;
                this.fishCaught++;
                this.fishCaughtPerSeason[ocean.currentSeason]++;
                this.endMoneyPerSeason[ocean.currentSeason] = this.money;
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

    function Ocean (gs, parentName) {
        this.name = parentName;
        this.parent = parentName;
        this.players = new Array();         // gameState
        this.seasonsData = new Array();     // gameState
        this.actualPlayers = 0;             // gameState
        this.actualHumans = 0;              // gameState
        this.timable = true;                // gameState
        this.currentSeason = 0;             // gameState
        this.status = "waiting";            // gameState
        this.currentSeconds = 0;            // gameState
        this.debug = true;                  // gameState
        this.unpauseState = "";             // gameState
        this.pausedBy = null;               // gameState
        this.depleted = false;              // gameState

        if (gs != null) {
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
            this.startingFish = gs.certainFish;
            this.certainFish = gs.certainFish;                  // gameState
            this.mysteryFish = gs.mysteryFish;
            this.startingMysteryFish = gs.actualMysteryFish;
            this.actualMysteryFish = gs.actualMysteryFish;      // gameState
            this.showOtherFishers = gs.showOtherFishers;
            this.showFisherNames = gs.showFisherNames;
            this.showFisherStatus = gs.showFisherStatus;
            this.showFishCaught = gs.showFishCaught;
            this.showBalance = gs.showBalance;
            this.pauseEnabled = gs.pauseEnabled;
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
        } else {
            this.numOceans = 1;
            this.expectedPlayers = 4;
            this.expectedHumans = 1;
            this.totalSeasons = 4;
            this.seasonDuration = 60;
            this.initialDelay = 5;
            this.restDuration = 10;
            this.spawnFactor = 4.00;
            this.chanceOfCatch = 1.00;
            this.costDepart = 0;
            this.costAtSea = 0;
            this.costCast = 0;
            this.valueFish = 3;
            this.startingFish = 40;
            this.certainFish = 40;
            this.mysteryFish = 10;
            this.startingMysteryFish = 5;
            this.actualMysteryFish = 5;
            this.showOtherFishers = true;
            this.showFisherNames = true;
            this.showFisherStatus = true;
            this.showFishCaught = true;
            this.showBalance = true;
            this.pauseEnabled = true;
            this.greedUniformity = 0;
            this.erratic = true;
            this.hesitation = 0.4;
            this.castsPerSecond = 3;
            this.castingProbability = 0.8;
            this.prepText = "FISH simulates fishing in an ocean. You and the other fishers are the only fishers " +
                "in this ocean. All the fishers see the same ocean that you do. At the beginning, the " +
                "number of fish will be displayed on the screen. However, sometimes there is some " +
                "uncertainty about the number of fish. In those cases, 'mystery fish' will be shown on " +
                "the screen as well, and the number is displayed as a certain range, not as an absolute " +
                "number. Once the simulation begins, you and the other fishers may catch as many of these " +
                "fish as you like. Once  you have taken as many fish as you want, you return to port " +
                "with your catches, and the first season ends. Then the fish spawn for the next season, " +
                "if any are left to spawn (if no fish are left, they cannot spawn). For every fish left " +
                "at the end of one season, two fish will be available to be caught in the next season. " +
                "However, because the ocean can support only so many fish, the total number of fish will " +
                "never exceed the original number of fish. Fishing can go on this way for many seasons, " +
                "but all fishing permanently ceases any time that all the fish are caught.\n\n" +
                "You can make money fishing. You will be paid $5 for every fish you catch. (For now, " +
                "this is 'play' money...but please treat it as if it were real money.)\n\n" +
                "Your job is to consider all these factors, and the other fishers, and make your own " +
                "decisions about how to fish. Fish however you wish.\n\n" +
                "Please ask if anything is unclear. We want you to fully understand the rules before you " +
                "start fishing.\n\n" +
                "If you are sure you understand all the above, you are ready to fish. Click on the Go " +
                "Fishing button on the left when you are ready. Once all the fishers have clicked this button, " +
                "the first season will begin. (You may have to wait briefly for all the others fishers " +
                "to click the button.)";
            this.depletedText = "All the fish are gone!";
            this.endText = "Seasons come and seasons go, but for now it seems we're done.";
            robotNames = new Array();
            robotNames[0] = "Leonardo";
            robotNames[1] = "Michelangelo";
            robotNames[2] = "Raphael";
            robotNames[3] = "Donatello";
            for (i = 0; i < this.expectedPlayers - this.expectedHumans; i++) {
                this.players[i] = new Agent(robotNames[i], "ai", 0.5);
                this.actualPlayers++;
            }
        }
        for (i = 0; i <= this.totalSeasons; i++) {
            this.seasonsData[i] = new seasonData(i);
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
            return (this.currentSeconds > this.seasonDuration);
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

        this.getOceanReady = function () {
            // We assume this.isEveryoneReady returned true
            this.status = "readying";
            io.sockets.in(this.name).emit("readying", this);
            logs[this.name].addEvent("All agents now ready to start.");
        };

        this.startNextSeason = function () {
            this.currentSeason += 1;
            logs[this.name].addEvent("Beginning season " + this.currentSeason + ".");
            this.resetTimer();
            this.status = "running";
            this.seasonsData[this.currentSeason].initialFish = this.certainFish + this.actualMysteryFish;

            if (this.currentSeason > 1) {
                this.certainFish = Math.min(this.certainFish * this.spawnFactor, this.startingFish);
                this.actualMysteryFish = Math.min(this.actualMysteryFish * this.spawnFactor, this.startingMysteryFish);
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
                    this.players[player].endMoneyPerSeason[this.currentSeason] = this.players[player].money;
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

            // Create the log file for this ocean run.
            logs[this.name].writeReport();
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
                logs[this.name].addEvent("Ocean paused by agent " + this.players[pauseRequester].name + ".");
                io.sockets.in(this.name).emit("paused", {id: pauseRequester});
                io.sockets.in(this.name).emit('gamesettings', this);
            }
        };

        this.resume = function (resumeRequester) {
            if (this.isPaused() && this.pausedBy == resumeRequester) {
                this.status = this.unpauseState;
                io.sockets.in(this.name).emit("resumed", {id: resumeRequester});
                io.sockets.in(this.name).emit('gamesettings', this);
                logs[this.name].addEvent("Ocean resumed by agent " + this.players[resumeRequester].name + ".");
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

    function OceanGroup (oceanGroupName, numOceans) {
        this.name = oceanGroupName;
        this.numOceans = numOceans;

        this.allocateFisherToOcean = function() {
            // Warning: there's a race condition here; we check if there's room, and a bit later we assign the fisher
            // to the ocean. Given the expected usage of FISH this should not be an issue, and in fact there could
            // be other race conditions around. Still, something to fix eventually.
            var availableOcean = "";
            var oID;
            for (i = 1; i <= this.numOceans; i++) {
                oID = this.name + "-" + (1000 + i).toString().substr(1); // Forming IDs such as oceanname-001
                if (oceans[oID].hasRoom()) {
                    availableOcean = oID;
                    break;
                }
            }
            return availableOcean; // returns the empty string if no ocean with space available was found
        };

        this.createOceans = function(oceanSettings, source) {
            var i;
            for (i = 1; i <= this.numOceans; i++) {
                oceanID = this.name + "-" + (1000 + i).toString().substr(1); // Forming IDs such as oceanname-001
                oceans[oceanID] = new Ocean(oceanSettings, oceanID);
                logs[oceanID] = new OceanLog(oceanID);
                logs[oceanID].addEvent("Ocean created from the page " + source + ".");
            }
        };
    }


    function OceanLog (oceanName) {
        this.name = oceanName;
        this.events = "";

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

            r += "Number of agents: " + g.expectedPlayers + "\n";
            r += "Number of humans: " + g.expectedHumans + "\n";
            r += "Number of seasons: " + g.totalSeasons + "\n";
            r += "Season length (in seconds): " + g.seasonDuration + "\n";
            r += "Delay to begin simulation (in seconds): " + g.initialDelay + "\n";
            r += "Resting time between seasons (in seconds): " + g.restDuration + "\n";
            r += "Spawn factor: " + g.spawnFactor + "\n";
            r += "Chance of catch (0.00 to 1.00): " + g.chanceOfCatch + "\n";
            r += "Cost to depart: " + g.costDepart + "\n";
            r += "Cost per second at sea: " + g.costAtSea + "\n";
            r += "Cost to cast for a fish: " + g.costCast + "\n";
            r += "Value of fish caught: " + g.valueFish + "\n";
            r += "Number of starting certain fish: " + g.startingFish + "\n";
            r += "Number of starting mystery fish: " + g.startingMysteryFish + "\n";
            r += "Number of ending certain fish: " + g.certainFish + "\n";
            r += "Number of ending mystery fish: " + g.actualMysteryFish + "\n";
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
            r += "Fisher, Type, Greed, Season, FishInit, FishTaken, Profit, IR, GR, IE, GE\n";
            r += "--------------------------------------------------------------------------------\n";
            for (agent in g.players) {
                p = g.players[agent];
                for (j = 1; j <= g.totalSeasons; j++) {
                    r += p.name + ", ";
                    r += p.type + ", ";
                    r += ((p.type == "ai") ? p.greedPerSeason[j] : "n/a") + ", ";
                    r += j + ", ";
                    r += g.seasonsData[j].initialFish + ", ";
                    r += p.fishCaughtPerSeason[j] + ", ";
                    r += (p.endMoneyPerSeason[j] - p.startMoneyPerSeason[j]) + ", ";
                    r += individualRestraint(g.seasonsData[j].initialFish, g.expectedPlayers, p.fishCaughtPerSeason[j]) + ", ";
                    r += groupRestraint(g.seasonsData[j].initialFish, g.seasonsData[j].endFish) + ", ";
                    r += individualEfficiency(g.startingFish + g.startingMysteryFish, g.seasonsData[j].initialFish, g.spawnFactor, g.expectedPlayers, p.fishCaughtPerSeason[j]) + ", ";
                    r += groupEfficiency(g.startingFish + g.startingMysteryFish, g.seasonsData[j].initialFish, g.seasonsData[j].endFish, g.spawnFactor) + "\n";
                }
            }
            r += "\n";
            r += "--------------------------------------------------------------------------------\n\n";

            r += "Logged simulation events:\n\n";
            r += this.events;


            fs.writeFile("data/" + this.name + ".txt", r, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log(this.name + ": Simulation run logged under data/" + this.name + ".txt");
            });

        };
    }


    function recreateSimulationsList() {
        // We shouldn't be creating the html here. Already in issue tracker.
        runningSims = "<ul>";
        for (parent in oceanGroups) {
            runningSims += "<li><b>" + parent + "</b>, with " + oceanGroups[parent].numOceans + " ocean(s).</li>";
        }
        runningSims += "</ul>"
    }


    // The following contains all the functions to communicate with our various clients.
    io.sockets.on('connection', function (socket) {
        var oceanID = "";

        // Creating a group from newgroup.html
        socket.on('create group', function (gs) {
            console.log("Core: Attempting to create oceanGroup " + gs.name);
            if (gs.name in oceanGroups) {
                console.log("Core: Group " + group + " already exists. No action taken.");
                socket.emit("group-not-created");
            } else {
                oceanGroups[gs.name] = new OceanGroup(gs.name, gs.numOceans);
                oceanGroups[gs.name].createOceans(gs, "newgroup");
                recreateSimulationsList(); // Ugly, but there's a ticket for this already.
                socket.emit("group-created");
            }
        });

        // Responding to main.html
        var myID;
        socket.on('join group', function (group, pid) {
            if (!(group in oceanGroups)) {
                // Register group
                oceanGroups[group] = new OceanGroup(group, 1);
                oceanGroups[group].createOceans(null, "fish");
                recreateSimulationsList();
            }

            var myOceanGroup = oceanGroups[group];

            var allocatedOcean = myOceanGroup.allocateFisherToOcean();
            if (allocatedOcean != "") {
                var myOcean = oceans[allocatedOcean];
                socket.set("group", myOcean.name, function() {
                    socket.emit("myGroup", myOcean.name);
                });

                // Register client in the socket for the ocean it was assigned to
                socket.join(myOcean.name);

                // Create object for client
                myOcean.players[myOcean.actualPlayers] = new Agent(pid, "human", null);
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

                // Begin timekeeping
                if (timerIsRunning == false) {
                    timerIsRunning = true;
                    keepTimerGoing = true;
                    timer();
                }
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
}


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

function runningSimulationsList(response, io) {
    console.log("Request handler 'runningSimulationsList' was called.");
    if (engineCalled == false) {
        console.log("...but the simulation engine is not running!");
        response.writeHead(500);
        return response.end("Error trying to get list of running simulations.");
    } else {
        response.writeHead(200);
        response.end(runningSims);
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

function certainfish(response, io) {
    console.log("Request handler 'certainfish' was called.");
    fs.readFile(__dirname + '/certain-fish.gif',
        function (err, data) {
            if (err) {
                return response.end('Error loading certain-fish.gif');
            }
            response.writeHead(200);
            response.end(data);
        }
    );
}

function mysteryfish(response, io) {
    console.log("Request handler 'mysteryfish' was called.");
    fs.readFile(__dirname + '/mystery-fish.gif',
        function (err, data) {
            if (err) {
                return response.end('Error loading mystery-fish.gif');
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

exports.fish = fish;
exports.welcome = welcome;
exports.mainadmin = mainadmin;
exports.runningSimulationsList = runningSimulationsList;
exports.newgroup = newgroup;
exports.certainfish = certainfish;
exports.mysteryfish = mysteryfish;
exports.underwater = underwater;
exports.jquery = jquery;