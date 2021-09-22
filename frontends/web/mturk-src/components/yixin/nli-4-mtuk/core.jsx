/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

// import { CreateInterface } from '../../CreateInterface.js';
import { NLIWritingInterface } from "./NLIWritingInterface.jsx";
// import { CreateInterface } from '../../CreateInterfaceNoModel.js';
import { CreateInterfaceNoModel } from "../../CreateInterfaceNoModel.js";
import { Button } from "react-bootstrap";
import { NLIR4TaskOnboarder } from "./onboarding.jsx";
import { ExampleGoodCards } from "./GoodExampleCards.jsx";

class NLIR4TaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <>
        <h1>Write sentences and fool the AI!</h1>
        <p>
          You will be playing a <strong>game together with an AI</strong> that
          is trying to understand English and decide whether a statement is
          correct.
        </p>
        Given a <strong>passage</strong>, a <strong>statement</strong> can be
        either:
        <br />
        <ul>
          <li>Definitely correct; or</li>
          <li>Definitely incorrect; or</li>
          <li>Neither.</li>
        </ul>
        <p>
          In the game, you will be given a passage and we would like you to
          write a statement that belongs to a given category above.
          <br />
          We would also like you to explain:
          <ul>
            <li>
              Why do you think the statement is definitely correct, definitely
              incorrect, or neither?
            </li>
            <li>Why do you think the AI might get it wrong?</li>
          </ul>
        </p>
        <p>
          The AI will tell you what it thinks for each statement you write. Your
          goal is to fool the AI to get it wrong. For each passage, you will
          have multiple chances to write statements util you can fool the AI.
        </p>
        <p>
          For every successful statement, we will give your statement to other
          humans for verification. <br />
          If <strong>all</strong> of them agree{" "}
          <strong>(but the AI is fooled)</strong>, you will receive a{" "}
          <strong>bonus</strong>.<br />
          If you can keep providing good examples, your estimated total income
          will be <strong>DOUBLED</strong>.
        </p>
        <p>
          <strong style={{ color: "red" }}>Warning:</strong> Please do not spam
          the HITs, if other humans tend to disagree with your inputs, you might
          be flagged and even blocked.
        </p>
        <p>
          The AI utilizes the latest technologies to understand language and can
          be very smart. Be creative to fool the AI - it will be fun!!!
        </p>
        <hr />
        <ExampleGoodCards></ExampleGoodCards>
        {/*<ExampleGoodCards />*/}
      </>
    );
  }
}

class NLIR4TaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    console.log(props);
  }

  render() {
    // return <CreateInterface api={this.api} {...this.props} />;
    return <NLIWritingInterface api={this.api} {...this.props} />;
    // return <CreateInterfaceNoModel api={this.api} {...this.props} />;
  }
}

export { NLIR4TaskPreview, NLIR4TaskOnboarder, NLIR4TaskMain };
