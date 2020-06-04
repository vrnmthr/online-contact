var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var socketIo = require("socket.io");
const { v4: uuidv4 } = require('uuid');
var cors = require('cors')

// key: id, value: room dict
rooms = {};

// create express app
var app = express();

// create HTTP server with socketIO
var server = http.createServer(app);
var io = socketIo(server);

//timer function
function start_timer(rooms,id,nsp){

}

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
    'timer':0,
    'clueQueue': [],
    'currWord': {word: '',progress: 0},
    'counter': 60,
    'currClue': {clue:'' , ans:'',fromID: 0}

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
      rooms[id]['host'] = socket.id;
      console.log("set host")
    });

    //start game after required setup
    socket.on('start_req', () => {
      // randomize cluemaster order
      let newCluemasterOrder = [];
      for (const clientID in clientMap) {
        newCluemasterOrder.push(clientID);
      }
      newCluemasterOrder.sort(() => Math.random() - 0.5);
      rooms[id]['cluemaster'] = newCluemasterOrder;

      rooms[id]['state'] = 'active';
      nsp.emit('start_game', {});

      //inform players of current cluemaster
      let currCluemasterID = rooms[id]['cluemaster'][rooms[id]['curCluemaster']];
      nsp.emit('start_turn', {id: currCluemasterID, name: currCluemasterID['name']});

    });

        //cluemaster submits word
    socket.on('word', (args) => {
      // update currWord
      let newWord = args['word'];
      rooms[id]['currWord'] = {word: newWord, progress: 0};
      nsp.emit('start_phase', rooms[id]['currWord']);


      //wait for clues to be submitted by players then emit next clue
      let clueTimer = setInterval(function () {
        console.log("waiting for clue");

      if(rooms[id]['clueQueue'].length >= 1){//at least one clue in queue
        console.log("new clue in play");
        let currClue = rooms[id]['clueQueue'].shift()
        nsp.emit('clue', currClue);


        //start timer for clue to be solved
        rooms[id]['timer'] = setInterval(function () {
          nsp.emit('time', {remaining:rooms[id]['counter'] });
          console.log("time remaining: " + rooms[id]['counter']);

          if (rooms[id]['counter'] <= 0) {
            // time over for this clue. clear this and send next one
            rooms[id]['clueQueue'].shift();
            let nextClue = rooms[id]['clueQueue'][0];
            nsp.emit('clue', nextClue);

            clearInterval(rooms[id]['timer']);
          }
          rooms[id]['counter']--;
      }, 1000);;

        //stop waiting for clues
        clearInterval(clueTimer);
      }

      },1000);

  });

    //someone submits a clue
    socket.on('clue', (args) => {
      let newClue = args['clue'];
      let newAns = args['ans'];
      let fromID = socket.id;

      let newClueDict = {'clue': newClue,
                          'ans': newAns,
                          'from': fromID,
                          'solved': false};

      clueQueue.push(newClueDict);
    });

    //someone guessed the clue correctly
    socket.on('correct', (args) => {
      //TODO: Multithreaded stuff
      //lock the server
      //tell whoever is correct but late

      if(rooms[id]['clueQueue'][0]['solved']){
        nsp.emit("already_answered", {});
      } else{
        nsp.emit("correct", {id: socket.id, name: rooms[id][clients][socket.id]['name']}) //tell everyone about correct answer
        rooms[id]['clueQueue'] = []; //clear queue
        clearInterval(rooms[id]['timer']);//stop timer
        rooms[id]['currWord']['progress']++; //progress on word


        if(rooms[id]['currWord']['progress'] >= rooms[id]['currWord']['word'].length) { //check if word is done by people getting all the letters
          //TODO later
          //select new clue master
          //increment rounds
          //set up new word etc

        } else {

          //inform clients of progress
          nsp.emit('progress',{word: rooms[id]['currWord']['word'],progress: rooms[id]['currWord']['progress']});

          //reset timer
          rooms[id]['counter'] = rooms[id]['timeout'];

          //wait for clues to be submitted then emit next clue
          let clueTimer = setInterval(function () {
            console.log("waiting for clue");

            if(rooms[id]['clueQueue'].length >= 1) {//at least one clue in queue
              let currClue = rooms[id]['clueQueue'].shift();
              nsp.emit('clue', currClue);
              console.log("new clue in play");

              //start timer for clue to be solved
              rooms[id]['timer'] = setInterval(function () {
                nsp.emit('time', {remaining:rooms[id]['counter'] });
                console.log("time remaining: " + rooms[id]['counter']);

                if (rooms[id]['counter'] <= 0) {
                  // time over for this clue. clear this and send next one
                  rooms[id]['clueQueue'].shift();
                  let nextClue = rooms[id]['clueQueue'][0];
                  nsp.emit('clue', nextClue);

                  clearInterval(rooms[id]['timer']);
                }

                rooms[id]['counter']--;

              }, 1000);

              //stop waiting for clues and carry on with the game
              clearInterval(clueTimer);
            }

            },1000);

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
