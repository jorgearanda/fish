var server = require("./server");
var router = require("./router");
var ocean = require("./ocean");

var handle = {};
handle["/"] = ocean.welcome;
handle["/index"] = ocean.welcome;
handle["/index.html"] = ocean.welcome;
handle["/welcome"] = ocean.welcome;
handle["/fish"] = ocean.fish;
handle["/mainadmin"] = ocean.mainadmin;
handle["/runningSimulationsList"] = ocean.runningSimulationsList;
handle["/newgroup"] = ocean.newgroup;

handle["/certain-fish.png"] = ocean.certainfish;
handle["/mystery-fish.png"] = ocean.mysteryfish;

server.start(router.route, handle);