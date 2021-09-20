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
    console.log(this.props);
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
      "Q2",
      "Q3",
      "Q4",
      "Q5",
    ];
    const answers = [
      {start: 117, end: 120, tag: "ANS", text: "Builders Express"},
      {start: 4, end: 6, tag: "ANS", text: "A2"},
      {start: 4, end: 6, tag: "ANS", text: "A3"},
      {start: 4, end: 6, tag: "ANS", text: "A4"},
      {start: 4, end: 6, tag: "ANS", text: "A5"},
    ];
    const model_answers = [
      {start: 109, end: 110, tag: "AI ANS", color: "#00ffa2", text: "Game"},
      {start: 4, end: 6, tag: "AI ANS", color: "#00ffa2", text: "MODEL_A2"},
      {start: 4, end: 7, tag: "AI ANS", color: "#00ffa2", text: "MODEL_A3"},
      {start: 4, end: 6, tag: "AI ANS", color: "#00ffa2", text: "MODEL_A4"},
      {start: 4, end: 6, tag: "AI ANS", color: "#00ffa2", text: "MODEL_A5"},
    ];
    this.setState({
      example: {
        "text": questions[this.step],
        "a": answers[this.step].text,
        "model_a": model_answers[this.step].text,
        "answer_obj": [answers[this.step], model_answers[this.step]],
      },
    });
  }
  handleResponse(action) {
    var action_label = null;
    switch (action) {
      case "correct":
        action_label = "C";
        break;
      case "incorrect":
        action_label = "I";
        break;
      case "flag":
        action_label = "F";
        break;
    }
    if (action_label !== null) {
      this.setState({ label: action_label });
    }
  }
  render() {
    var content = (
      <ContextInfo
        answer={this.state.example.answer_obj}
      />
    );

    return (
      <Container className="mb-5 pb-5">
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
                              Question:
                            </h6>
                            <p>{this.state.example.text}</p>
                          </div>
                        </Col>
                      </Row>
                      <p>A human answered "<b style={{background: "rgba(132, 210, 255, 0.6)"}}>{this.state.example.a}</b>" and the AI answered "<b style={{background: "rgba(0, 255, 162, 0.8)"}}>{this.state.example.model_a}</b>".</p>
                      <p>Please validate this example below (kindly refer to the instructions if you are unsure what any of the buttons mean)</p>
                    </Card.Body>
                    <Card.Footer>
                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("valid")}
                        type="button"
                        className="btn btn-success btn-sm mr-2"
                      >
                        <FaThumbsUp /> Valid
                      </button>{" "}
                      
                      <br />

                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("invalid")}
                        type="button"
                        className="btn btn-danger btn-sm mr-2"
                      >
                        <FaThumbsDown /> Invalid: Bad Question
                      </button>{" "}

                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("invalid")}
                        type="button"
                        className="btn btn-danger btn-sm mr-2"
                      >
                        <FaThumbsDown /> Invalid: Bad Answer
                      </button>{" "}

                      <br />

                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("flag")}
                        type="button"
                        className="btn btn-warning btn-sm mr-2"
                      >
                        <FaFlag /> Flag
                      </button>{" "}
                    </Card.Footer>
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
