"use strict"

#jshint -W024 
express = require("express")
http = require("http")
logger = require("winston")
mongoose = require("mongoose")
MongoStore = require("connect-mongo")(express)
path = require("path")
socketio = require("socket.io")
access = require("./middlewares/access")
config = require("./config")
engine = require("./engine/engine")
experimenters = require("./routes/experimenters")
microworlds = require("./routes/microworlds")
runs = require("./routes/runs")
sessions = require("./routes/sessions")
isUser = access.isUser
authenticate = access.authenticate
app = exports.app = express()
app.configure ->
  logger.cli()
  logger.add logger.transports.File,
    filename: "fish.log"
    handleExceptions: false

  logger.remove logger.transports.Console  if process.env.NODE_ENV is "test"
  if app.settings.env is "development"
    process.env.NODE_ENV = "development"
    app.use express.logger("dev")
    app.use express.errorHandler()
  else if app.settings.env is "production"
    loggerStream = write: (message) ->
      logger.info message.slice(0, -1)
      return

    app.use express.logger(stream: loggerStream)
  app.set "port", process.env.PORT or 8080
  mongoose.connect config.db[app.settings.env]
  app.set "views", __dirname + "/views"
  app.set "view engine", "jade"
  app.use express.favicon()
  app.use express.json()
  app.use express.urlencoded()
  app.use express.methodOverride()
  app.use express.cookieParser("life is better under the sea")
  app.use express.session(
    secret: "life is better under the sea"
    store: new MongoStore(mongoose_connection: mongoose.connections[0])
    cookie:
      maxAge: null
  )
  app.use app.router
  app.use "/public", express.static(path.join(__dirname, "public"))
  app.use "/bower", express.static(path.join(__dirname, "bower_components"))
  return


#/////////////////////////////////////////////////////////////////////////////
#                                                                           //
# Resources                                                                 //
#                                                                           //
#/////////////////////////////////////////////////////////////////////////////
app.get "/", (req, res) ->
  res.render "participant-access.jade"
  return

app.get "/new-welcome", (req, res) ->
  res.render "participant-access.jade"
  return

app.get "/admin", (req, res) ->
  res.render "admin.jade"
  return

app.get "/ping", (req, res) -> # Sanity check
  res.send "pong"
  return

app.post "/sessions", sessions.createSession
app.post "/participant-sessions", sessions.participantSession
app.get "/a/:accountId", authenticate, (req, res) ->
  res.render "dashboard.jade"
  return

app.get "/a/:accountId/dashboard", authenticate, (req, res) ->
  res.render "dashboard.jade"
  return

app.get "/a/:accountId/microworlds/:microworldId", authenticate, (req, res) ->
  res.render "microworld.jade"
  return

app.get "/a/:accountId/new/microworld", authenticate, (req, res) ->
  res.render "microworld.jade"
  return

app.get "/a/:accountId/runs/:runId", authenticate, (req, res) ->
  res.render "run-results.jade"
  return

app.get "/a/:accountId/profile", experimenters.displayProfileUpdate
app.get "/fish", (req, res) ->
  res.render "fish.jade"
  return

app.get "/microworlds", isUser, microworlds.list
app.get "/microworlds/:id", isUser, microworlds.show
app.post "/microworlds", isUser, microworlds.create
app.put "/microworlds/:id", isUser, microworlds.update
app.delete "/microworlds/:id", isUser, microworlds.delete
app.get "/runs", isUser, runs.list
app.get "/runs/:id", isUser, runs.show
app.post "/experimenters", experimenters.create
app.put "/experimenters/:id", isUser, experimenters.update
server = http.createServer(app)
io = exports.io = socketio.listen(server,
  logger:
    debug: logger.debug
    info: logger.info
    warn: logger.warn
    error: logger.error
)
ioAdmin = exports.ioAdmin = io.of("/admin")
engine.engine io, ioAdmin
server.listen app.get("port"), ->
  logger.info "Fish server listening on port " + app.get("port")
  return

