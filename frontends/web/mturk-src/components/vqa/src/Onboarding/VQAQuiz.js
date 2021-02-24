/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { VQAQuizCard } from "./VQAQuizCard.js";
import { VQAQuizExamples } from "./Examples/VQAQuizExamples.js"
import { InvalidQuestionCharacteristics } from "../QuestionsCharacteristics.js"
import { WarningMessage } from "../../../../../src/containers/WarningMessage.js";

class VQAQuiz extends React.Component {

    constructor(props) {
        super(props);
        this.MODEL_STATES = { "UNKNOWN" : -1, "CORRECT": 1, "INCORRECT": 0 };
        this.examples = VQAQuizExamples;
        this.minCorrectValidations = 6;
        this.maxAllowedAttempts = 2;
        this.state = this.props.cache || {
            attempt: 1,
            modelState: this.examples[1].map(() => this.MODEL_STATES.UNKNOWN),
            hints: this.examples[1].map(() => ""),
            currentAttemptChecked: false,
            missingAnswers: false,
            showInstructions: true,
            onboardingFailed: false,
        };
    }

    componentDidMount() {
        this.scrollToTop();
    }

    scrollToTop = () => window.scrollTo(0, 0);

    setModelState = (idxToModify, newState) => {
        this.setState({
            modelState: this.state.modelState.map((prevState, idx) => {
                if (idx === idxToModify) { return newState; }
                return prevState;
            })
        })
    }

    checkAnswers = () => {
        let correctValidations = 0;
        let hints = this.examples[this.state.attempt].map((example, index) => {
            if (this.state.modelState[index] != example.isModelCorrect) {
                return example.hint;
            }
            correctValidations += 1;
            return "";
        })
        return { correctValidations, hints };
    }

    missingAnswers = () => this.state.modelState.filter(ans => ans === this.MODEL_STATES.UNKNOWN).length > 0;

    handleCheckAnswersButtonClick = (e) => {
        e.preventDefault();
        if (this.missingAnswers()) {
            this.setState({ missingAnswers: true, currentAttemptChecked: true, })
        } else {
            const { correctValidations, hints } = this.checkAnswers();
            this.setState({
                hints,
                correctValidations,
                currentAttemptChecked: true,
                missingAnswers: false,
            }, () => {
                if (correctValidations >= this.minCorrectValidations) {
                    this.props.setPhaseCompleted();
                } else if (this.state.attempt === this.maxAllowedAttempts) {
                    this.setState({ onboardingFailed: true });
                }
            });
        }
    }

    handleTryAgainButtonClick = () => {
        this.setState({
            attempt: this.state.attempt + 1,
            modelState: this.examples[this.state.attempt + 1].map(() => this.MODEL_STATES.UNKNOWN),
            hints: this.examples[this.state.attempt + 1].map(() => ""),
            currentAttemptChecked: false,
            missingAnswers: false,
            correctValidations: -1,
        }, this.scrollToTop);
    }

    componentWillUnmount() {
        this.props.cacheQuizState(this.state);
    }

    render() {
        let phaseInstructionsButton = <></>;
        if (this.state.showInstructions) {
            phaseInstructionsButton = <button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: false })}}>Hide Instructions</button>
        } else {
            phaseInstructionsButton = <button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: true })}}>Show Instructions</button>
        }
        const phaseTitle = <h4>Quiz - Judge whether a question is valid, and judge{this.props.onboardingMode === "creation" ? " the AI's" : " the corresponding"} answer</h4>
        const phaseInstructions = this.state.showInstructions
            ?
                <div >
                    <p>
                        Now that you have seen examples, let's test your understanding!
                        The first part of this test consists of <b>validating {this.props.onboardingMode === "creation" ? "the AI's" : ""} answers</b>.
                        For every image, question and corresponding{this.props.onboardingMode === "creation" ? " AI" : ""} answer below,
                        tell us if the{this.props.onboardingMode === "creation" ? " AI" : ""} answer was correct or not.
                        The second part consists of <b>validating questions</b>{this.props.onboardingMode === "creation" ? " that the AI receives" : ""}.
                        For every question tell us if it is valid or not. Remember:
                    </p>
                    <InvalidQuestionCharacteristics/>
                    <p>
                        <strong style={{ color: "red" }}>WARNING:</strong>You have to correctly validate
                        at least {this.minCorrectValidations} out of the {this.examples[this.state.attempt].length} examples to unlock the main task.
                        If you fail you will not be able to complete the onboarding.
                    </p>
                </div>
            : <></>
        const content = this.examples[this.state.attempt].map((example, index) =>
            <VQAQuizCard
                imageUrl={example.imageUrl}
                question={example.question}
                answer={example.modelAns}
                isAnswer={example.isAnswer}
                modelState={this.state.modelState[index]}
                hint={this.state.hints[index]}
                disableRadios={this.state.currentAttemptChecked && !this.state.missingAnswers}
                MODEL_STATES={this.MODEL_STATES}
                setModelState={this.setModelState}
                index={index}
                key={index}
            />
        )
        const checkAnswersButton = <button
            className="btn btn-success mb-3 order-1"
            onClick={this.handleCheckAnswersButtonClick}>
                Check Answers
        </button>
        const tryAgainButton = <button
            className="btn btn-warning mb-3 ml-auto order-3"
            onClick={this.handleTryAgainButtonClick}>
                Try Again
        </button>
        const quitOnboardingButton = <button
            className="btn btn-danger mb-3 ml-auto order-3"
            onClick={() => this.props.submitOnboarding({ success: false })}>
                End Task
        </button>
        const finishOnboardingButton = <button
            className="btn btn-success mb-3 ml-auto order-3"
            onClick={() => this.props.submitOnboarding({ success: true })}>
                Finish Onboarding
        </button>
        const resultsMessage = (
            <small className="order-2 mt-2" style={{ color: "#e65959", paddingLeft: 7 }}>
                {this.state.currentAttemptChecked ? (
                    this.state.missingAnswers ? (
                        "*Please select an answer for each example."
                    ) : (
                        `*You got ${this.state.correctValidations} correct answers out of ${this.examples[this.state.attempt].length}.
                        The minimum required is ${this.minCorrectValidations}. ${this.state.onboardingFailed ? "Sorry, you failed the onboarding." : ""}`
                    )
                ) : ""
            }
            </small>
        );
        return (
            <>
                {phaseTitle}
                {phaseInstructionsButton}
                {phaseInstructions}
                <WarningMessage/>
                {content}
                <div className="d-flex justify-content-start" style={{ width: "100%" }}>
                    {resultsMessage}
                    {!this.props.phaseCompleted ? (
                        this.state.currentAttemptChecked && !this.state.missingAnswers ? (
                            this.state.onboardingFailed ? (
                                quitOnboardingButton
                            ) : (
                                tryAgainButton
                            )
                        ) : (
                            checkAnswersButton
                        )
                    ) : (
                        finishOnboardingButton
                    )}
                </div>
            </>
        )
    }
}

export { VQAQuiz };
