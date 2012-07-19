var http = require("http");
var url = require("url");
var socket = require("socket.io");
var srv;
var io;

function start(route, handle) {
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        var query = url.parse(request.url).search;
        console.log("Request for " + pathname + " received.");

        route(handle, pathname, query, response, io);
    }

    srv = http.createServer(onRequest);
    io = socket.listen(srv);
    srv.listen(8080);
    console.log("Server has started.");
}

exports.start = start;
