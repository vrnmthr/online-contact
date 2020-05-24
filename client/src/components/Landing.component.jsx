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
            show: false
        };
    }

    onChangeCode(e) {
        this.setState({
            username: e.target.value
        });
    }

    onSubmit(e) {
        e.preventDefault();
        const newUser = {
            code: this.state.code,
        };

        this.setState({
            username: ''
        })
    }

    onClick = () => {
         var rounds = 1
         var timeout = 1000
         axios.post(SERVER_PORT+`/newroom`, {rounds, timeout})
            .then(res => {
                
                console.log(res.data);

                this.props.createRoomRoute(res.data)
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
                <Button className="one"  onClick={this.onClick}>Create Game</Button>

                    <Button className="two" onClick={() => { this.setState({ show: !this.state.show }) }}>Enter Game</Button>
                    {
                        this.state.show ? <div className="form">
                            <form onSubmit={this.onSubmit}>
                                <div className="form-group">
                                    <label>Enter_Code: </label>
                                    <input type="text"
                                        required
                                        className="form-control"
                                        value={this.state.username}
                                        onChange={this.onChangeUsername}
                                    />
                                </div>
                                <div className="form-group">
                                    <input type="submit" value="Join This Game?" className="btn btn-success" />
                                </div>
                            </form>
                        </div> : null
                    }

                </div>
               
            </div>
        )
    }
}
