var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var socketIo = require("socket.io");

// some hacky stuff for now that sets up socket namespacing and rooms
rooms = {}
  
// users = 0;
// IdToName = {}


// create express app
var app = express();

// create HTTP server with socketIO
var server = http.createServer(app);
var io = socketIo(server);

io.on("connection", socket => {

  let previousId;
  const safeJoin = (currentId, name) => {
    socket.leave(previousId);
    socket.join(currentId);
    if(currentId in rooms){
        rooms[currentId].push(name)
    }
    else{
        rooms[currentId] = [name]
    }

    if(previousId){
        let index = rooms[previousId].indexOf(name)
        rooms[previousId].splice(index, 1)
    }

    previousId = currentId;
  };

  console.log("new socket IO");
  socket.on("join", (room, name) => {
    safeJoin(room, name);

  });

});

io.on('disconnect', socket)
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


// send updates to all sockets in the rooms every second
setInterval(function () {
  for (const id in rooms) {
    io.to(`${id}`).emit('update', `in room ${id}`);
    console.log("sent update");
    console.log(rooms)
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
app.use('/users', usersRouter);
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
