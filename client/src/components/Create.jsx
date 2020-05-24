import React, { Component } from 'react';


export default class Create extends Component {
    constructor(props) {
        super(props);
        this.onChangeNumber = this.onChangeNumber.bind(this);
        this.onChangeType = this.onChangeType.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state = {
          number: '',
          type: ''
        };
      }


    onChangeNumber(e) {
        this.setState({
            number: e.target.value
        });
    }

    onChangeType(e) {
        this.setState({
            type: e.target.value
        });
    }


    onSubmit(e) {
        e.preventDefault();
        const details = {
            number: this.state.number,
            type: this.state.type,
        };

        console.log(details)

        this.setState({
            number: '',
            type: '',
        })
    }


    render() {
        return (
            <div className="form">
                <form onSubmit={this.onSubmit}>
                    <div className="form-group">
                        <label>Number of Players: </label>
                        <input type="text"
                            required
                            className="form-control"
                            value={this.state.number}
                            onChange={this.onChangeNumber}
                        />
                    </div>
                    <div className="form-group">
                        <label>Game Type </label>
                        <input type="text"
                            required
                            className="form-control"
                            value={this.state.type}
                            onChange={this.onChangeType}
                        />
                    </div>
                    <div className="form-group">
                        <input type="submit" value="Create_Game" className="btn btn-success" />
                    </div>
                </form>
                </div>
        )
    }
}
