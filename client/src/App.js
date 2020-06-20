import React, { Component } from 'react';
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import Landing from "./components/Landing"
import Game from "./components/Game";


class App extends Component {

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path='/' render={props => <Landing {...props} />} />
          <Route path='/rooms/:id' render={props => <Game {...props} />} />
        </Switch>
      </BrowserRouter>
    )
  }
}

export default App;