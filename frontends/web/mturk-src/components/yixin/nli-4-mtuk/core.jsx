/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

import { CreateInterface } from '../../CreateInterface.js';
import { Button } from 'react-bootstrap';
import { NLIR4TaskOnboarder } from './onboarding.jsx'
import {ExampleGoodCards} from "./GoodExampleCards.jsx";


class NLIR4TaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <>
        <h1>Write to fool the AI</h1>
        <p>You will be playing a <strong>game together with an AI system</strong> that checks if a hypothesis is correct given a passage.
        </p>
        Given a <strong>passage</strong>, a <strong>hypothesis</strong> can be either:<br />
        <ul>
          <li>Definitely correct; or</li>
          <li>Definitely incorrect; or</li>
          <li>Neither.</li>
        </ul>
        <p>Your goal is to write a <strong>hypothesis</strong> that belongs to the given category, but that <strong>the AI system gets wrong</strong>.
        You will be given the AI system predictions after each hypothesis.<br />
        Additionally, if the AI is fooled, we would like you to provide <strong>two separated reasons</strong> for:
          <ul>
            <li> Why do you think the hypothesis belongs to the given category?</li>
            <li> Why do you think the AI gives the wrong prediction?</li>
          </ul>
        </p>

        <p>
        For every successful example, we will give your hypothesis to other people for verification.
        If <strong>all</strong> of them agree <strong>(but the AI is fooled)</strong>, you will receive a <strong>bonus</strong>.<br />
        If you can keep providing good examples, your estimated total income will be <strong>DOUBLED</strong>.
        </p>

        <p>
        <strong style={{color: "red"}}>Warning:</strong> Please do not spam the HITs, otherwise you will be flagged and blocked.
        </p>

        <p>Use your creativity to fool the AI - it will be fun!</p>
        <hr />
        <ExampleGoodCards></ExampleGoodCards>
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
    return <CreateInterface api={this.api} {...this.props} />;
  }
}

export { NLIR4TaskPreview, NLIR4TaskOnboarder, NLIR4TaskMain };
