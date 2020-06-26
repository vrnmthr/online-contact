import React, { useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Container from "@material-ui/core/Container";
import Button from "react-bootstrap/Button";
import { useTimer } from "use-timer";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

//STyling Stuff
const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(5),
    height: 120,
    width: 100,
    textAlign: "center",
  },
  control: {
    padding: theme.spacing(4),
  },
}));

//Classic function
const Classic = (props) => {
  //////////static variables
  const socket = props.socket;
  const clients = props.clients;
  const host = props.host;
  const name = props.name;

  //CHANGING GAMESTATE VARIABLES-------------------------------------------
  // 0 means setting, 1 means show word progress
  const [showClue, setshowClue] = useState(0);
  //clues which are submitted by individual
  const [clue, setClue] = useState({ clue_body: "", ans: "" });
  const [timer, setTimer] = useState(0);
  //represents the current round
  const [curRound, setcurRound] = useState(0);
  //represents the current cluemaster
  const [cur_cluemaster, setcur_cluemaster] = useState({ name: "", id: "" });
  //word which is sent by clue_master to server to start game
  const [start_curr_word, setstart_curr_word] = useState("");
  //word which clue_master begins the game with (Returned by server)
  const [game_word, setgame_word] = useState({ word: "", progress: 0 });
  //all the clues in game
  // const [clueQueue, setclueQueue] = useState([]);
  //the current clue which the clue_queue is running with
  const [curr_clue, setCurrClue] = useState(null);
  //the specific clients answer for a clue
  const [cur_clue_ans, setcur_clue_ans] = useState({ ans: "", name: "" });
  //solved by
  const [solved_by, set_solved_by] = useState("");
  //word progress
  const [word_progress, set_word_progress] = useState("");
  //styling
  const classes = useStyles();

  useEffect(() => {
    console.log(clients);

    //gets the curr clue master, and starts the turn
    socket.on("start_turn", (args) => {
      console.log("new cluemaster ", args.cluemaster);
      setcur_cluemaster(args.cluemaster);
      setshowClue(0);
    });

    socket.on("solved", (args) => {
      let solvedById = args.byId;
      setCurrClue(null);
    })

    // starts a phase
    socket.on("start_phase", (args) => {
      setgame_word(args.word);
      setshowClue(1);
    });

    // update the clue when it is present
    socket.on("clue", (clue) => {
      setCurrClue(clue);
    });

    // updates the timer socket
    socket.on("time", (args) => {
      setTimer(args.remaining);
    })


    //gets the clue queue
    // socket.on("clue_queue", (args) => {
    //   console.log(args);
    //   setclueQueue(args);
    //   setCurrClue(args[0]);
    // });

    //updates clue_queue and game_word
    // socket.on("answered_correct", (args) => {
    //   console.log(args);
    //   set_solved_by(args.solvedBy);
    //   setgame_word(args.game_word);
    //   setclueQueue([]);
    // });
  }, []); //empty array so only called once when component mounts

  // //use effect to reset timer
  // useEffect(() => {
  //   if (time === 0) {
  //     clueQueue.splice(0, 1);
  //     //sets the current clue to the first in the clue_queue
  //     setCurrClue(clueQueue[0]);
  //   }
  // }, [time]);



  /*RENDER FUNCTIONS--------------------------------------------------*/
  //allows a player to submit an answer
  const submit_answer = () => {
    console.log(curr_clue.ans);
    console.log(cur_clue_ans.ans);
    if (cur_clue_ans.ans === curr_clue.ans) {
      socket.emit("correct", {});
    }
  };

  //form to guess clue
  const guess_clue = () => {
    if (showClue === 1) {
      return (
        <Form>
          <Form.Group>
            <Form.Label>Answer to curr_clue</Form.Label>
            <Form.Control
              onChange={(e) => {
                setcur_clue_ans({ ans: e.target.value, name: name });
              }}
            />
            <Button onClick={submit_answer}>Submit Answer</Button>
          </Form.Group>
        </Form>
      );
    }
  };

  // //displays the clue clue
  // const display_clues = () => {
  //   //console.log(clueQueue);
  //   if (clueQueue.length != 0) {
  //     return (
  //       <div>
  //         <h3>Clue_Queue</h3>
  //         <div>
  //           {clueQueue.map((clue, index) => (
  //             <div key={index}>
  //               <h6>{clue.clue}</h6>
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     );
  //   }
  // };

  //displays the curr_clue
  const display_curr_clue = () => {
    //console.log(clueQueue);
    if (curr_clue != null) {
      return (
        <div>
          <h3>Curr Clue: {curr_clue.clue}</h3>
          <h4>Seconds Left: {timer}</h4>
        </div>
      );
    }
  };
  //submit clue handler
  const submit_clue = () => {
    console.log(clue);
    socket.emit("clue", clue);
    // start();
  };

  // render form for players other than host to submit clues
  const clue_form = () => {
    if (showClue === 1) {
      if (name !== cur_cluemaster.name) {
        return (
          <Form>
            <Form.Group>
              <Form.Label>Submit a Clue</Form.Label>
              <Form.Control
                onChange={(e) => {
                  setClue({ clue_body: e.target.value, ans: clue.ans });
                  console.log(clue.clue_body);
                }}
              />
              <Form.Label>Answer to clue</Form.Label>
              <Form.Control
                onChange={(e) => {
                  setClue({ ans: e.target.value, clue_body: clue.clue_body });
                }}
              />
              <Button onClick={submit_clue}>Submit Clue</Button>
            </Form.Group>
          </Form>
        );
      }
    }
  };

  //sends the current word to the socket
  const Submit_word = (e) => {
    socket.emit("word", { word: start_curr_word });
  };

  //Renders a form for cluemaster to submit word
  const clue_master_word = () => {
    // if 0 render form and name for clue master
    if (showClue === 0) {
      if (socket.id === cur_cluemaster.id) {
        return (
          <Form>
            <Form.Group>
              <Form.Label>Clue Master's Word</Form.Label>
              <Form.Control
                onChange={(e) => {
                  setstart_curr_word(e.target.value);
                }}
              />
              <Button onClick={Submit_word}>Submit Word</Button>
            </Form.Group>
          </Form>
        );
      }
      return <div>Please wait for clue master to submit word</div>;
    }
    //if one render letter and progress for not cluemaster
    else if (showClue === 1) {
      if (socket.id === cur_cluemaster.id) {
        return (
          <div>
            the word you chose is {game_word.word}. the curr progress{" "}
            {game_word.progress}
          </div>
        );
      } else {
        //console.log(progress);
        if (game_word.word !== undefined && game_word.progress !== undefined) {
          let progress = "";
          if (game_word.progress === 0) {
            progress += game_word.word[0];
          }
          else {
            for (let i = 0; i < game_word.progress; i++) {
              progress += game_word.word[i]
            }
          }
          return (
            <div>
              The section of the word you have is{" "}
              {progress}
            </div>
          );
        } else {
          return <div>{game_word}</div>;
        }
      }
    }
  };

  //renders the name of the cluemaster
  const render_clue_master = () => {
    if (cur_cluemaster.name !== "")
      return (
        <div>
          <h2>The Curr Clue Master is: {cur_cluemaster.name}</h2>
        </div>
      );
  };

  //grid format
  return (
    <Container fixed>
      <div>{name}</div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Grid
            container
            direction="row-reverse"
            justify="center"
            alignItems="center"
            spacing={3}
          >
            <Grid item>
              <div>{render_clue_master()}</div>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Grid
            container
            direction="row-reverse"
            justify="center"
            alignItems="center"
            spacing={0}
          >
            <Grid item>
              <div>{clue_master_word()}</div>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={6}>
          <Grid
            container
            direction="row-reverse"
            justify="center"
            alignItems="center"
            spacing={0}
          >
            <Grid item>{clue_form()}</Grid>
          </Grid>
        </Grid>

        <Grid item xs={6}>
          <Grid
            container
            direction="row-reverse"
            justify="center"
            alignItems="flex-start"
            spacing={0}
          >
            <Grid item>{guess_clue()}</Grid>
          </Grid>
        </Grid>

        <Grid item xs={6}>
          <Grid
            container
            direction="row-reverse"
            justify="center"
            alignItems="flex-start"
            spacing={0}
          >
            <Grid item>
              <div>{display_curr_clue()}</div>
            </Grid>
          </Grid>
        </Grid>

        {/* <Grid item xs={6}>
          <Grid
            container
            direction="row-reverse"
            justify="center"
            alignItems="center"
            spacing={0}
          >
            <Grid item>
              <div>{display_clues()}</div>
            </Grid>
          </Grid>
        </Grid> */}
      </Grid>
    </Container>
  );
};

export default Classic;
