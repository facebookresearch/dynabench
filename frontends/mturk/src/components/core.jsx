import React from "react";

import { CreateInterface } from './CreateInterface.js';

class TaskDescription extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <>
        <h1>Adversarial Sentiment Analysis</h1>
        <p>In this task, you will be asked to find examples that fool an AI model into making the wrong prediction.</p>
      </>;
  }
}

class TaskFrontend extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {
      context: ''
    };
  }
  componentDidMount() {
    this.api.getRandomContext(1, 1)
    .then(result => {
      this.setState({context: result});
    })
    .catch(error => {
      console.log(error);
    });
  }
  render() {
    return (
      <CreateInterface api={this.api} />
    );
  }
}

export { TaskDescription, TaskFrontend };
