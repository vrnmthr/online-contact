var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var socketIo = require("socket.io");
const { v4: uuidv4 } = require('uuid');
var cors = require('cors');

// key: id, value: room dict
rooms = {};

// create express app
var app = express();

// create HTTP server with socketIO
var server = http.createServer(app);
var io = socketIo(server);


io.on('connection', function (socket) {
  console.log("socket connection");
});

// creates a room with its own namespace and defines socket communication channels over that namespace
// TOOD: eventually, we want to abstract this logic out of this file because this will become clunky
function create_room(id) {

  // create namespace
  const nsp = io.of(`/rooms/${id}`);

  // create room object and add
  rooms[id] = {
    'mode': 'classic',
    'host': '',
    'id': id,
    'clients': {},
    'state': 'pending',
    'rounds': 3,
    'curRound': 0,
    'cluemaster': [],
    'curCluemaster': 0,
    'timeout': 60,
    'timer': 0,
    'clueQueue': [],
    'currWord': { word: '', progress: 0 },
    'counter': 60,
    'currClue': null,
    'clueDaemon': null,
  }

  nsp.on('connection', function (socket) {
    console.log(`socket connected to room ${id}`);

    // send the full game state to the new client
    socket.emit('state', rooms[id]);

    // add yourself to the client list and update all players
    let clientMap = rooms[id]['clients'];
    let client = { 'name': '' };
    clientMap[socket.id] = client;
    nsp.emit('clients', clientMap); //emits list of players in the namespace

    //Player leaves game (leaving site)
    socket.on('disconnect', () => {
      let clientMap = rooms[id]['clients'];
      delete clientMap[socket.id];
      nsp.emit('clients', clientMap); //emits list of players in the namespace
      console.log(`${id}:${socket.id} disconnected`);

      // removes the player from host if they were
      if (rooms[id]['host'] === socket.id) {
        rooms[id]['host'] = '';
      }
    });

    //When player edits name
    socket.on("edit_name", (args) => {
      //update rooms, replace name
      let newName = args['name'];
      let clientMap = rooms[id]['clients'];
      clientMap[socket.id]['name'] = newName;
      nsp.emit('clients', clientMap); //emits list of players in the namespace
      console.log(`${id}:${socket.id} changed name to ${newName}`);
    });

    // edit round for a room
    socket.on("set_rounds", (rounds) => {
      rooms[id]['rounds'] = rounds;
      console.log(`${id}: set rounds to ${rounds}`);
    });

    // edit timeout for a room
    socket.on("set_timeout", (timeout) => {
      rooms[id]["timeout"] = timeout;
      rooms[id]["counter"] = timeout;
      console.log(`${id}: set timeout to ${timeout}`);
    });

    // set the game mode
    socket.on("set_mode", (mode) => {
      rooms[id]["mode"] = mode;
      console.log(`${id}: set mode to ${mode}`);
    });

    // set host for a room
    socket.on("set_host", () => {
      if (rooms[id]['host'] === '') {
        rooms[id]['host'] = socket.id;
        console.log(`set host to ${socket.id}`);
      } else {
        console.log("host already exists");
      }
    });

    /* GAME LOGIC */

    // starts a timer for the clue passed in as an argument
    function startClueTimer(clue) {

      let clueTimer = setInterval(function () {
        nsp.emit('time', { remaining: clue.counter });
        console.log(`time remaining: ${clue.counter}`);
        // time over for this clue. remove it from the queue and get rid of the timer
        if (clue.counter <= 0) {
          let clueQ = rooms[id]['clueQueue'];
          clueQ.shift();
          clearInterval(clueTimer);
        }
        clue.counter--;
      }, 1000);

      clue.timer = clueTimer;
    }

    // check for new clues to be submitted by players every INTERVAL length
    function startClueDaemon() {
      let INTERVAL = 100;

      let clueDaemon = setInterval(function () {
        let clueQ = rooms[id]['clueQueue'];
        let currClue = rooms[id]['currClue'];
        // if queue has a clue at the head that is not the current clue then send it out!
        if (clueQ.length >= 1 && clueQ[0].id !== currClue.id) {
          console.log("new clue in play");
          let newClue = clueQ[0];
          rooms[id]['currClue'] = newClue;
          nsp.emit('clue', newClue);
          startClueTimer(newClue);
        }
      }, INTERVAL);

      rooms[id]['clueDaemon'] = clueDaemon;
    }

    function stopClueDaemon() {
      let clueDaemon = rooms[id]['clueDaemon'];
      clearInterval(clueDaemon);
    }

    //start game after required setup
    socket.on('start_req', () => {
      // randomize cluemaster order
      let newCluemasterOrder = [];
      let clientMap = rooms[id]['clients'];
      for (const clientID in clientMap) {
        newCluemasterOrder.push(clientID);
      }
      newCluemasterOrder.sort(() => Math.random() - 0.5);
      rooms[id]['cluemaster'] = newCluemasterOrder;

      rooms[id]['state'] = 'active';
      nsp.emit('start_game', {});

      //inform players of current cluemaster (first one)
      let currCluemasterID = newCluemasterOrder[0];
      let name = clientMap[currCluemasterID];
      nsp.emit('start_turn', { id: currCluemasterID, name: name });
    });

    //cluemaster submits word
    socket.on('word', (args) => {
      let newWord = { word: args['word'], progress: 0 };
      rooms[id]['currWord'] = newWord;

      // start the clueDaemon and start the phase
      startClueDaemon();
      nsp.emit('start_phase', newWord);
    });

    // add the clue to the queue when someone submits it
    socket.on('clue', (args) => {
      let newClue = args['clue'];
      let newAns = args['ans'];
      let fromID = socket.id;
      let currWordDict = rooms[id]['currWord'];

      if (newClue[0].equals(currWordDict['word'][currWordDict['progress']])) { //clue first letter matches progrress in word

      let newClueDict = {
        id: uuidv4(),
        clue: newClue,
        ans: newAns,
        from: fromID,
        solvedBy: null,
        timer: null,
        counter = rooms[id]['timeout']
      };

      clueQueue.push(newClueDict);
    } else { //clue first letter does not match progrress in word
      socket.emit('invalid_clue',{});
    }
    });



    //someone guessed the clue correctly
    socket.on('correct', (args) => {

      let currClue = rooms[id].currClue;
      if (currClue.solvedBy !== null) {
        socket.emit("already_answered", {});
      } else {
        currClue.solvedBy = socket.id;

        // tell everyone about correct answer
        nsp.emit("correct", { id: socket.id, name: rooms[id][clients][socket.id]['name'] })
        // stop timer and reset queue for the next phase
        clearInterval(currClue.timer);
        rooms[id].clueQueue = [];
        rooms[id].currWord.progress++;

        // go to the next turn if the word has been guessed
        if (rooms[id]['currWord']['progress'] >= rooms[id]['currWord']['word'].length) {
          // select new clue master
          let cluemasterIx = ++rooms[id].curCluemaster;
          // if we have completed a whole round, increment appropriately
          if (cluemasterIx > Object.keys(rooms[id].clients).length) {
            rooms[id].curCluemaster = 0;
            rooms[id].curRound++;
          }
          let cluemaster = rooms[id].cluemaster[cluemasterIx];
          let name = clientMap[cluemaster];
          nsp.emit('start_turn', { id: cluemaster, name: name });

          // stop the clue daemon since it will be started again when the new cluemaster submits a clue
          stopClueDaemon();
        } else {
          // word has not been guessed so we just continue with the new progress
          nsp.emit('start_phase', rooms[id].currWord);
        }
      }

    });

  });

  console.log(`created room with id ${id}`);

};







/* -------------------------------------------------------------------- */
/* AUTO GENERATED CODE, DO NOT MODIFY UNLESS YOU KNOW WHAT YOU'RE DOING */
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors()); // Use this after the variable declaration
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

/*
ROUTE SETUP
*/

// makes io available as req.io in all request handlers
// must be placed BEFORE all request handlers
app.use(function (req, res, next) {
  req.io = io;
  next();
});

// this is a modularized router...
const indexRouter = require("./routes/index");
app.use('/', indexRouter);
// this is not a modularized router...
app.get('/test', function (req, res) {
  res.send('pong');
});

// Route for creating a new room
app.get('/rooms/new', function (req, res) {
  let newRoomId = uuidv4();
  create_room(newRoomId);
  res.send(newRoomId);
});

// Route for accessing a room id -- returns 200 if room exists and 404 if not
app.get('/rooms/exists/:id', function (req, res, next) {
  let id = req.params.id;
  if (id in rooms) {
    res.send("true");
  } else {
    res.send("false");
  }
});

// CHECKING TOOL, send updates to all sockets in each namespace every second
setInterval(function () {
  for (const id in rooms) {
    const nsp = io.of(`/rooms/${id}`);
    nsp.emit('update', `in room ${id}`);
    console.log("sent update");
  }
}, 1000);

/* -------------------------------------------------------------------- */
module.exports = { "app": app, "server": server };
