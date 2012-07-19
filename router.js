function route(handle, pathname, query, response, io) {
    console.log("About to route a request for " + pathname);
    if (typeof handle[pathname] === 'function') {
        if (pathname == "/archivedFile") {
            handle[pathname](query, response, io);
        } else {
            handle[pathname](response, io);
        }
    } else {
        console.log("No request handler found for " + pathname);
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not Found");
        response.end();
    }
}

exports.route = route;
