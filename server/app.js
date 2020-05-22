var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var socketIo = require("socket.io");


// key: id value: list of clients
rooms = {}

// key: socket id, value: socket
socketId_to_name = {}


// create express app
var app = express();

// create HTTP server with socketIO
var server = http.createServer(app);
var io = socketIo(server);

// creates a room with its own namespace and defines socket communication channels over that namespace
// TOOD: eventually, we want to abstract this logic out of this file because this will become clunky
function create_room(id) {
  const nsp = io.of(`/rooms/${id}`);

  nsp.on('connection', function (socket) {
    console.log(`socket connected to room ${id}`);

    // add yourself to the client list and update all players
    let room = rooms[id];
    let client = { 'name': name };
    room['clients'][id] = client;
    nsp.emit('clients', room['clients']); //emits list of players in the namespace

    //When player edits name
    socket.on("edit_name", (args) => {
      //update rooms, replace name
      let newName = args['name'];
      let clientMap = rooms[id]['clients'];
      clientMap[id]['name'] = newName;
      nsp.emit('clients', clientMap); //emits list of players in the namespace
      console.log(`${id}:${socket.id} changed name to ${newName}`);
    });

    //Player leaves game (leaving site)
    socket.on('disconnect', () => {
      let clientMap = rooms[id]['clients'];
      delete clientMap[socket.id];
      nsp.emit('clients', clientMap); //emits list of players in the namespace
      console.log(`${id}:${socket.id} disconnected`);
    });

  });

  console.log(`created room with id ${id}`);
};

// makes io available as req.io in all request handlers
// must be placed BEFORE all request handlers
app.use(function (req, res, next) {
  req.io = io;
  next();
});

// create routers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var testRouter = require('./routes/test');


// CHECKING TOOL, send updates to all sockets in the rooms every second,
setInterval(function () {
  for (const id in rooms) {
    io.to(`${id}`).emit('update', `in room ${id}`);
    console.log("sent update");
    console.log(rooms)
    console.log(socketId_to_name);
  }
}, 1000);




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/test', testRouter);
// app.use('/rooms', roomRouter);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = { "app": app, "server": server };
