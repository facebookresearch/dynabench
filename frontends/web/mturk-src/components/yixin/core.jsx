import React from "react";

import { CreateInterface } from '../CreateInterface.js';
import { Button } from 'react-bootstrap';

class YixinTaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <>
        <h1>Yixin's Task</h1>
        <p>In this task, you do what Yixin says.</p>
      </>;
  }
}

class YixinTaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
    this.completeOnboarding = this.completeOnboarding.bind(this);
  }
  completeOnboarding() {
    this.props.onSubmit({ success: true }); // if they failed, set to false
  }
  render() {
    return <>
      <h1>Onboarding</h1>
      <p>Task onboarding</p>
      <Button className="btn btn-primary btn-success" onClick={this.completeOnboarding}>Complete Onboarding</Button>
      </>;
  }
}

class YixinTaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    console.log(props);
  }
  render() {
    return <p>Insert your interface here</p>;
  }
}

export { YixinTaskPreview, YixinTaskOnboarder, YixinTaskMain };
