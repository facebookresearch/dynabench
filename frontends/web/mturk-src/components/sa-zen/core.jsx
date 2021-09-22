/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

import { CreateInterface } from "../CreateInterface.js";
import { Button } from "react-bootstrap";
import { Row, Container, Jumbotron } from "react-bootstrap";

/*
 * This is a block list containing Turker Ids we want to block
 * for this task. It is ok to have the list in UI side as it is
 * compiled by javascript and probably hard to modify.
 */

var public_block_list = [];

class SentimentTaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
        <br />
        <br />
        <center>
          <h1>Adversarial Natural Language Sentiment Analysis</h1>
          <br />
          <Jumbotron className="jumbotron">
            <p>
              In this task, you will be asked to find examples that fool an AI
              model into making the wrong prediction.
            </p>
            <p>
              This AI model has been trained to predict whether a sentence is
              positive or negative. It is a very clever model, so we will give
              you some advice on how to fool it. Specifically, we suggest that
              you fool the model using examples that require{" "}
              <b>multi-step reasoning</b>.
            </p>
            <p>
              Here is an example that is <i>positive</i> that the AI model
              predicts is <i>negative</i>:
            </p>
            <p>
              <center>
                <b>
                  "Susan told me that this movie was very bad, but I do not
                  agree at all."
                </b>
              </center>
            </p>
            <p>
              This example requires <b>multi-step reasoning</b> because to know
              the sentiment of the example, you need combine the information
              that <i>Susan does not like the movie</i> with the information
              that <i>I do not agree with Susan </i> to get the information{" "}
              <i>I like this movie</i>.
            </p>
            <p>
              The AI model is not very good at <b>multi-step reasoning</b>, so
              you can use examples like the one above to fool the model!
            </p>
          </Jumbotron>
        </center>
      </>
    );
  }
}

var counter = 0;

class SentimentTaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
    this.completeOnboarding = this.completeOnboarding.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.state = {
      q1: "no",
      q2: "no",
      q3: "no",
      q4: "no",
      q5: "no",
    };
  }

  handleOptionChange(event) {
    if (event.target.name === "agoal") {
      this.setState({
        q1: event.target.value,
      });
    } else if (event.target.name === "bgoal") {
      this.setState({
        q2: event.target.value,
      });
    } else if (event.target.name === "cgoal") {
      this.setState({
        q3: event.target.value,
      });
    } else if (event.target.name === "dgoal") {
      this.setState({
        q4: event.target.value,
      });
    } else if (event.target.name === "egoal") {
      this.setState({
        q5: event.target.value,
      });
    }
  }

  componentDidMount() {
    // we will reject if the worker id is in our block list
    if (public_block_list.includes(this.props.providerWorkerId)) {
      this.props.onSubmit({ success: false });
    }
  }

  completeOnboarding() {
    // check if they filled out correctly for all the questions.
    if (
      this.state.q1 == "yes" &&
      this.state.q2 == "yes" &&
      this.state.q3 == "yes" &&
      this.state.q4 == "yes" &&
      this.state.q5 == "yes"
    ) {
      this.props.onSubmit({ success: true }); // if they failed, set to false
    } else if (counter == 9) {
      // only give n times.
      this.props.onSubmit({ success: false }); // if they failed, set to false
    } else {
      alert(
        "Please check your answers. You have only 10 times in total to get them all right."
      );
      counter += 1;
    }
  }
  render() {
    return (
      <>
        <br />
        <br />
        <center>
          <h1>Instructions</h1>
          <br />
          <Jumbotron className="jumbotron">
            <p>
              In this task, you will be asked to find examples that fool an AI
              model into making the wrong prediction.
            </p>
            <p>
              This AI model has been trained to predict whether a sentence is
              positive or negative. It is a very clever model, so we will give
              you some advice on how to fool it. Specifically, we suggest that
              you fool the model using examples that require{" "}
              <b>multi-step reasoning</b>.
            </p>
          </Jumbotron>

          <Jumbotron className="jumbotron">
            <p>
              Here is an example that is <i>positive</i> that the AI model
              predicts is <i>negative</i>:
            </p>
            <p>
              <center>
                <b>
                  {" "}
                  "Susan told me that this movie was very bad, but I do not
                  agree at all."
                </b>
              </center>
            </p>
            <p>
              In other words you enter a <b>positive</b> sentence but the AI
              model predicts <b>negative</b>. You successfully fool the powerful
              AI model!
            </p>
            <img
              className="example-img"
              src="https://i.ibb.co/85DRYzJ/example-SA.png"
              alt="Logo"
            />
            <p>
              Following the example above, you will input your sentence into the
              textbox. We made the task a little easier by providing you a
              context, and{" "}
              <b>
                {" "}
                you just need to modify the prompt to generate your own sentence
                tha fools the model
              </b>
              . Once you are finished, you can hit the <b>Submit</b> button to
              submit your result. Note that it may take some time for the model
              to generate the prediction.
            </p>
          </Jumbotron>

          <Jumbotron className="jumbotron">
            <h3>Comprehension Quiz</h3>

            <div>
              <br />
              You are asked to write down one sentence at each round.
              <br />
              <input
                type="radio"
                name="agoal"
                value="no"
                onChange={this.handleOptionChange}
              />{" "}
              False
              <br />
              <input
                type="radio"
                name="agoal"
                value="yes"
                onChange={this.handleOptionChange}
              />{" "}
              True
              <br />
              <br />
              You will not know whether you fool the model after you submit your
              sentence.
              <br />
              <input
                type="radio"
                name="bgoal"
                value="yes"
                onChange={this.handleOptionChange}
              />{" "}
              False
              <br />
              <input
                type="radio"
                name="bgoal"
                value="no"
                onChange={this.handleOptionChange}
              />{" "}
              True
              <br />
              <br />
              You may need to wait after you submit your result.
              <br />
              <input
                type="radio"
                name="cgoal"
                value="no"
                onChange={this.handleOptionChange}
              />{" "}
              False
              <br />
              <input
                type="radio"
                name="cgoal"
                value="yes"
                onChange={this.handleOptionChange}
              />{" "}
              True
              <br />
              <br />
              The goal is to find an example that the model gets <b>
                right
              </b>{" "}
              but that another person would get <b>wrong</b>.
              <br />
              <input
                type="radio"
                name="dgoal"
                value="yes"
                onChange={this.handleOptionChange}
              />{" "}
              False
              <br />
              <input
                type="radio"
                name="dgoal"
                value="no"
                onChange={this.handleOptionChange}
              />{" "}
              True
              <br />
              <br />
              You will be <b> modifying a provided prompt </b> to generate your
              own sentence.
              <br />
              <input
                type="radio"
                name="egoal"
                value="no"
                onChange={this.handleOptionChange}
              />{" "}
              False
              <br />
              <input
                type="radio"
                name="egoal"
                value="yes"
                onChange={this.handleOptionChange}
              />{" "}
              True
              <br />
              <br />
            </div>
          </Jumbotron>

          <Button
            className="btn btn-primary btn-success"
            onClick={this.completeOnboarding}
          >
            Complete Onboarding
          </Button>
        </center>
      </>
    );
  }
}

class SentimentTaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = { showInstructions: false };
    // console.log(props);
  }

  render() {
    return (
      <>
        <CreateInterface api={this.api} {...this.props} />
      </>
    );
  }
}

export { SentimentTaskPreview, SentimentTaskOnboarder, SentimentTaskMain };
