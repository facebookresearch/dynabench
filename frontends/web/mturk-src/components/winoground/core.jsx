/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

import ValidateInterface from "./ValidateInterface.js";
import { Button, Row, Col, InputGroup} from "react-bootstrap";

class WinogroundTaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="p-3 text-center">
        <h1>Decide Whether a Caption Matches an Image</h1>
        <p><strong>Instructions:</strong></p>
        <p>
        Select whether the image matches the caption. Pay close attention to the word order.
        </p>
        <p><strong>Examples:</strong></p>
        <Row>
        <Col>
        <p>
          <img src={"https://media.gettyimages.com/photos/man-holding-gift-box-behind-while-standing-at-home-picture-id1308488297?s=2048x2048"} alt="" style={{"maxHeight": "300px"}}/>
        </p>
        <p>
          someone holds a red box with a black bow
        </p>
        <p style={{ color: "red" }}>
          Incorrect
        </p>
        </Col>
        <Col>
        <p>
          <img src={"https://media.gettyimages.com/photos/closeup-of-christmas-tree-in-miniature-shopping-cart-against-white-picture-id1196227647?s=2048x2048"} alt="" style={{"maxHeight": "300px"}}/>
        </p>
        <p>
          there is a tree in a shopping cart
        </p>
        <p style={{ color: "green" }}>
          Correct
        </p>
        </Col>
        </Row>
      </div>
    );
  }
}

class WinogroundTaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      examples: [
        {id: 0, context: {context_json: JSON.stringify({image: "https://media.gettyimages.com/photos/woman-embracing-man-using-laptop-at-table-picture-id511752211?s=2048x2048", caption: "the person with longer hair is behind the person with shorter hair"})}, input_json: "{}", metadata_json: "{}", model_wrong: 0},
        {id: 1, context: {context_json: JSON.stringify({image: "https://media.gettyimages.com/photos/woman-sitting-on-suitcase-in-train-looking-at-smart-phone-picture-id1081349324?s=2048x2048", caption: "the suitcase is on the person"})}, input_json: "{}", metadata_json: "{}", model_wrong: 0},
        {id: 2, context: {context_json: JSON.stringify({image: "https://media.gettyimages.com/photos/female-surfer-at-sunrise-standing-on-beach-picture-id468970147?s=2048x2048", caption: "the surfboard is below the person"})}, input_json: "{}", metadata_json: "{}", model_wrong: 0},
        {id: 3, context: {context_json: JSON.stringify({image: "https://media.gettyimages.com/photos/green-traffic-light-and-world-financial-center-picture-id520152818?s=2048x2048", caption: "a stoplight has the red and yellow lights turned off and the green light turned on"})}, input_json: "{}", metadata_json: "{}", model_wrong: 0},
        {id: 4, context: {context_json: JSON.stringify({image: "https://media.gettyimages.com/photos/new-jersey-mendham-couple-playing-with-frisbee-picture-id152892506?s=2048x2048", caption: "there are twice as many frisbees as people"})}, input_json: "{}", metadata_json: "{}", model_wrong: 0},
        {id: 5, context: {context_json: JSON.stringify({image: "https://media.gettyimages.com/photos/fluffy-dog-in-a-stroller-picture-id1252795793?s=2048x2048", caption: "the dog rolls and the person walks"})}, input_json: "{}", metadata_json: "{}", model_wrong: 0},
        {id: 6, context: {context_json: JSON.stringify({image: "https://media.gettyimages.com/photos/red-poison-dart-frog-picture-id500169089?s=2048x2048", caption: "the frog is green and the leaf is red"})}, input_json: "{}", metadata_json: "{}", model_wrong: 0},
        {id: 7, context: {context_json: JSON.stringify({image: "https://media.gettyimages.com/photos/kite-surfing-cadiz-spain-picture-id523073400?s=2048x2048", caption: "a kite is lifting up a person"})}, input_json: "{}", metadata_json: "{}", model_wrong: 0},
        {id: 8, context: {context_json: JSON.stringify({image: "https://media.gettyimages.com/photos/portrait-of-confident-young-woman-holding-hat-picture-id1156016751?s=2048x2048", caption: "with a hat and without gloves"})}, input_json: "{}", metadata_json: "{}", model_wrong: 0},
        {id: 9, context: {context_json: JSON.stringify({image: "https://media.gettyimages.com/photos/dogs-examining-oversized-bone-picture-id130406071?s=2048x2048", caption: "one dog two bones"})}, input_json: "{}", metadata_json: "{}", model_wrong: 0},
      ],
      eidToCorrectAction: {
        0: "correct",
        1: "incorrect",
        2: "incorrect",
        3: "correct",
        4: "incorrect",
        5: "correct",
        6: "incorrect",
        7: "correct",
        8: "correct",
        9: "incorrect",
      },
      allExamplesValidated: false,
      initialInstructions: true,
      examplesWrong: 0,
      warning: null
    }
    this.setWarning = this.setWarning.bind(this);
  }
  completeOnboarding(success) {
    this.props.onSubmit({ success: success }); // if they failed, set to false
  }
  loggedIn() {
    return false;
  }
  getTask(taskCode) {
    return this.props.api.getTask(taskCode);
  }
  getAdminOrOwner(taskId) {
    return new Promise((resolve, reject) => resolve({admin_or_owner: false}));
  }
  setWarning(warning) {
    this.setState({warning: warning});
  }
  validateExample(
    exampleId,
    action,
    mode,
    metadata,
    uid,
  ) {
    if (!action) {
      return new Promise((resolve, reject) => resolve({success: true}));
    }
    if (this.state.eidToCorrectAction[exampleId] !== action) {
      if (this.state.examplesWrong === 0) {
        this.setState({warning: "Are you sure that your answer is correct?", examplesWrong: 1})
        return new Promise((resolve, reject) => resolve({success: true}));
      } else {
        this.completeOnboarding(false);
      }
    }
    this.state.examples.pop()
    if (this.state.examples.length === 0) {
      this.setState({allExamplesValidated: true})
    }
    return new Promise((resolve, reject) => resolve({success: true}));
  }
  getRandomExample(
    tid,
    rid,
    tags = [],
    context_tags = [],
    annotator_id = null
  ) {
    return new Promise((resolve, reject) => resolve(this.state.examples[this.state.examples.length-1]));
  }
  render() {
    return this.state.initialInstructions ?
    <div className="p-3 text-center">
    <h1>Onboarding</h1>
    <p>
      Welcome! This is your first time working on this task. We would like
      you to take a quick qualification test.

      You have only <strong>one</strong> chance to pass the test and failure
      to pass the test will <strong>disqualify</strong> you from working on
      these HITs. The onboarding test contains 10 questions.
    </p>
    <p><strong>Instructions:</strong></p>
    <p>
    Select whether the image matches the caption. Pay close attention to the word order.
    </p>
    <p><strong>Examples:</strong></p>
    <Row>
    <Col>
    <p>
      <img src={"https://media.gettyimages.com/photos/man-holding-gift-box-behind-while-standing-at-home-picture-id1308488297?s=2048x2048"} alt="" style={{"maxHeight": "300px"}}/>
    </p>
    <p>
      someone holds a red box with a black bow
    </p>
    <p style={{ color: "red" }}>
      Incorrect
    </p>
    </Col>
    <Col>
    <p>
      <img src={"https://media.gettyimages.com/photos/closeup-of-christmas-tree-in-miniature-shopping-cart-against-white-picture-id1196227647?s=2048x2048"} alt="" style={{"maxHeight": "300px"}}/>
    </p>
    <p>
      there is a tree in a shopping cart
    </p>
    <p style={{ color: "green" }}>
      Correct
    </p>
    </Col>
    </Row>
    <div className="text-center">
    <Button
      className="btn btn-primary btn-primary"
      onClick={() => this.setState({initialInstructions: false})}
    >
      Continue
    </Button>
    </div>
    </div>
    : (
    this.state.allExamplesValidated ?
    (
      <>
        <h1>Onboarding</h1>
        <p>Congratulations! You have passed the onboarding. Click the button below to continue to the real task.</p>
        <Button
          className="btn btn-primary btn-success"
          onClick={() => this.completeOnboarding(true)}
        >
          Continue
        </Button>
      </>
    ) :
    <ValidateInterface  batchAmount={11} {...this.props} api={this} match={{params: {taskCode: "wino"}}} mturk={true} setWarning={this.setWarning} warning={this.state.warning}/>
  );
  }
}

class WinogroundTaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
  }
  render() {
    return <ValidateInterface batchAmount={10} {...this.props} api={this.api} match={{params: {taskCode: "wino"}}} mturk={true} />;
  }
}

export { WinogroundTaskPreview, WinogroundTaskOnboarder, WinogroundTaskMain };
