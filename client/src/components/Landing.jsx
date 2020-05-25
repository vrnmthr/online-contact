import React, { Component } from 'react';
import "./landing.css";
import Button from 'react-bootstrap/Button'
import axios from 'axios'

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

    onSubmit(e) {
        e.preventDefault();

        var code = this.state.code,

            // check code
            url = '/rooms/' + code
        axios.get(SERVER_PORT + url)
            .then(res => {
                console.log(res.data)
                if (res.data == `room ${this.state.code} exists`) {
                    this.setState({ wrongCode: false })
                    this.props.createRoomRoute(code)
                }
                else {
                    console.log("wrong code")
                    this.setState({ wrongCode: true })
                }
            })

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

                <div className="Header_Section">
                    <h1>3, 2, 1...</h1>
                    <h1>CONTACT!</h1>
                </div>

                <div className="Instructions_Section">
                    <h2>Instructions</h2>
                    <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                    A aperiam, nam autem, consequatur, assumenda id qui
                    busdam eius inventore deserunt nemo sed accusa
                    ntium iure voluptates impedit porro sequi. Quidem, cum reiciendis.
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam autem dolore ex veniam, nobis ea? Officiis cum, natus odit numquam assumenda fuga aliquid aut culpa ab, esse
                deleniti, exercitationem enim.</p>
                </div>

                <div className="Join_Create">
                    <Button className="one" onClick={this.createGame}>Create Game</Button>

                    <Button className="two" onClick={() => { this.setState({ show: !this.state.show }) }}>Enter Game</Button>
                    {
                        this.state.show ? <div className="form">
                            <form onSubmit={this.onSubmit}>
                                <div className="form-group">
                                    <label>Enter Code: </label>
                                    <input type="text"
                                        required
                                        className="form-control"
                                        value={this.state.username}
                                        onChange={this.onChangeCode}
                                    />
                                </div>
                                <div className="form-group">
                                    <input type="submit" value="Join This Game?" className="btn btn-success" />
                                </div>
                            </form>
                        </div> : null


                    }

                    {this.state.wrongCode ?
                        <div className="wrong_code">Wrong Code</div>
                        : null}

                </div>

            </div>
        )
    }
}