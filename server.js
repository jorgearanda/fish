var http = require("http");
var url = require("url");
var socket = require("socket.io");
var srv;
var io;

function start(route, handle) {
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");
    
    route(handle, pathname, response, io);
  }
  
  srv = http.createServer(onRequest);
  io = socket.listen(srv);
  srv.listen(80);
  console.log("Server has started.");
}

exports.start = start;
