/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AtomicImage from "../../../../src/containers/AtomicImage.js";
import ErrorAlert from "../../../../src/containers/ErrorAlert.js"
import CheckVQAModelAnswer from "../../../../src/containers/CheckVQAModelAnswer.js";
import { ValidQuestionCharacteristics } from "./QuestionsCharacteristics.js"
import { VQAFeedbackCard } from "./VQAFeedbackCard.js";
import { KeyboardShortcuts } from "../../../../src/containers/KeyboardShortcuts.js"
import WarningMessage from "./WarningMessage.js"
import {
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
        if (this.props.taskConfig.context_tags) {
            return this.props.taskConfig.context_tags.split(",")
        } else {
            return []
        }
    }

    getLoggingTags(context) {
        let input_context_tags = this.getTagList()
        const extra_input_logging = this.props.taskConfig.extra_logging
        if (extra_input_logging === null || extra_input_logging.length === 0) {
            return {input_context_tags: input_context_tags}
        }

        let extra_logging_list = extra_input_logging.split(";")
        const extra_logging = {}
        extra_logging_list.forEach(entry => {
            if (entry === null || entry.length === 0) {
                return
            }
            let key_values = entry.split(":")
            if (key_values.length < 2) {
                return
            }
            let values = key_values[1].split(",")
            values = values.filter(value => value.length > 0)
            extra_logging[key_values[0]] = values
        })
        return {
            current_context_tag: context.tag,
            input_context_tags: input_context_tags,
            input_extra_info: extra_logging
        }
    }

    resetStateToContext(newContext) {
        const history = this.getHistoryWithCurrentExamples()
        const unitContent = [{
            cls: 'context',
            text: newContext.context,
            id: newContext.id,
            extra: this.getLoggingTags(newContext)
        }]
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
        };
        modelResponse.prob = [modelResponse.prob, 1 - modelResponse.prob];
        let extra = this.getLoggingTags(this.state.context)
        let input_info = extra.input_extra_info
        let tagToStoreWithExamples = input_info ? input_info.tag_to_store_with_examples : null
        this.api.storeExample(
            this.state.task.id,
            this.state.task.cur_round,
            'turk',
            this.state.context.id,
            this.state.question.trim(),
            null,
            modelResponse,
            metadata,
            tagToStoreWithExamples,
        )
        .then(newExample => {
            let updatedContent = this.updateLastResponse({
                id: newExample.id,
                cid: this.state.context.id,
                extra: extra
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
                    extra: this.getLoggingTags(this.state.context)
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
                    Given an <b>image</b>, you are expected to do the following:
                </p>
                <ol className="mx-5">
                    <li>
                        Write a <b style={{ color: "red" }}>valid question</b> based on the image.
                        A valid question has the following characteristics:
                        <ValidQuestionCharacteristics/>
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
                                When writing the answer you should consider these aspects:
                                <ul className="mx-3" style={{ listStyleType: "disc" }}>
                                    <li>
                                        <b>Your answer should be a brief phrase (not a complete sentence).</b><br/>
                                        For example, instead of "It is a kitchen", just enter "kitchen"
                                    </li>
                                    <li>
                                        <b>For numerical answers, please use digits.</b><br/>
                                        For example, instead of "Ten", just enter: "10"
                                    </li>
                                    <li>
                                        <b>For yes/no questions, please just say yes/no.</b><br/>
                                        For example, instead of "You bet it is!", just enter: "yes"
                                    </li>
                                    <li>
                                        <b> For multi-category type questions, where the answer comes from a list of items: </b>
                                        <ul>
                                            <li>
                                                <b>If there are 2 items in the answer, please connect the items with "and".</b><br/>
                                                For example, question: "What are the two vegetables in the bowl?" Answer: "carrots and broccoli".
                                            </li>
                                            <li>
                                                <b>If the answer has more than 2 items, separate the items with comma, but connect the last item with "and".</b><br/>
                                                For example, question: "What are the three seasons shown in this image?" Answer: "spring, summer and winter".
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        <b>Respond matter-of-factly and avoid using conversational language or inserting your opinion</b>
                                    </li>
                                </ul>
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
                    You will have to complete at least <b>{this.minTriesToCompleteHIT} tries</b> to submit a HIT unless you can come up with a question that fools the AI before then.
                    We highly encourage that you try your best to come up with creative but <b>valid</b> questions to fool the AI. You are also allowed to skip to the next image
                    after {this.minTriesToSwitchImg} tries on the same image. You can do so by clicking <b style={{ color: "blue" }}>Switch Image</b> button.
                </p>
                <p>
                    <strong style={{ color: "red" }}>WARNING:</strong> Every question will
                    be checked by other humans. If it is detected that you are spamming the AI or consistently creating invalid questions or making
                    a bad use of the interface you will be banned.
                </p>
            </>
        )
        const contextContent = this.state.context.context && <AtomicImage src={this.state.context.context} maxHeight={500} maxWidth={800}/>
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
                <WarningMessage/>
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
                                    placeholder="Enter a valid question... see instructions to see what `valid` means."
                                    value={this.state.question}
                                    onChange={this.handleQuestionChange}
                                    onKeyPress={this.handleKeyPress}
                                    ref={this.inputRef}
                                />
                            </InputGroup>
                            <InputGroup>
                                <small className="form-text text-muted">Please ask a valid question. Remember, the goal is to find a valid question that the model gets wrong but that another person would get right. Load time may be slow; please be patient.</small>
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
                        <ErrorAlert/>
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
