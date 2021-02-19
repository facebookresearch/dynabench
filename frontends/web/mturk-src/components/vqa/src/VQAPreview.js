/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

class VQAPreview extends React.Component {
    render() {
        return (
            <div style={{ width: "100%", height: "100%", backgroundColor: "white" }}>
                {this.props.previewMode === "creation" ? (
                    <div className="mx-5 my-3">
                        <h1>Ask Questions About Images That Fool An AI</h1>
                        <p>
                            In this task, you will be asked to find questions about an image that fool an AI model
                            into answering incorrectly. The AI is reasonably good at understanding English and interpreting images.
                        </p>
                        <p>
                            Given an <b>image</b> that you will use as context, you are expected to
                            do the following:
                        </p>
                        <ol className="mx-5">
                            <li>
                                Write an <b>question</b> based on the image that you think the AI
                                would get <b>wrong</b> but another person would get <b>right</b>.
                            </li>
                            <li>
                                Verify AI's answer:
                                <ul className="mx-3" style={{ listStyleType: "disc" }}>
                                    <li>
                                        If the AI's answer was correct, select the
                                        <b style={{ color: "green" }}> Correct</b> button.
                                    </li>
                                    <li>
                                        If the AI's answer was incorrect, that is, the AI was successfully fooled,
                                        select the <b style={{ color: "red" }}> Incorrect</b> button
                                        and <b>provide the correct answer   </b> for your question.
                                    </li>
                                </ul>
                            </li>
                        </ol>
                        <p>
                            Sometimes AI might be tricky to fool. When you have spent 3
                            tries without success you will be able to skip to the next image by
                            clicking <b style={{ color: "blue" }}>Switch Image</b>.
                        </p>
                        <h3>Completion</h3>
                        <p>
                            The HIT is completed if you successfully <b>fool the model</b> or if you reach <b>10 tries</b>.
                            Any of those events unlock the <b>Submit HIT</b> button, once you click it you will be taken
                            to the next HIT. However you can keep trying to fool the model and get the bonus after
                            the 10 tries are reached.
                        </p>
                        <h3>Reward</h3>
                        <p>
                            On completing the task you will receive $0.12. If you fooled the model
                            and other people agree with your answer you will receive a bonus of $0.35.
                        </p>
                        <h3><strong style={{ color: "red" }}>WARNING:</strong></h3>
                        <p>
                            Every successful question will
                            be checked by other humans. If it is detected that you are spamming the AI or making
                            a bad use of the interface you might be flagged or even blocked.
                        </p>
                        <p>
                            The AI utilizes the latest technologies to understand language and can be very smart. Be creative to fool the AI - it will be fun!!!
                        </p>
                    </div>
                ) : (
                    <div className="mx-5 my-3">
                        <h1>Validate Examples</h1>
                        <p>
                            In this task, you will be asked to validate the examples consisting of an
                            image, a question and an answer. You will have to do the following:
                        </p>
                        <ol className="mx-5">
                            <li>
                                Determine if the question is <b className="dark-blue-color">valid</b>.
                                A question is considered to be valid if:
                                <ul className="mx-3" style={{ listStyleType: "disc" }}>
                                    <li>
                                        The image is required to answer the question.
                                    </li>
                                    <li>
                                        The question can be answered based on the image.
                                    </li>
                                </ul>
                            </li>
                            <li>
                                If it is, determine whether the provided answer is correct.
                            </li>
                        </ol>
                        <p>
                            If you think the example should be reviewed, please click the <b>Flag</b> button
                            and explain why you flagged the example (try to use this sparingly).
                        </p>
                        <h3>Completion</h3>
                        <p>
                            The HIT is completed when you validate 10 examples.
                        </p>
                        <h3>Reward</h3>
                        <p>
                            On completing the task you will receive $0.23.
                        </p>
                    </div>
                )}
            </div>
        )
    }
}

export { VQAPreview }
