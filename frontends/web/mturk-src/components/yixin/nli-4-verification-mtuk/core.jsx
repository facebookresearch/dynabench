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
import { NLIR4VTaskOnboarder } from './onboarding.jsx'
import { ExampleGoodCards } from "./GoodExampleCards.jsx";


class NLIR4VTaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <>
        <h1>Read, Reason, and Then Choose.</h1>
        <p></p>
        Given a <strong>passage</strong>, a <strong>statement</strong> can be:<br />
        <ul>
          <li>Definitely correct; or</li>
          <li>Definitely incorrect; or</li>
          <li>Neither.</li>
        </ul>

        <p>In the task, you see a passage and a statement. We would like you to pick the correct category after reading and fully understand the text.</p>

        <p>We would also like you to tell us how confident you are regarding your answer.</p>

        <p>
        <strong style={{color: "red"}}>Warning:</strong> Please do not spam the HITs, if other humans tend to disagree with your answer, you might be flagged or even blocked.
        </p>

        <hr />
        <ExampleGoodCards></ExampleGoodCards>
        {/*<ExampleGoodCards />*/}
        </>;
  }
}

class NLIR4VTaskMain extends React.Component {
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

export { NLIR4VTaskPreview, NLIR4VTaskOnboarder, NLIR4VTaskMain };
