var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var socketIo = require("socket.io");

// some hacky stuff for now that sets up socket namespacing and rooms
// key: id value: list of clients
rooms = {}
  
// key: socket id, value: socket
socketId_to_name = {}


// create express app
var app = express();

// create HTTP server with socketIO
var server = http.createServer(app);
var io = socketIo(server);

io.on("connection", socket => {//player joining

  let previousId;
  const safeJoin = (currentId, name) => {
    socket.leave(previousId);
    socket.join(currentId); 
    socketId_to_name[socket.id] = {"name": name, "socket": socket, "room": currentId};



    if(currentId in rooms){ //player joining room
        rooms[currentId].push(name)

        
    }
    else{ //player joining empty room (for now create a new room)
        rooms[currentId] = [name]
        //TODO: check if room exists else send out error message

    }

    if(previousId){ //if previous id exists
        let index = rooms[previousId].indexOf(name)
        rooms[previousId].splice(index, 1) //remove from that room
    }

    // Sending new list of players to all players, assumes namespace set up
    const nsp = io.of('/rooms/:' + `${currentId}`); //connect player to namespace (the url contact.com/rooms/:id)
    nsp.emit('update', `in room ${currentId}`);
    nsp.emit('players-update',rooms[currentId]); //emits list of players in the namespace
  
  
  };

  console.log("new socket IO");
  socket.on("join", (room, name) => {
    safeJoin(room, name);

  });


  //When player edits name
  socket.on("edit_name",(room,name) => {
    //update rooms, replace name
    let index = rooms[room].indexOf(name) 
    rooms[room].splice(index, 1,"name")

    const nsp = io.of('/rooms/:' + `${room}`); //connect player to namespace (the url contact.com/rooms/:id)
    nsp.emit('update', `in room ${room}`);
    nsp.emit('players-update',rooms[room]); //emits list of players in the namespace

  });

  //Player leaves game (leaving site)
  socket.on('disconnect', () => {
    console.log(`${socket.id}` + " disconnected")
    //update players list for all players in room 



    let room = socketId_to_name[socket.id].room;
    let name = socketId_to_name[socket.id].name;

    const nsp = io.of('/rooms/:' + `${room}`); //connect player to namespace (the url contact.com/rooms/:id)
    nsp.emit('update', `in room ${room}`);
    nsp.emit('players-update',rooms[room]); //emits list of players in the namespace

    delete socketId_to_name[socket.id]; //update socket dictionary
    //update room dictionary
    let index = rooms[room].indexOf(name) 
    rooms[room].splice(index, 1)
  }
  );




});


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
