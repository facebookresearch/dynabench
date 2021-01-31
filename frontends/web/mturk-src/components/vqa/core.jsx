/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

import { CreateInterface } from '../CreateInterface.js';
import { CreateInterfaceNoModel } from '../CreateInterfaceNoModel.js';
import { VQAExamples } from "./VQAExamples.js"

class VQATaskPreview extends React.Component {

    render() {
        const previewText = <>
            <h1>Adversarial Visual Question Answering</h1><br/>
            <p>
                In this task, you will be asked to find questions that fool an AI model
                into making the wrong predictions. The AI is able to understand English
                and interpret images using commonsense.
            </p>
            <p>
                Given an <b>image</b> that you will use as context, you are expected to
                do the following:
            </p>
            <ol className="mx-5">
                <li>
                    Make a <b>question</b> based on the image that you think the AI
                    would get <b>wrong</b> but another person would get <b>right</b>.
                </li>
                <li>
                    Verify AI's predictions:
                    <ul className="mx-3" style={{ listStyleType: "disc" }}>
                        <li>
                            If the AI made a correct prediction, select the
                            <b style={{ color: "green" }}> Correct</b> button.
                        </li>
                        <li>
                            If the AI was successfully fooled, select the
                            <b style={{ color: "red" }}> Incorrect</b> button
                            and <b>provide the correct answer   </b> for your question.
                        </li>
                    </ul>
                </li>
            </ol>
            <p>
                Sometimes AI might be tricky to fool, you can change the image by
                clicking <b style={{ color: "blue" }}>Switch Image</b>.
            </p>
            <p>
                You will have <b>10 tries</b> to fool the AI. If you succeed earlier you complete a HIT.
            </p>
            <p>
                <strong style={{ color: "red" }}>WARNING:</strong> Every successful question will
                be checked by other humans. If it is detected that you are spamming the AI or making
                a bad use of the interface you might be flagged or even blocked.
            </p>
            <p>
                The AI utilizes the latest technologies to understand language and can be very smart. Be creative to fool the AI - it will be fun!!!
            </p>
        </>
        return (
            <div className="m-5">
                {previewText}
                <VQAExamples/>
            </div>
        )
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
        if (this.props.mephistoWorkerId % 2 == 0) {
            return <CreateInterface {...this.props} />;
        }
        else { return <CreateInterfaceNoModel {...this.props} />; }
    }
}

export { VQATaskPreview, VQATaskOnboarder, VQATaskMain };
