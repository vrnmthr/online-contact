import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'


import './game.css';
import socketIOClient from "socket.io-client";
import axios from 'axios'


//colors for player profiles
const colors = ["#3CA3BA", "#4EBA3C", "#E79255", "#BA3C3C", "#3F3CBA"]

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
            clients: {},
            state: 'pending',
            rounds: 3,
            curRound: 0,
            cluemaster: [],
            curCluemaster: 0,
            timeout: 60,
            clueQueue: [],
            currWord: '',
            mode: 'classic',
            host: '',

            //client identifier
            name: ''
        }

        this.handleChangeName = this.handleChangeName.bind(this)
        this.handleChangeRounds = this.handleChangeRounds.bind(this)
        this.handleChangeTimeout = this.handleChangeTimeout.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    handleSubmit(e) {
        e.preventDefault();
        // edits fields
        this.state.socket.emit('edit_name', { 'name': this.state.name })
        this.state.socket.emit('edit_rounds', this.state.rounds)
        this.state.socket.emit('edit_timeout', this.state.timeout)
        this.state.socket.emit('edit_mode', this.state.mode)

    }


    handleChangeName(e) {
        //set name
        this.setState({ name: e.target.value });

    }

    handleChangeRounds(e) {
        //set name
        this.setState({ rounds: e.target.value });

    }

    handleChangeTimeout(e) {
        //set name
        this.setState({ timeout: e.target.value });

    }   


    // each player card

    playerCard = (name, i) => (
        <div className = "player-card" key = {i}>
            <FontAwesomeIcon icon={faUser} size = "3x" style = {{color: colors[i]}}/> 
            <div style = {{marginLeft: "2rem", marginTop: "0.75rem"}}>
                <h5>{name}</h5>
            </div>
        </div>
    )


    createSocket = () => {
        const socket = socketIOClient(`${this.state.endpoint}/rooms/${this.state.id}`);
        this.setState({ socket: socket })
        console.log("created socket");

        // set host
        socket.emit('set_host');

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
        
        //get host
        // socket.emit('get_host', (host) => {
        //     this.setState({host: host});
        // });

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
                this.state.state === 'pending' ?
                <div>
                    <div className='header'>
                        <h1 style = {{display: "inline"}}>Your Game ID: </h1> <h1 style = {{color: "#603CBA", display: "inline"}}> {this.state.id}</h1>
                    </div>

                    <Container fluid className='wrapper-main'>

                        <Row>
                            <Col xs={12} sm={12} md={8} lg={8} className="player-section">
                                <h2 className="players-header">Players in Game</h2>
                                <ul style={{ listStyle: "none" }}>
                                    {Object.keys(this.state.clients).map((client, i) => {
                                        return this.playerCard(this.state.clients[client]['name'], i)
                                    })}
                                </ul>
                              
                            </Col>

                            <Col xs={12} sm={12} md={4} lg={4} className="info-section">

                                <div style={{ padding: "1rem" }}>
                                    <Form onSubmit={this.handleSubmit}>
                                        <Form.Group controlId="name">
                                            <Form.Label>Name</Form.Label>
                                            <Form.Control type="text" placeholder="Name" value={this.state.name} onChange={this.handleChangeName} />
                                        </Form.Group>
                                        <Form.Group controlId="rounds">
                                            <Form.Label>Rounds</Form.Label>
                                            <Form.Control readOnly = {!(this.state.host === this.state.socket.id)} type="number" placeholder="Rounds" value={this.state.rounds} onChange={this.handleChangeRounds} />
                                        </Form.Group>
                                        <Form.Group controlId="timeout">
                                            <Form.Label>Timeout (in seconds)</Form.Label>
                                            <Form.Control readOnly = {!(this.state.host === this.state.socket.id)} type="number" placeholder="Timeout" value={this.state.timeout} onChange={this.handleChangeTimeout} />
                                        </Form.Group>

                                        <div key={`custom-radio`} className="mb-3">
                                            <Form.Check
                                                disabled = {!(this.state.host === this.state.socket.id)}
                                                custom
                                                inline
                                                type='radio'
                                                checked={this.state.mode == 'classic'}
                                                id={`classic-mode`}
                                                label={`Classic Mode`}
                                                value={'classic'}
                                                onChange={() => this.setState({ mode: 'classic' })}

                                            />

                                            <Form.Check
                                                custom
                                                disabled = {!(this.state.host === this.state.socket.id)}
                                                inline
                                                type='radio'
                                                checked={this.state.mode == 'group'}
                                                id={`group-mode`}
                                                label={`Group Mode`}
                                                value={'group'}
                                                onChange={() => this.setState({ mode: 'group' })}
                                            />
                                        </div>

                                        <Button variant="primary" className='btns' type="submit">
                                            Submit
                                        </Button>
                                    </Form>
                                </div>

                            </Col>

                        </Row>

                        <div style = {{textAlign: "center"}}>
                                <Button variant="primary" className='btns' onClick = {() => this.setState({state: 'active'})}> Start Game
                                </Button>
                            </div>

                    </Container>

                </div>
                : 
                
                <div>
                    <h1>Game Page</h1>

                </div>
                                
            )
        } else {
            return (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                    <h1>Room Does Not Exist</h1>
                </div>
            )
        }

    }
}
