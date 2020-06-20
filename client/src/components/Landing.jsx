import React, { Component } from 'react';
import "./landing.css";
import Button from 'react-bootstrap/Button'
import axios from 'axios'
import Modal from 'react-bootstrap/Modal'


const SERVER_PORT = "http://localhost:9000"

export default class Landing extends Component {
    constructor(props) {
        super(props);
        this.onChangeCode = this.onChangeCode.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state = {
            code: '',
            show: false,
            wrongCode: false
        };
    }

    onChangeCode(e) {
        this.setState({
            code: e.target.value
        });
    }

    HandleShow = () => {
        this.setState({ show: true })
    }

    HandleClose = () => {
        this.setState({ show: false })
    }

    onSubmit(e) {
        e.preventDefault();

        axios.get(`${SERVER_PORT}/rooms/exists/${this.state.code}`).then(res => {
            console.log(res.data);
            if (res.data) {

                console.log("room exists");
                this.setState({ wrongCode: false })
                this.props.history.push(`/rooms/${this.state.code}`);

            } else {
                console.log("room does not exist");
                this.setState({ wrongCode: true })
            }
        });

    }

    // create a new game and then redirect to the link
    createGame = () => {
        console.log("creating new game");
        axios.get(`${SERVER_PORT}/rooms/new`).then(res => {
            let roomId = res.data;
            this.props.history.push(`/rooms/${roomId}`);
        })
    }

    render() {
        return (
            <div className="wrapper">

                <div className="header_section">
                    <h1>3, 2, 1...</h1>
                    <h1>CONTACT!</h1>
                </div>

                <div className="instructions_section">
                    <h2>Instructions</h2>
                    <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                    A aperiam, nam autem, consequatur, assumenda id qui
                    busdam eius inventore deserunt nemo sed accusa
                    ntium iure voluptates impedit porro sequi. Quidem, cum reiciendis.
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam autem dolore ex veniam, nobis ea? Officiis cum, natus odit numquam assumenda fuga aliquid aut culpa ab, esse
                deleniti, exercitationem enim.</p>
                </div>

                <div className="Join_Create">
                    <Button className="one btn-choose" onClick={this.createGame}>Create Game</Button>

                    <Button variant="primary" className="two btn-choose" onClick={this.HandleShow}>
                        Join Game
                    </Button>
                </div>


                <div className="modal1">
                    <>

                        <Modal aria-labelledby="contained-modal-title-vcenter" centered show={this.state.show} onHide={this.HandleClose}>

                            <Modal.Header closeButton>
                                <Modal.Title>Join Existing Game</Modal.Title>
                            </Modal.Header>

                            <Modal.Body>
                                <div className="form">
                                    <form onSubmit={this.onSubmit}>
                                        <div className="form-group">
                                            <label>Enter Code: </label>
                                            <input type="text"
                                                required
                                                className="form-control"
                                                onChange={this.onChangeCode}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <input type="submit" value="Join" className="btn btn-success btn-choose" />
                                        </div>

                                        {this.state.wrongCode ?
                                            <div className='wrong_code'>Wrong Code</div>
                                            : null}

                                    </form>
                                </div>
                            </Modal.Body>

                        </Modal>
                    </>
                </div>
            </div>
        )
    }
}
