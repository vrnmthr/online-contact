import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import socketIOClient from "socket.io-client";
import axios from 'axios'

export default class Game extends Component {

    constructor(props) {
        super(props);
        let id = this.props.match.params.id;
        this.state = {
            // networking state variables
            exists: false,
            socket: null,
            id: id,
            endpoint: "http://localhost:9000",

            // game state variables
            mode: 'classic',
            clients: {},
            state: 'pending',
            rounds: 3,
            curRound: 0,
            cluemaster: [],
            curCluemaster: 0,
            timeout: 60,
            clueQueue: [],
            currWord: '',
        }
    }

    createSocket = () => {
        const socket = socketIOClient(`${this.state.endpoint}/rooms/${this.state.id}`);
        this.setState({ socket: socket })
        console.log("created socket");

        // full state update
        socket.on('state', (state) => {
            this.setState(state);
            console.log("updated entire state: ", this.state);
        });

        // client list update
        socket.on('clients', (clientMap) => {
            this.setState({ clients: clientMap });
            console.log('clients: ', clientMap);
        });

        // FOR DEVELOPMENT PURPOSES ONLY
        socket.on('update', (text) => {
            console.log(`${text}`);
        })
    }

    // check whether room exists and create a socket if it doesn't
    componentDidMount = () => {
        axios.get(`${this.state.endpoint}/rooms/exists/${this.state.id}`).then(res => {
            console.log(res.data);
            if (res.data) {
                console.log("room exists");
                this.createSocket();
                this.setState({ exists: true });
            } else {
                console.log("room does not exist");
                this.setState({ exists: false });
            }
        });
    }

    render() {
        if (this.state.exists) {
            return (
                <div>
                    <h1>Lobby: {this.state.id}</h1>
                    <h6>Rounds: {this.state.rounds}</h6>
                    <h6>Timeout: {this.state.rounds}</h6>
                </div>
            )
        } else {
            return (
                <div>
                    <h1>Room Does Not Exist</h1>
                </div>
            )
        }

    }
}
