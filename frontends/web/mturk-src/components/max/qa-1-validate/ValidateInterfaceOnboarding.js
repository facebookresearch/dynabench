/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  Container,
  Row,
  Col,
  Card,
  InputGroup,
  Button,
  FormControl,
} from "react-bootstrap";
import { FaInfoCircle, FaThumbsUp, FaThumbsDown, FaFlag } from "react-icons/fa";

import { TokenAnnotator, TextAnnotator } from "react-text-annotate";

import "./ValidateInterface.css";

class ContextInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text:
      'On September 28, 2010, Walmart announced it would buy Massmart Holdings Ltd. of Johannesburg, South Africa in a deal worth over giving the company its first footprint in Africa. it has 437 stores, including 390 stores in South Africa (under the banners Game Foodco [72 locations], CBW [46 locations], Game [49 locations], Builders Express [46 locations], Builders Warehouse [33 locations], Cambridge [43 locations], Dion Wired [23 locations], Rhino [19 locations], Makro [22 locations], Builders Trade Depot [13 locations], Jumbo [10 locations], and Builders Superstore [14 locations]), 11 stores in Botswana (under the banners CBW [7 locations], Game Foodco [2 locations], and Builders Warehouse [2 locations]), 4 stores in Ghana under the banners Game (3 locations) and Game Foodco (1 location), 2 stores in Kenya (under the Game Foodco banner), 3 stores in Lesotho (under the banners CBW [2 locations] and Game Foodco [1 location]), 2 stores in Malawi (under the Game banner), 6 stores in Mozambique (under the banners Builders Warehouse [2 locations], Game Foodco [2 locations], CBW [1 location], and Builders Express [1 location]), 4 stores in Namibia (under the banners Game Foodco [2 locations], Game [1 location], and CBW [1 location]), 5 stores in Nigeria (under the banners Game [4 locations] and Game Foodco [1 location], 1 store in Swaziland (under the CBW banner), 1 store in Tanzania (under the Game banner), 1 store in Uganda (under the Game banner), and 7 stores in Zambia (under the banners CBW [1 location], Game [3 locations], Builders Warehouse [2 locations], and Builders Express [1 location]).',
    };
  }
  render() {
    return (
      <>
        <TokenAnnotator
          id="tokenAnnotator"
          className="mb-1 p-3 light-gray-bg qa-context"
          tokens={this.state.text.split(/\b|(?<=[\s\(\)])|(?=[\s\(\)])/)}
          value={this.props.answer}
          onChange={() => void 0}
        />
      </>
    );
  }
}

class ValidateInterfaceOnboarding extends React.Component {
  constructor(props) {
    super(props);
    console.log(this.props);
    this.step = props.step;
    this.VALIDATION_STATES = {
      CORRECT: "correct",
      INCORRECT: "incorrect",
      VALID: "valid",
      INVALID: "invalid",
      FLAGGED: "flagged",
      UNKNOWN: "unknown",
    };
    this.state = {
      example: {},
      label: null,
    };
    this.getNewExample = this.getNewExample.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
  }
  componentDidMount() {
    this.getNewExample();
  }
  getNewExample() {
    const questions = [
      "Which store has 48 locations between South Africa, Mozambique, and Zambia?",
      "When did Walmart declare that it would purchase Massmart?",
      "What is an example of one of the banners in South Africa?",
      "In which African country does it have more than 100 stores?",
      "How many Builders Warehouse locations are there in Mozambique?",
    ];
    const answers = [
      {start: 117, end: 120, tag: "ANS", text: "Builders Express"},
      {start: 2, end: 5, tag: "ANS", text: "September 28"},
      {start: 137, end: 138, tag: "ANS", text: "Cambridge"},
      {start: 80, end: 83, tag: "ANS", text: "South Africa"},
      {start: 132, end: 133, tag: "ANS", text: "33"},
    ];
    const model_answers = [
      {start: 109, end: 110, tag: "AI ANS", color: "#00ffa2", text: "Game"},
      {start: 2, end: 8, tag: "AI ANS", color: "#00ffa2", text: "September 28, 2010"},
      {start: 91, end: 94, tag: "AI ANS", color: "#00ffa2", text: "Game Foodco"},
      {start: 566, end: 567, tag: "AI ANS", color: "#00ffa2", text: "Zambia"},
      {start: 384, end: 385, tag: "AI ANS", color: "#00ffa2", text: "2"},
    ];
    const correct_answers = [
      "valid",
      "invalid_aicorrect",
      "invalid_multiplevalidanswers",
      "valid",
      "invalid_badanswer",
    ];
    const correct_answer_explanations = [
      '',
      'In this case, even though the human answer and AI answer are different, they both refer to the same entity and are both technically correct. You could probably argue that the AI answer is actually better. Therefore, we consider this example as "AI Correct".',
      'Even though the AI is correct, this example has multiple possible different entities as answers.',
      '',
      'It might be worth double checking if the human-provided answer is correct.',
    ];
    this.setState({
      example: {
        "text": questions[this.step],
        "a": answers[this.step].text,
        "model_a": model_answers[this.step].text,
        // "answer_obj": [answers[this.step], model_answers[this.step]],
        "answer_obj": [answers[this.step]],
        "correct_a": correct_answers[this.step],
        "correct_a_explanation": correct_answer_explanations[this.step],
      },
    });
  }
  handleResponse(action) {
    this.setState({ label: action });
    if (this.state.example.correct_a == action) {
      this.props.showOnboardingNext();
    }
  }
  render() {
    var content = (
      <ContextInfo
        answer={this.state.example.answer_obj}
      />
    );
    var answer_correct = <></>;
    if (this.state.label !== null) {
      if (this.state.example.correct_a == this.state.label) {
        answer_correct = (
          <p className="text-success"><b>Correct validation! Please click below.</b></p>
        );
      } else {
        answer_correct = (
          <p className="text-danger"><b>Sorry, your validation is incorrect. Please be extra careful with validation. {this.state.example.correct_a_explanation}</b></p>
        );
      }
    }

    return (
      <Container>
        <Col className="m-auto" lg={12}>
          <Card className="profile-card overflow-hidden">
            <div className="mb-1 p-3 light-gray-bg">
              <h6 className="text-uppercase dark-blue-color spaced-header">
                Context:
              </h6>
              <Card.Body>
                {content}
              </Card.Body>
            </div>
            <Card.Body className="overflow-auto pt-2">
              <Card>
                {this.state.example ? (
                  <>
                    <Card.Body className="p-3">
                      <Row>
                        <Col xs={12}>
                          <div className="mb-3">
                            <h6 className="text-uppercase dark-blue-color spaced-header">
                              Question {this.step + 1} of 5:
                            </h6>
                            <p><b>{this.state.example.text}</b></p>
                          </div>
                        </Col>
                      </Row>
                      <p>A human answered "<b style={{background: "rgba(132, 210, 255, 0.6)"}}>{this.state.example.a}</b>" and the AI answered "<b style={{background: "rgba(0, 255, 162, 0.8)"}}>{this.state.example.model_a}</b>".</p>
                      <p><small>Please validate this example below (kindly refer to the instructions if you are unsure what any of the buttons mean). Remember, for an example to be <b>valid</b>, the human answer needs to be correct and the AI answer (if there is one) needs to be wrong.</small></p>
                    </Card.Body>
                    <Card.Footer>
                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("valid")}
                        type="button"
                        className="btn btn-success btn-sm flex-fill mr-2"
                      >
                        <FaThumbsUp /> Valid
                      </button>{" "}

                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("invalid_badquestion")}
                        type="button"
                        className="btn btn-warning btn-sm flex-fill mr-2"
                      >
                        <FaThumbsDown /> Invalid: <br />Bad Question
                      </button>{" "}

                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("invalid_badanswer")}
                        type="button"
                        className="btn btn-warning btn-sm flex-fill mr-2"
                      >
                        <FaThumbsDown /> Invalid: <br />Bad Human Answer
                      </button>{" "}

                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("invalid_aicorrect")}
                        type="button"
                        className="btn btn-warning btn-sm flex-fill mr-2"
                      >
                        <FaThumbsDown /> Invalid: <br />AI Correct
                      </button>{" "}

                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("invalid_multiplevalidanswers")}
                        type="button"
                        className="btn btn-warning btn-sm flex-fill mr-2"
                      >
                        <FaThumbsDown /> Invalid: <br />Multiple Valid Answers
                      </button>{" "}

                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("invalid_other")}
                        type="button"
                        className="btn btn-warning btn-sm flex-fill mr-2"
                      >
                        <FaThumbsDown /> Invalid: <br />Other
                      </button>{" "}

                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("flag")}
                        type="button"
                        className="btn btn-danger btn-sm flex-fill mr-2"
                      >
                        <FaFlag /> Flag
                      </button>{" "}

                    </Card.Footer>
                    <div style={{backgroundColor: "rgba(0,0,0,.03)"}}>
                      <Col xs={12}>
                        {answer_correct}
                      </Col>
                    </div>
                  </>
                ) : (
                  <Card.Body className="p-3">
                    <Row>
                      <Col xs={12}>
                        <p>No more examples to be validated!</p>
                      </Col>
                    </Row>
                  </Card.Body>
                )}
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Container>
    );
  }
}

export { ValidateInterfaceOnboarding };
