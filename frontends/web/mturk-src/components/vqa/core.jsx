/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { CreateVQAMturkInterface } from "./VQAMainTask.js";
import { Row, Button, InputGroup } from 'react-bootstrap';

class VQATaskPreview extends React.Component {
    render() {
        return <>
            <h1>Adversarial Visual Question Answering</h1>
            <p>
                In this task, you will be asked to find examples that fool an AI model
                into making the wrong predictions.
            </p>
        </>
    }
}

class VQATaskOnboarder extends React.Component {
    render() {
        return <>
            <h1>Onboarding</h1>
            <p>Task onboarding</p>
        </>;
    }
}

class VQATaskMain extends React.Component {
    render() {
        return <CreateVQAMturkInterface {...this.props} />;
    }
}

export { VQATaskPreview, VQATaskOnboarder, VQATaskMain };
