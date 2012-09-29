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
handle["/mainadmin.html"] = ocean.mainadmin;
handle["/newgroup"] = ocean.newgroup;
handle["/admin"] = ocean.admin;
handle["/admin.html"] = ocean.admin;

handle["/certain-fish.gif"] = ocean.certainfish;
handle["/mystery-fish.gif"] = ocean.mysteryfish;
handle["/underwater.jpg"] = ocean.underwater;
handle["/anchor.png"] = ocean.anchor;
handle["/world.png"] = ocean.world;
handle["/bullet_white.png"] = ocean.bullet;

handle["/archivedFile"] = ocean.archivedFile;

handle["/js/jquery-1.7.2.min.js"] = ocean.jquery;
handle["/socket.io/socket.io.js"] = ocean.socketio;

server.start(router.route, handle);