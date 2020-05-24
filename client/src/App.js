import React, {Component} from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import Landing from "./components/Landing"
import Create from "./components/Create";
import Lobby from "./components/Lobby";
import { Redirect } from 'react-router';


class App extends Component {

  constructor(props){
      super(props)
      this.state = {
        redirect: false,
        url: null, 
        room: null
      }
  }

  createRoomRoute = (id) => {
    
    this.setState({room: id})
    var pathname = "/rooms/" + id.toString();
    this.setState({url: pathname});
    this.setState({redirect: true});
    return true
  }

  handleRedirect = () => {
    if (this.state.redirect) {
        return <Redirect push to={this.state.url} />;
    }
  }

  render() {

    return(
    
    <Router>
        {this.handleRedirect()}
      <div className="container">
        <Route exact path = '/' render = {(props) => <Landing createRoomRoute = {this.createRoomRoute} {...props}/>}></Route>
        {/* <Route path="/create_game" component={Create} />
        <Route path="/lobby" component={Lobby} /> */}
        {this.state.url ? 
            
            <Route exact path = {this.state.url} render = {(props) => <Lobby url = {this.state.url} id = {this.state.room} {...props}/>}></Route>

            : null
        }
      </div>
    </Router>
    )
}
}

export default App;


/*import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import logo from './logo.svg';
import socketIOClient from "socket.io-client";
import './App.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      endpoint: "localhost:9000",
      socket: null
    };
  }

  componentDidMount = () => {
    const socket = socketIOClient(this.state.endpoint);
    this.setState({socket: socket})
    socket.on('update', (text) => {
      console.log(`${text}`);
    })
  }

 joinRoom = (event) => {
    event.preventDefault();
    let id = this.state['room'].value;
    let name = this.state['name'].value;
    console.log(`joining room ${id}`)
    this.state.socket.emit("join", id, name);
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>

          <Form onSubmit={this.joinRoom}>
            <Form.Group controlId="formUserName">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" placeholder="Name" ref={(ref) => { this.state['name'] = ref }} />
            </Form.Group>
            <Form.Group controlId="formJoinRoom">
              <Form.Label>Room ID</Form.Label>
              <Form.Control type="text" placeholder="Room ID" ref={(ref) => { this.state['room'] = ref }} />
            </Form.Group>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
        </header>
      </div>
    );
  }

}

export default App; */
