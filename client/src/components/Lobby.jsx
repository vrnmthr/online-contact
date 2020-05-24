import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import socketIOClient from "socket.io-client";

const SERVER = "http://localhost:9000";
export default class Lobby extends Component {
    constructor(props){
        super(props)
        this.state = {
            socket: null
        }
    }
    componentDidMount = () => {
        const socket = socketIOClient(SERVER+this.props.url);
        console.log(socket)
        this.setState({socket: socket})
        socket.on('update', (text) => {
          console.log(`${text}`);
        })
        socket.emit('set_host')
      }

    render() {
        return (
         <div>
             <h1>Lobby</h1>
             <h2>{this.props.id}</h2>
             </div>   
        )
    }
}
