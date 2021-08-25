/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Button } from "react-bootstrap";

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

class ExampleGoodCards extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      curExample: null,
      show: false,
    };

    this.data = [
      {
        passage:
          "I found out my cat is pregnant. I had no idea why she was making all these funny noises. She would hide a lot under my bed. A friend told me this behavior was of a pregnant animal. I cannot wait to see the kittens.",
        hypothesis: "The woman is pregnant and has a cat.",
        targetLabel: 1,
        modelPrediction: [0.8643, 0.0032, 0.1325],
        labelExplanation:
          "First of all, there is no woman in the passage. We cannot assume that the person is a woman. Secondly, the person does have a cat, but it is not known whether the person is pregnant or not. The passage only states that the cat might be pregnant.",
        modelExplanation:
          'The passage and statement have a lot of word overlap. The AI might not be able to understand which entity is pregnant. This might make the AI believe that the statement is "definitely correct".',
      },
      {
        passage:
          "The 2015 Red Bull Air Race of Fort Worth was the seventh round of the 2015 Red Bull Air Race World Championship season, the tenth season of the Red Bull Air Race World Championship. The event was held at the Texas Motor Speedway in Fort Worth, Texas.",
        hypothesis:
          "The Red Bull Air Race of Fort Worth was first held in Texas in 2015. The Air Race was never held in Texas prior to that.",
        targetLabel: 1,
        modelPrediction: [0.997954, 0.001679135, 0.000366835884],
        labelExplanation:
          "The passage states that the 2015 Red Bull Air Race of Fort Worth was held in Fort Worth, Texas. But it didn’t say whether the race has been held in Fort Worth, Texas previously. It is possible that the 2014 Red Bull Air Race also took place in Fort Worth, Texas. Therefore, we cannot be certain about whether 2015 is the first time.",
        modelExplanation:
          "I tried to reuse words in the passage so the AI will think the statement paraphrases the passage,  and then should be ‘definitely correct’. I don’t think the AI is able to reason about the time. It doesn’t know that some events like Air Race can be held twice or three times in the same city or state. Or maybe the AI just doesn’t know that cities can host competitions or exhibitions.",
      },
      {
        passage:
          "The 2015 Red Bull Air Race of Fort Worth was the seventh round of the 2015 Red Bull Air Race World Championship season, the tenth season of the Red Bull Air Race World Championship. The event was held at the Texas Motor Speedway in Fort Worth, Texas.",
        hypothesis: "There is no airport in Fort Worth, Texas.",
        targetLabel: 2,
        modelPrediction: [0.00020863, 0.93687433, 0.062917076],
        labelExplanation:
          "Since an Air Race happened in Fort Worth, there must be an airport in the city. An Air Race is a race between airplanes and airplanes only race in the air and must land in airports. It is also a fact that Dallas/Fort Worth Airport exists.",
        modelExplanation:
          "I write the statement by first thinking about what facts are needed for the event described in the passage to happen. A city needs an airport to be able to hold the Red Bull Air Race. Then, I negated that fact to create a statement that is definitely incorrect. The AI might not know what is required for an Air Race to happen. It also might not know what an Air Race is.",
      },
      {
        passage:
          "The 2015 Red Bull Air Race of Fort Worth was the seventh round of the 2015 Red Bull Air Race World Championship season, the tenth season of the Red Bull Air Race World Championship. The event was held at the Texas Motor Speedway in Fort Worth, Texas.",
        hypothesis:
          "In 2014, the Blue Air Race happened in Texas. In 2015, the Red Bull Air Race happened in Texas. What a coincidence!",
        targetLabel: 1,
        modelPrediction: [
          0.9782385826,
          0.0136522576212883,
          0.008109178394079208,
        ],
        labelExplanation:
          "The passage doesn’t say anything about what happened in 2014 and doesn’t mention any Blue Air Race. It is possible though that there was a Blue Air Race in 2014 and it is also possible it took place in Texas. But since we don’t know for sure, the statement cannot be correct or incorrect.",
        modelExplanation:
          "I wrote an uncertain sentence first and then wrote a certainly correct sentence afterwards to try to confuse the model. The AI might think that the entire statement is correct simply because the second sentence in the statement is correct. The AI probably won’t know that all the facts in the statement need to be correct based on the passage for the whole statement to be correct.",
      },
      {
        passage:
          "The 2015 Red Bull Air Race of Fort Worth was the seventh round of the 2015 Red Bull Air Race World Championship season, the tenth season of the Red Bull Air Race World Championship. The event was held at the Texas Motor Speedway in Fort Worth, Texas.",
        hypothesis: "People will look up to the sky during the event.",
        targetLabel: 0,
        modelPrediction: [
          0.007144447881728411,
          0.9927288889884949,
          0.00012666970724239945,
        ],
        labelExplanation:
          "When people go to see an Air Race, they plan  to watch airplanes. Since airplanes fly in the sky, people watching them will definitely look up to the sky.",
        modelExplanation:
          "The AI might not understand what people plan to do when they watch an air race and also might not know what an air race is. The AI might wrongly determine that the passage and the statement are unrelated because there is almost no word overlap between the two.",
      },
      {
        passage:
          "Kota Ramakrishna Karanth was an Indian lawyer and politician. He was the elder brother of noted Kannada novelist K. Shivarama Karanth.",
        hypothesis:
          "Kota Ramakrishna Karanth has a brother who was both a novelist and a politician.",
        targetLabel: 2,
        modelPrediction: [0.9947, 0.0004, 0.0049],
        labelExplanation:
          "Kota Ramakrishna Karanth is a politician and has a brother who was a novelist. But we’re not sure whether the brother is a politician or not. Therefore, the statement is neither correct nor incorrect.",
        modelExplanation:
          'The passage states that Kota Ramakrishna Karanth is a politician and his brother is a novelist. The AI might not be able to understand the grammar and mistakenly thinks that since the passage contains both "politician" and "novelist" then the statement is correct.',
      },
    ];

    this.label_mappiing = {
      0: "definitely correct",
      1: "neither definitely correct nor definitely incorrect",
      2: "definitely incorrect",
    };
  }

  showExample = () => {
    const randomIndex = getRandomInt(this.data.length);
    this.setState({
      curExample: this.data[randomIndex],
      show: true,
    });
    // console.log(this)
    // console.log(this.state)
    // randomly pick one example
  };

  render() {
    const showExampleButtonText = this.state.show
      ? "Next Example"
      : "Show Example";
    const showExampleButton = (
      <Button
        className="btn btn-primary btn-success"
        onClick={this.showExample}
      >
        {showExampleButtonText}
      </Button>
    );
    const hideExampleButton = (
      <Button
        className="btn btn-primary btn-success"
        onClick={() => this.setState({ show: false, curExample: null })}
      >
        Hide Example
      </Button>
    );

    let curExamplePanel = <div></div>;
    if (this.state.curExample !== null) {
      curExamplePanel = (
        <div className="card">
          <div className="card-body">
            <div className="card-text">
              <p>
                <strong>Passage:</strong>
                <br />{" "}
                <span style={{ color: "blue" }}>
                  {this.state.curExample.passage}
                </span>
              </p>
            </div>
            <div className="card-text">
              <p>
                Based on the passage, write a <strong>statement</strong> that is{" "}
                <em>
                  {this.label_mappiing[this.state.curExample.targetLabel]}
                </em>
                :<br />{" "}
                <span style={{ color: "red" }}>
                  <u>{this.state.curExample.hypothesis}</u>
                </span>
              </p>
            </div>
            <div className="card-text">
              <p>
                <strong>
                  Why do you think the statement is{" "}
                  <em>
                    {this.label_mappiing[this.state.curExample.targetLabel]}
                  </em>
                  ?:
                </strong>
                <br />{" "}
                <span style={{ color: "red" }}>
                  <u>{this.state.curExample.labelExplanation}</u>
                </span>
              </p>
            </div>
            <div className="card-text">
              <p>
                <strong>Why do you think the AI might get it wrong?:</strong>
                <br />{" "}
                <span style={{ color: "red" }}>
                  <u>{this.state.curExample.modelExplanation}</u>
                </span>
              </p>
            </div>

            <div className="card-text">
              <p>
                <strong>The AI thinks that the statement is:</strong>
                <div style={{ color: "blue" }}>
                  <ul>
                    <li>
                      Definitely Correct:{" "}
                      {(this.state.curExample.modelPrediction[0] * 100).toFixed(
                        2
                      )}{" "}
                      %
                    </li>
                    <li>
                      Definitely Incorrect:{" "}
                      {(this.state.curExample.modelPrediction[2] * 100).toFixed(
                        2
                      )}{" "}
                      %
                    </li>
                    <li>
                      Neither:{" "}
                      {(this.state.curExample.modelPrediction[1] * 100).toFixed(
                        2
                      )}{" "}
                      %
                    </li>
                  </ul>
                </div>
              </p>
            </div>
          </div>
          <div className="card-text text-muted">
            The text in the <span style={{ color: "blue" }}>blue</span> is what
            you will be provided in the HITs.
            <br />
            The text in the <span style={{ color: "red" }}>red</span>{" "}
            <u>is what we would like you to write.</u>
            <br />
            Please follow the instructions in the HITs and give the responses
            according.
          </div>
        </div>
      );
    }

    return (
      <React.Fragment>
        <h3>Get Help</h3>
        <div>
          AI can be very clever. Get help by clicking the "Show Example" below
          to see good examples. We hope that the examples can help you
          understand the task and get inspired if you find it hard to fool the
          AI.
        </div>
        {showExampleButton}&nbsp;&nbsp;{hideExampleButton}
        {curExamplePanel}
      </React.Fragment>
    );
  }
}

export { ExampleGoodCards };
