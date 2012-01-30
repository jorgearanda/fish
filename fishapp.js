var server = require("./server");
var router = require("./router");
var ocean = require("./ocean");

var handle = {}
handle["/"] = ocean.fish;
handle["/fish"] = ocean.fish;
handle["/mainadmin"] = ocean.mainadmin;

server.start(router.route, handle);