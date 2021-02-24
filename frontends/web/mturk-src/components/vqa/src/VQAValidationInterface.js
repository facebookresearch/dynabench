/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { AnnotatorInterface } from "../../../../src/containers/AnnotatorInterface.js";
import { KeyboardShortcuts } from "../../../../src/containers/KeyboardShortcuts.js"
import { ValidQuestionCharacteristics } from "./QuestionsCharacteristics.js"
import {
    Container,
    Row,
} from "react-bootstrap";

class VQAValidationInterface extends React.Component {

    constructor(props) {
        super(props);
        this.vqaTaskId = 12;
        this.batchAmount = 10;
        this.userMode = "user";
        this.state = {
            // current task UI state
            showInstructions: false,
        }
    }

    render() {
        const validationInstructions = this.state.showInstructions ? (
            <>
                <p>
                    You will be shown an image and a question. The task consists of two rounds.
                    First, you have to determine if the question is <b className="dark-blue-color">valid</b>.
                </p>
                <p>A question is considered <b>valid</b> if:</p>
                <ValidQuestionCharacteristics/>
                <p>
                    After validating the question, next you will determine whether the provided answer is <b className="dark-blue-color">correct</b>.
                    If you think the example should be reviewed, please click the <b>Flag</b> button and explain why
                    you flagged the example (try to use this sparingly). Please flag if you sense that the person asking the question
                    has a bad intent.
                </p>
                <p>You can also use the key shortcuts to operate:</p>
                <ul className="mx-3" style={{ listStyleType: "disc" }}>
                    <li><b>w:</b> Valid Question.</li>
                    <li><b>s:</b> Invalid Question.</li>
                    <li><b>f:</b> Flag Question.</li>
                    <li><b>a:</b> Incorrect Answer.</li>
                    <li><b>d:</b> Correct Answer.</li>
                    <li><b>j:</b> Toggle Show/Hide Instructions.</li>
                    <li><b>Escape:</b> Clear Selections.</li>
                    <li><b>Enter:</b> Submit Validation.</li>
                </ul>
            </>
        ): (
            <></>
        )


        return (
            <Container>
                <h4>Validate Examples</h4>
                {taskInstructionsButton}
                {validationInstructions}
                <Row>
                    <AnnotatorInterface
                        {...this.props}
                        taskId={this.vqaTaskId}
                        interfaceMode="mturk"
                        batchAmount={this.batchAmount}
                    />
                </Row>
                <KeyboardShortcuts
                    mapKeyToCallback={{
                        "j": {
                            callback: () => this.setState((state, _) => {return { showInstructions: !state.showInstructions }})
                        },
                    }}
                />
            </Container>
        )
    }
}

export { VQAValidationInterface }
