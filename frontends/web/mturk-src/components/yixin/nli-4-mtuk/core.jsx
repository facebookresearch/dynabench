/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

// import { CreateInterface } from '../../CreateInterface.js';
import { NLIWritingInterface } from './NLIWritingInterface.jsx';
// import { CreateInterface } from '../../CreateInterfaceNoModel.js';
import { CreateInterfaceNoModel } from '../../CreateInterfaceNoModel.js';
import { Button } from 'react-bootstrap';
import { NLIR4TaskOnboarder } from './onboarding.jsx'
import { ExampleGoodCards } from "./GoodExampleCards.jsx";


class NLIR4TaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <>
        <h1>Write sentences and fool the AI!</h1>
        <p>You will be trying to <strong>beat an AI at a game</strong>. The AI is trying to understand English.
        </p>
        Given a <strong>passage</strong>, the AI must decide whether a <strong>statement</strong> is:<br />
        <ul>
          <li>Definitely correct; or</li>
          <li>Definitely incorrect; or</li>
          <li>Neither.</li>
        </ul>

        <p>In the game, you see a passage and a category. We would like you to write a statement that belongs to that category and to no other.<br />
        You should write your statements to trick the AI into picking the wrong category.<br />
        After you write your statement, we would also like you to explain:
          <ul>
            <li>Why your statement is definitely correct, definitely incorrect, or neither?</li>
            <li>Why you think the AI might get it wrong?</li>
          </ul>
        </p>
        <p>The AI will tell you what it thinks for each statement you write. Your goal is to fool the AI to pick the wrong category.<br />
            For each passage, you will have multiple chances to write statements util you can fool the AI.</p>

        <p>
        Watch out! You must write statements that fit the category. Whenever one of your statements fools the AI, we will pass that example on to other humans for verification.<br />
        If <strong>all</strong> of them agree <strong>(but the AI is fooled)</strong>, you will receive a <strong>bonus</strong>.<br />
        If you continue to provide good examples, your estimated total pay will be <strong>DOUBLED</strong>.
        </p>

        <p>
        <strong style={{color: "red"}}>Warning:</strong> Please do not spam the HITs, if other humans tend to disagree with your examples, you might be flagged or even blocked.
        </p>

        <p>
            The AI utilizes the latest technologies to understand language and can be very smart. Use your creativity fool the AI - it will be fun!!!
        </p>
        <hr />
        <ExampleGoodCards></ExampleGoodCards>
        {/*<ExampleGoodCards />*/}
      </>;
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
