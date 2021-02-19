/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AtomicImage from "../../../../src/containers/AtomicImage.js";
import CheckVQAModelAnswer from "../../../../src/containers/CheckVQAModelAnswer.js";
import { VQAFeedbackCard } from "./VQAFeedbackCard.js";
import { KeyboardShortcuts } from "../../../../src/containers/KeyboardShortcuts.js"
import {
    Alert,
    Container,
    Row,
    Card,
    CardGroup,
    Button,
    FormControl,
    InputGroup
 } from 'react-bootstrap';

class CreateVQAMturkInterface extends React.Component {

    constructor(props) {
       super(props);
       this.api = props.api;
       this.minTriesToSwitchImg = 3;
       this.minTriesToCompleteHIT = 10;
       this.state = {
           task: {},
           context: {},
           // responseContent is used to store info about the examples in current context
           // provided by the turker/user, keys that start with `uiSettings_` handles
           // ui display settings. `uiSettings_` keys should be removed when logging
           // to the DB.
           responseContent: [],
           // history stores first the context info (about the image), and then a series
           // of example questions provided, then keeps storing the context info about the
           // next image and the series of example questions on the new image (if the user clicks skip)
           history: [],
           question: "",
           comments: "",
           totalTriesSoFar: 0,
           triesInContext: 0,
           submitDisabled: true,
           refreshDisabled: true,
           fooled: "unknown",
           taskCompleted: false,
           fetchPredictionError: false,
           showErrorAlert: false,
           showInstructions: false,
       };
       this.storeExample = this.storeExample.bind(this);
       this.getNewContext = this.getNewContext.bind(this);
       this.getModelResponseAndStoreExample = this.getModelResponseAndStoreExample.bind(this);
       this.removeLastResponseFromContent = this.removeLastResponseFromContent.bind(this);
       this.handleKeyPress = this.handleKeyPress.bind(this);
       this.handleQuestionChange = this.handleQuestionChange.bind(this);
       this.handleSubmitCorrectAnswer = this.handleSubmitCorrectAnswer.bind(this);
       this.handleCheckAnswerButtonClick = this.handleCheckAnswerButtonClick.bind(this);
       this.handleKeyPress = this.handleKeyPress.bind(this);
       this.handleCommentsChange = this.handleCommentsChange.bind(this);
       this.submitHIT = this.submitHIT.bind(this);
       this.setModelState = this.setModelState.bind(this);
       this.resetStateToContext = this.resetStateToContext.bind(this);
       this.updateStateGivenUserFeedback = this.updateStateGivenUserFeedback.bind(this);
       this.bottomAnchorRef = React.createRef();
       this.inputRef = React.createRef();
    }

    componentDidMount() {
        this.api.getTask(this.props.taskConfig.task_id)
        .then(result => {
            this.setState({ task: result, showErrorAlert: false }, () => {
                this.getNewContext();
            });
        },  error => {
            this.setState({ showErrorAlert: true });
            console.log(error);
        });
    }

    getHistoryWithCurrentExamples() {
        return [...this.state.history, ...this.getResponseContentForDB(this.state.responseContent)]
    }

    getResponseContentForDB(responseContent) {
        return responseContent.map(response => {
            return  Object.keys(response).reduce(function (filtered, key) {
                if (!key.startsWith("uiSettings")) {
                    filtered[key] = response[key];
                }
                return filtered;
            }, {})
        })
    }

    getTagList() {
        return this.props.taskConfig.context_tags.split(",")
    }

    resetStateToContext(newContext) {
        const history = this.getHistoryWithCurrentExamples()
        const unitContent = [{ cls: 'context', text: newContext.context, id: newContext.id, tag: newContext.tag }]
        this.setState({
            history: [...history, unitContent],
            context: newContext,
            responseContent: [],
            question: "",
            fetchPredictionError: false,
            triesInContext: 0,
            submitDisabled: false,
            refreshDisabled: false,
            showErrorAlert: false,
            fooled: "unknown",
        })
    }

    focusTextInput = (isEnterQuestionAllowed) => {
        if (isEnterQuestionAllowed && this.inputRef.current) {
            this.inputRef.current.focus();
        }
    }

    blurTextInput = () => {
        if (this.inputRef.current) {
            this.inputRef.current.blur();
        }
    }

    skipImage = (isSkipImageAllowed) => {
        if (isSkipImageAllowed) {
            this.getNewContext();
        }
    }

    getNewContext() {
        this.setState({ submitDisabled: true, refreshDisabled: true }, () => {
            this.api.getRandomContext(
                this.props.taskConfig.task_id,
                this.state.task.cur_round,
                this.getTagList(),
            )
            .then(result => {
                this.resetStateToContext(result);
            }, error => {
                this.setState({ showErrorAlert: true });
                console.log(error);
            });
        });
    }

    handleKeyPress(e) {
        if (e.key.toLowerCase() === "enter" && !this.state.submitDisabled) {
            this.handleCheckAnswerButtonClick();
        }
    }

    handleCommentsChange(e) {
        this.setState({ comments: e.target.value });
    }

    removeLastResponseFromContent() {
        const idxToRemove = this.state.responseContent.length - 1;
        const updatedContent = this.state.responseContent.filter((_, idx) => idx !== idxToRemove);
        this.setState({
            submitDisabled: false,
            refreshDisabled: false,
            fetchPredictionError: true,
            question: "",
            responseContent: updatedContent,
        });
    }

    updateLastResponse(updates) {
        let idx = this.state.responseContent.length - 1
        let updatedContent = this.state.responseContent;
        updatedContent[idx] = {
            ...updatedContent[idx],
            ...updates
        }
        return updatedContent;
    }

    storeExample(modelResponse) {
        const metadata = {
            'annotator_id': this.props.providerWorkerId,
            'mephisto_id': this.props.mephistoWorkerId,
            'model': 'MovieMCAN',
            'agentId': this.props.agentId,
            'assignmentId': this.props.assignmentId,
            'tag': this.state.context.tag,
        };
        modelResponse.prob = [modelResponse.prob, 1 - modelResponse.prob];
        this.api.storeExample(
            this.state.task.id,
            this.state.task.cur_round,
            'turk',
            this.state.context.id,
            this.state.question.trim(),
            null,
            modelResponse,
            metadata
        )
        .then(newExample => {
            let updatedContent = this.updateLastResponse({
                id: newExample.id,
                cid: this.state.context.id
            })
            this.setState({
                question: "",
                showErrorAlert: false,
                responseContent: updatedContent,
            });
        }, error => {
            this.setState({ showErrorAlert: true });
            console.log(error);
        });
    }

    getModelResponseAndStoreExample() {
        const modelInputs = {
            image_url: this.state.context.context,
            question: this.state.question,
            insight: false,
        };
        this.api.getModelResponse(this.state.task.round.url, modelInputs)
        .then(modelResponse => {
            if (modelResponse.errorMessage) {
                this.removeLastResponseFromContent();
            } else {
                let updatedContent = this.updateLastResponse({
                    text: this.state.question,
                    modelPredStr: modelResponse.answer,
                    modelResponse: modelResponse,
                    uiSettings_loadingResponse: false,
                    tag: this.state.context.tag,
                })
                this.setState({
                    responseContent: updatedContent,
                    fetchPredictionError: false,
                    showErrorAlert: false,
                }, () => {
                    this.storeExample(modelResponse);
                });
            }
        }, error => {
            this.setState({ showErrorAlert: true });
            console.log(error);
        });
    }

    handleCheckAnswerButtonClick() {
        if (this.state.question.trim().length === 0) { return; }
        this.setState({
           submitDisabled: true,
           refreshDisabled: true,
           responseContent: [
               ...this.state.responseContent, {
                    cls: "hypothesis",
                    fooled: "unknown",
                    uiSettings_feedbackSaved: null,
                    uiSettings_retracted: false,
                    uiSettings_flagged: false,
                    uiSettings_loadingResponse: true,
                }
            ]
        }, () => {
            this.smoothlyAnimateToBottom();
            this.getModelResponseAndStoreExample();
        });
    }

    handleQuestionChange(e) {
       this.setState({ question: e.target.value });
    }

    updateStateGivenUserFeedback(idx, correctAnswer, fooled) {
        let updatedContent = this.state.responseContent;
        updatedContent[idx] = {
            ...updatedContent[idx],
            fooled: fooled,
            correctAnswer: correctAnswer,
            uiSettings_feedbackSaved: true
        }
        this.setState({
            responseContent: updatedContent,
            totalTriesSoFar: this.state.totalTriesSoFar + 1,
            triesInContext: this.state.triesInContext + 1,
            fooled: fooled,
            submitDisabled: false,
            refreshDisabled: false,
            showErrorAlert: false,
        }, () => {
            if (fooled === "yes" || this.state.totalTriesSoFar >= this.minTriesToCompleteHIT) {
                this.setState({ taskCompleted: true });
            }
        })
    }

    handleSubmitCorrectAnswer(correctAnswer, fooled) {
        let idx = this.state.responseContent.length - 1;
        let updatedContent = this.state.responseContent;
        updatedContent[idx]["uiSettings_feedbackSaved"] = false;
        this.setState({ responseContent: updatedContent }, () => {
            this.api.updateExample(updatedContent[idx].id, correctAnswer, fooled === "yes", this.props.providerWorkerId)
            .then((result) => {
                this.updateStateGivenUserFeedback(idx, correctAnswer, fooled);
            }, (error) => {
                this.setState({ showErrorAlert: true });
                console.log(error);
            });
        })
    }

    submitHIT() {
        let history = this.getHistoryWithCurrentExamples()
        history = [...history, { cls: "comment", text: this.state.comments }];
        this.props.onSubmit(history);
        this.setState({
            history: [],
            responseContent: []
        })
    }

    setModelState(fooled) {
        let updatedContent = this.updateLastResponse({fooled: fooled})
        this.setState({ responseContent: updatedContent }, () => {
            if (fooled === "yes") {
                this.smoothlyAnimateToBottom();
            }
        });
    }

    smoothlyAnimateToBottom() {
        if (this.bottomAnchorRef.current) {
          this.bottomAnchorRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }

    render() {
        let taskTrackerMessage = "";
        if (this.state.fooled === "yes") {
            taskTrackerMessage = "Congratulations! You fooled the model and got the bonus.";
        } else if (this.state.totalTriesSoFar >= this.minTriesToCompleteHIT) {
            taskTrackerMessage = "Minimum required tries completed. You can continue to get the bonus.";
        } else {
            taskTrackerMessage = ` Tries: ${this.state.totalTriesSoFar} / ${this.minTriesToCompleteHIT}.`
        }
        const taskTracker = <small style={{ padding: 9 }}>{taskTrackerMessage}</small>;
        const topInstruction = <>
            <h4>Ask questions and fool the AI</h4>
        </>
        let taskInstructionsButton = <></>
        if (this.state.showInstructions) {
            taskInstructionsButton = <Button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: false })}}>Hide Instructions</Button>
        } else {
            taskInstructionsButton = <Button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: true })}}>Show Instructions</Button>
        }
        const taskInstructions = this.state.showInstructions && (
            <>
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
                        Write a <b style={{ color: "red" }}>valid question</b> based on the image that you think the AI
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
                                select the  <b style={{ color: "red" }}>Incorrect</b> button
                                and <b>provide the correct answer</b> for your question.
                            </li>
                        </ul>
                    </li>
                </ol>
                <p>You can also use the key shortcuts to operate:</p>
                <ul className="mx-3" style={{ listStyleType: "disc" }}>
                    <li><b>i:</b> Focus text box.</li>
                    <li><b>Enter:</b> Check answer.</li>
                    <li><b>Escape:</b> Blur text box.</li>
                    <li><b>s:</b> Show Instructions.</li>
                    <li><b>h:</b> Hide Instructions.</li>
                    <li><b>Arrow Up:</b> Correct.</li>
                    <li> <b>Arrow Down:</b> Incorrect.</li>
                </ul>
                <p>
                    Sometimes AI might be tricky to fool. When you have spent {this.minTriesToSwitchImg} tries
                    without success you will be able to skip to the next image by clicking <b style={{ color: "blue" }}>Switch Image</b> button.
                </p>
                <p>
                    You will have <b>{this.minTriesToCompleteHIT} tries</b> to fool the AI. If you succeed earlier you complete a HIT.
                </p>
                <p>
                    You will have to complete at least <b>{this.minTriesToCompleteHIT} tries</b>. You can continue if you want to.
                    Once you feel comfortable, move on.
                </p>
                <p>
                    <strong style={{ color: "red" }}>WARNING:</strong> Every successful question will
                    be checked by other humans. If it is detected that you are spamming the AI or making
                    a bad use of the interface you might be flagged or even blocked.
                </p>
                <p>
                    The AI can be very smart as it utilizes the latest technologies to understand the
                    question and image. Be creative to fool the AI - it will be fun!!!
                </p>
            </>
        )
        const contextContent = this.state.context && <AtomicImage src={this.state.context.context} maxHeight={600} maxWidth={900}/>
        const responseInfo = this.state.responseContent.map((response, idx) => {
            let classNames = "hypothesis rounded border";
            let feedbackContent = <></>;
            if (response.fooled === "no") {
                classNames += " response-warning";
                feedbackContent =
                    <span>
                        <strong>Try again!</strong> AI answered <strong>{response.modelPredStr}</strong>
                    </span>
            } else if (response.fooled === "yes" && response.uiSettings_feedbackSaved) {
                classNames += " light-green-bg";
                feedbackContent = (
                    <span>
                        <strong>You fooled the model!</strong> It predicted <strong>{response.modelPredStr}</strong>{" "}
                        but a person would say <strong>{response.correctAnswer}</strong>
                    </span>
                )
            } else {
                classNames += " bg-light";
                feedbackContent = (
                    <CheckVQAModelAnswer
                        modelPredStr={response.modelPredStr}
                        fooled={response.fooled}
                        loadingResponse={response.uiSettings_loadingResponse}
                        feedbackSaved={response.uiSettings_feedbackSaved}
                        updateExample={this.handleSubmitCorrectAnswer}
                        setModelState={this.setModelState}
                    />
                 )
            }
            return (
                <div key={idx} className={classNames}>
                    <div>{response.text}</div>
                    <small>
                        {feedbackContent}
                    </small>
                </div>
            )
        });

        const fooled = this.state.fooled === "yes"
        const isSkipImageAllowed =  this.state.triesInContext >= this.minTriesToSwitchImg && !fooled && !this.state.taskCompleted;
        const isEnterQuestionAllowed = !fooled && !this.state.taskCompleted;
        return (
           <Container>
                {topInstruction}
                {taskInstructionsButton}
                {taskInstructions}
                <Row>
                    <CardGroup style={{ width: '100%'}}>
                        <Card border='dark'>
                            <Card.Body className="d-flex justify-content-center pt-3" style={{ height: "auto" }}>
                                {contextContent}
                            </Card.Body>
                        </Card>
                    </CardGroup>
                    {!this.state.submitDisabled && isEnterQuestionAllowed &&
                        <>
                            <InputGroup style={{ width: '100%'}}>
                                <FormControl
                                    style={{ width: '100%', margin: 2 }}
                                    type="text"
                                    placeholder="Enter question..."
                                    value={this.state.question}
                                    onChange={this.handleQuestionChange}
                                    onKeyPress={this.handleKeyPress}
                                    ref={this.inputRef}
                                />
                            </InputGroup>
                            <InputGroup>
                                <small className="form-text text-muted">Please ask your question. Remember, the goal is to find a question that the model gets wrong but that another person would get right. Load time may be slow; please be patient.</small>
                            </InputGroup>
                        </>
                    }
                    <Card style={{maxHeight: 250, overflowY: "scroll", width: "100%" }}>
                        {responseInfo}
                        <div
                            className="bottom-anchor"
                            ref={this.bottomAnchorRef}
                        />
                    </Card>
                    {this.state.taskCompleted && (
                        <VQAFeedbackCard
                            comments={this.state.comments}
                            handleCommentsChange={this.handleCommentsChange}
                            submitHistory={this.submitHIT}
                        />)
                    }
                    <InputGroup className="mb-3" style={{ width: "100%" }}>
                        {isEnterQuestionAllowed && (
                            <Button
                                className="btn btn-primary"
                                style={{marginRight: 2}}
                                onClick={this.handleCheckAnswerButtonClick}
                                disabled={this.state.submitDisabled}>Check Answer
                                <i className={this.state.submitDisabled ? "fa fa-cog fa-spin" : ""} />
                            </Button>
                        )}
                        {isSkipImageAllowed && (
                            <Button
                                className="btn btn-warning"
                                style={{marginRight: 2}}
                                onClick={this.getNewContext}
                                disabled={this.state.refreshDisabled}>
                                    Skip Image
                            </Button>
                        )}
                        {this.state.taskCompleted && (
                            <Button
                                className="btn btn-primary btn-success"
                                style={{ marginTop: 5 }}
                                onClick={this.submitHIT}>
                                    Submit HIT
                            </Button>
                        )}
                        {taskTracker}
                    </InputGroup>
                    {this.state.fetchPredictionError && (
                        <span style={{ color: "#e65959", width: "100%" }}>
                            * An error occurred with the AI. Please try another question.
                        </span>
                    )}
                    {this.state.showErrorAlert && (
                        <Alert variant={"danger"} className="px-2 mx-0" style={{ width: '100%'}}>
                            There is a problem with the platform.
                            Please contact <Alert.Link href="mailto:dynabench@fb.com">dynabench@fb.com</Alert.Link>.
                        </Alert>
                    )}
                </Row>
                <KeyboardShortcuts
                    allowedShortcutsInText={["escape"]}
                    mapKeyToCallback={{
                        "i": {
                            callback: (isEnterQuestionAllowed) => this.focusTextInput(isEnterQuestionAllowed),
                            params: isEnterQuestionAllowed
                        },
                        "arrowright": {
                            callback: (isSkipImageAllowed) => this.skipImage(isSkipImageAllowed),
                            params: isSkipImageAllowed
                        },
                        "escape": {
                            callback: () => this.blurTextInput()
                        },
                        "s": {
                            callback: () => this.setState({ showInstructions: true })
                        },
                        "h": {
                            callback: () => this.setState({ showInstructions: false })
                        },
                        "f": {
                            callback: () => this.submitHIT()
                        },
                    }}
                />
           </Container>
       );
   }
}

export { CreateVQAMturkInterface }
