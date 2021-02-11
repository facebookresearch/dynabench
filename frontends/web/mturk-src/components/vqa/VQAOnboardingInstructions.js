/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

class VQAOnboardingInstructions extends React.Component {

    render() {
        return <div>
            <h4 className="my-3" style={{ textAlign: "center" }}>Qualification Phase</h4>
            <p>
                You will be asked to find questions about images that fool an AI model
                into answering incorrectly. The AI is reasonably good at understanding
                English and interpreting images.
            </p>
            <p>
                This is your first time working on this task and we would like you to
                take a quick qualification test. When you have passed the test you will
                be able to work on the main task. The process consists of <b>three phases</b>.
            </p>
            <ol className="mx-5">
                <li>
                    Viewing some examples of valid and invalid questions.
                </li>
                <li>
                    Judging whether a question is valid and judging the AI's answers.
                </li>
                <li>
                    Asking questions to fool the AI.
                </li>
            </ol>
            <p>
                You will find specific instructions and descriptions in each phase.
                Every time you complete one of the phases a button to switch to the
                <b style={{color: "green"}}> Next Phase</b> will be unlocked and you
                will be able to proceed. You can go back anytime you
                want by clicking the <b style={{color: "blue"}}>Previous Phase </b>
                button. Good Luck!
            </p>
        </div>
    }
}

export { VQAOnboardingInstructions };
