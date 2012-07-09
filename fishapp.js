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

handle["/certain-fish.gif"] = ocean.certainfish;
handle["/mystery-fish.gif"] = ocean.mysteryfish;
handle["/underwater.jpg"] = ocean.underwater;

server.start(router.route, handle);