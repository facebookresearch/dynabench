/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { VQAQuizCard } from "./VQAQuizCard.js";
import { VQAQuizExamples } from "./OnboardingInfo/VQAQuizExamples.js"

class VQAQuiz extends React.Component {

    constructor() {
        super();
        this.MODEL_STATES = { "UNKNOWN" : -1, "CORRECT": 1, "INCORRECT": 0 };
        this.examples = VQAQuizExamples;
        this.minCorrectValidations = 5;
        this.attempt = 1;
        this.state = {
            modelState: this.examples[this.attempt].map(() => this.MODEL_STATES.UNKNOWN),
            hints: this.examples[this.attempt].map(() => ""),
            correctValidations: -1,
            showInstructions: true,
        };
    }

    componentDidMount() {
        this.scrollToTop();
    }

    handleLastChanceButtonClick = () => {
        this.attempt += 1;
        this.setState({
            modelState: this.examples[this.attempt].map(() => this.MODEL_STATES.UNKNOWN),
            hints: this.examples[this.attempt].map(() => ""),
            correctValidations: -1,
        }, this.scrollToTop());
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

    checkAnswers = (e) => {
        e.preventDefault();
        let correctValidations = 0;
        let updatedHints = this.examples[this.attempt].map((example, index) => {
            if (this.state.modelState[index] != example.isModelCorrect) {
                if (this.state.modelState[index] === this.MODEL_STATES.UNKNOWN) {
                    return "Please select an answer."
                }
                return example.hint;
            }
            correctValidations += 1;
            return "";
        })
        if (this.attempt > 1 && correctValidations < this.minCorrectValidations) {
            this.props.onSubmit({ status: false });
        } else if (correctValidations >= this.minCorrectValidations) {
            this.props.setBlockPrevPhase(false);
            this.props.setPhaseCompleted();
            this.props.nextPhase();
        } else {
            this.props.setBlockPrevPhase(true);
        }
        this.setState({
            hints: updatedHints,
            correctValidations
        })
    }

    render() {
        let phaseInstructionsButton = <></>;
        if (this.state.showInstructions) {
            phaseInstructionsButton = <button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: false })}}>Hide Instructions</button>
        } else {
            phaseInstructionsButton = <button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: true })}}>Show Instructions</button>
        }
        const phaseTitle = <h4>Quiz - Judge whether a question needs the image to answer, and judge the AI's answer</h4>
        const phaseInstructions = this.state.showInstructions
            ?
                <div >
                    <p>
                        Now that you have seen examples, let's test your understanding!
                        The first part of this test consists of <b>validating the AI's answers</b>.
                        For every image, question and corresponding AI answer below, tell us if the AI answer was correct or not.
                        The second part consists of <b>validating the questions</b> that the AI receives.
                        For every question tell us if it is valid or not.

                    </p>
                    <p>
                        <strong style={{ color: "red" }}>WARNING:</strong>You have to correctly validate
                        at least {this.minCorrectValidations} out of the {this.examples[this.attempt].length} examples to unlock the final phase.
                        You will have two tries to complete this activity. If you fail you will not be able to
                        complete the onboarding.
                    </p>
                </div>
            : <></>
        const content = this.examples[this.attempt].map((example, index) =>
            <VQAQuizCard
                imageUrl={example.imageUrl}
                question={example.question}
                answer={example.modelAns}
                isAnswer={example.isAnswer}
                modelState={this.state.modelState[index]}
                hint={this.state.hints[index]}
                disableRadios={this.state.correctValidations >= 0}
                MODEL_STATES={this.MODEL_STATES}
                setModelState={this.setModelState}
                index={index}
                key={index}
            />
        )
        const completePhaseButton = <button
            className="btn btn-success mb-3"
            onClick={this.checkAnswers}>
                Complete Phase
        </button>
        const lastChanceButton = <button
            className="btn btn-warning mb-3"
            onClick={this.handleLastChanceButtonClick}>
                Take last chance
        </button>
        return (
            <>
                {phaseTitle}
                {phaseInstructionsButton}
                {phaseInstructions}
                {content}
                {this.state.correctValidations >= 0 ?
                    <div className="d-flex justify-content-between" style={{ width: "100%" }}>
                        <small style={{ color: "#e65959", paddingLeft: 7 }}>
                            *You got {this.state.correctValidations} correct validations out of {this.examples[this.attempt].length}.
                            The minimum required is {this.minCorrectValidations}.
                        </small>
                        {lastChanceButton}
                    </div> : <>
                        {completePhaseButton}
                    </>}
            </>
        )
    }
}

export { VQAQuiz };
