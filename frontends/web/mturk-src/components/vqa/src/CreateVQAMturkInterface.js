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
import { WarningMessage, WarningMessageLight } from "./WarningMessage.js"
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
           totalExamplesSoFar: new Set(),
           examplesInContext: new Set(),
           submitDisabled: true,
           refreshDisabled: true,
           fetchPredictionError: false,
           showErrorAlert: false,
           showInstructions: false,
       };
       this.getNewContext = this.getNewContext.bind(this);
       this.handleKeyPress = this.handleKeyPress.bind(this);
       this.handleQuestionChange = this.handleQuestionChange.bind(this);
       this.handleSubmitCorrectAnswer = this.handleSubmitCorrectAnswer.bind(this);
       this.handleCheckAnswerButtonClick = this.handleCheckAnswerButtonClick.bind(this);
       this.handleKeyPress = this.handleKeyPress.bind(this);
       this.handleCommentsChange = this.handleCommentsChange.bind(this);
       this.submitHIT = this.submitHIT.bind(this);
       this.setModelState = this.setModelState.bind(this);
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

    getHistoryWithCurrentExamples(state) {
        return [...state.history, ...this.getResponseContentForDB(state.responseContent)]
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

    getTagList(props) {
        if (props.taskConfig.context_tags) {
            return props.taskConfig.context_tags.split(",")
        } else {
            return []
        }
    }

    getLoggingTags(context, props) {
        let input_context_tags = this.getTagList(props)
        const extra_input_logging = props.taskConfig.extra_logging
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
        this.setState(function(prevState, props) {
            const history = this.getHistoryWithCurrentExamples(prevState)
            const unitContent = {
                cls: 'context',
                text: newContext.context,
                id: newContext.id,
                extra: this.getLoggingTags(newContext, props)
            }
            return {
                history: [...history, unitContent],
                context: newContext,
                responseContent: [],
                question: "",
                fetchPredictionError: false,
                examplesInContext: new Set(),
                submitDisabled: false,
                refreshDisabled: false,
                showErrorAlert: false,
            }
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
                this.getTagList(this.props),
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
        this.setState(function(prevState, props) {
            const idxToRemove = prevState.responseContent.length - 1;
            const updatedContent = prevState.responseContent.filter((_, idx) => idx !== idxToRemove);
            return {
                submitDisabled: false,
                refreshDisabled: false,
                fetchPredictionError: true,
                question: "",
                responseContent: updatedContent,
            }
        });
    }

    updateLastResponse(updates, state) {
        let idx = state.responseContent.length - 1
        let updatedContent = state.responseContent;
        updatedContent[idx] = {
            ...updatedContent[idx],
            ...updates
        }
        return updatedContent;
    }

    getUserInputTag(extra) {
        let input_info = extra.input_extra_info
        let tagToStoreWithExamples = input_info ? input_info.tag_to_store_with_examples : []
        if (tagToStoreWithExamples.length > 0) {
            return tagToStoreWithExamples[0]
        }
        return null
    }

    storeExample(modelResponse, cid, question) {
        const metadata = {
            'annotator_id': this.props.providerWorkerId,
            'mephisto_id': this.props.mephistoWorkerId,
            'model': 'MovieMCAN',
            'agentId': this.props.agentId,
            'assignmentId': this.props.assignmentId,
        };
        modelResponse.prob = [modelResponse.prob, 1 - modelResponse.prob];
        let extra = this.getLoggingTags(this.state.context, this.props)
        let tag = this.getUserInputTag(extra)
        this.api.storeExample(
            this.state.task.id,
            this.state.task.cur_round,
            'turk',
            cid,
            question,
            null,
            modelResponse,
            metadata,
            tag,
        )
        .then(newExample => {
            this.setState(function(prevState, props) {
                if (prevState.responseContent.length === 0) {
                    return {}
                }
                let updatedContent = this.updateLastResponse({
                    id: newExample.id,
                }, prevState)
                return {
                    question: "",
                    showErrorAlert: false,
                    responseContent: updatedContent
                };
            });
        }, error => {
            this.setState({ showErrorAlert: true });
            console.log(error);
        });
    }

    getModelResponseAndStoreExample() {
        // since this function is called at the end of an add on responseContent
        // it is guaranteed that the operations is performed on the last updated content.
        const idx = this.state.responseContent.length - 1
        if (idx < 0) {
            return;
        }
        const question = this.state.responseContent[idx].text
        const image_url = this.state.responseContent[idx].image_url
        const cid = this.state.responseContent[idx].cid
        const modelInputs = {
            image_url: image_url,
            question: question,
            insight: false,
        };
        this.api.getModelResponse(this.state.task.round.url, modelInputs)
        .then(modelResponse => {
            if (modelResponse.errorMessage) {
                console.log(modelResponse.errorMessage)
                this.removeLastResponseFromContent();
            } else {
                this.setState(function (prevState, props) {
                    if (prevState.responseContent.length === 0) {
                        return {}
                    }
                    let updatedContent = this.updateLastResponse({
                        modelPredStr: modelResponse.answer,
                        modelResponse: modelResponse,
                        uiSettings_loadingResponse: false,
                        extra: this.getLoggingTags(prevState.context, props)
                    }, prevState)
                    return {
                        responseContent: updatedContent,
                        fetchPredictionError: false,
                        showErrorAlert: false,
                    }
                }, () => {
                    this.storeExample(modelResponse, cid, question);
                });
            }
        }, error => {
            this.setState({ showErrorAlert: true });
            console.log(error);
        });
    }

    handleCheckAnswerButtonClick() {
        if (this.state.question.trim().length === 0) { return; }
        this.setState((prevState, props) => ({
           submitDisabled: true,
           refreshDisabled: true,
           responseContent: [
               ...prevState.responseContent, {
                    id: "unknown",
                    cls: "hypothesis",
                    fooled: "unknown",
                    cid: prevState.context.id,
                    text: prevState.question.trim(),
                    image_url: prevState.context.context,
                    uiSettings_feedbackSaved: null,
                    uiSettings_retracted: false,
                    uiSettings_flagged: false,
                    uiSettings_loadingResponse: true,
                }
            ]
        }), () => {
            this.smoothlyAnimateToBottom();
            this.getModelResponseAndStoreExample();
        });
    }

    handleQuestionChange(e) {
       this.setState({ question: e.target.value });
    }

    updateStateGivenUserFeedback(eid, correctAnswer, fooled) {
        this.setState(function(prevState, props) {
            let responseContentDict = this.getResponseContentFromEid(prevState, eid)
            if (responseContentDict === -1) {
                return {};
            }

            let idx = responseContentDict["idx"]
            let updatedContent = prevState.responseContent;
            updatedContent[idx] = {
                ...updatedContent[idx],
                fooled: fooled,
                correctAnswer: correctAnswer,
                uiSettings_feedbackSaved: true
            }

            let newTotalExamples = prevState.totalExamplesSoFar;
            newTotalExamples.add(eid)

            let examplesInContext = prevState.examplesInContext;
            examplesInContext.add(eid)
            return {
                responseContent: updatedContent,
                totalExamplesSoFar: newTotalExamples,
                examplesInContext: examplesInContext,
                submitDisabled: false,
                refreshDisabled: false,
                showErrorAlert: false,
            }
        })
    }

    getResponseContentFromEid(state, eid) {
        for (let idx = 0; idx < state.responseContent.length; idx++) {
            let responseContent = state.responseContent[idx]
            if (responseContent.id === eid) {
                return {
                    idx: idx,
                    content: responseContent,
                }
            }
        }
        return -1;
    }

    handleSubmitCorrectAnswer(eid, correctAnswer, fooled) {
        if (eid === "unknown") {
            return
        }
        this.setState(function(prevState, props) {
            let responseContentDict = this.getResponseContentFromEid(prevState, eid)
            if (responseContentDict === -1) {
                return {};
            }
            let idx = responseContentDict["idx"]
            let responseContent = responseContentDict["content"]
            let updatedContent = prevState.responseContent;
            responseContent["uiSettings_feedbackSaved"] = false;
            updatedContent[idx] = responseContent
            return { responseContent: updatedContent }
        }, () => {
            this.api.updateExample(
                eid,
                correctAnswer,
                fooled === "yes",
                this.props.providerWorkerId
            )
            .then((result) => {
                this.updateStateGivenUserFeedback(eid, correctAnswer, fooled);
            }, (error) => {
                this.setState({ showErrorAlert: true });
                console.log(error);
            });
        })
    }

    lastFooledExampleID(responseContent) {
        for (let idx=responseContent.length-1; idx >= 0; idx--) {
            if (responseContent[idx].fooled === "yes") {
                return responseContent[idx].id;
            }
        }
        return -1;
    }

    submitHIT() {
        let history = this.getHistoryWithCurrentExamples(this.state)
        // this is a best effort guess that the comment is likely going to be about the most recent example
        let exampleID = this.lastFooledExampleID(this.state.responseContent)
        history = [
            ...history,
            { cls: "comment", text: this.state.comments, cid: this.state.context.id, eid: exampleID },
            { cls: "log", responseContent: this.getResponseContentForDB(this.state.responseContent) }
        ];
        this.props.onSubmit(history);
        this.setState({
            context: {},
            history: [],
            responseContent: [],
            totalExamplesSoFar: new Set(),
            examplesInContext: new Set(),
            question: "",
            comments: "",
            showErrorAlert: false,
        })
    }

    setModelState(fooled) {
        if (fooled === "yes") {
            this.smoothlyAnimateToBottom();
        }
        this.setState(function(prevState, props) {
            if (prevState.responseContent.length === 0) {
                return {}
            }
            let updatedContent = this.updateLastResponse({fooled: fooled}, prevState)
            return { responseContent: updatedContent }
        })
    }

    smoothlyAnimateToBottom() {
        if (this.bottomAnchorRef.current) {
          this.bottomAnchorRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }

    render() {
        let taskTrackerMessage = "";
        let fooled = "unknown";
        let correctAnswer = ""
        let idx = this.state.responseContent.length - 1
        if (idx >= 0) {
            let responseContent = this.state.responseContent[idx]
            fooled = responseContent.fooled
            if (responseContent.correctAnswer) {
                correctAnswer = responseContent.correctAnswer
            }
        }

        if (fooled === "yes") {
            taskTrackerMessage = "Congratulations! You fooled the model and please click 'Submit HIT' to get the bonus.";
        } else if (this.state.totalExamplesSoFar.size >= this.minTriesToCompleteHIT) {
            taskTrackerMessage = "Minimum required tries completed. You can submit HIT or you can keep trying to fool the model to recieve a bonus.";
        } else {
            taskTrackerMessage = `Tries (to unlock submit HIT button): ${this.state.totalExamplesSoFar.size} / ${this.minTriesToCompleteHIT}.`
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
                    <li><b>j:</b> Toggle Show/Hide Instructions.</li>
                    <li><b>w:</b> Correct.</li>
                    <li><b>s:</b> Incorrect.</li>
                    <li><b>d:</b> Skip Image.</li>
                    <li><b>f:</b> Submit HIT.</li>
                </ul>
                <p>
                    You will have to complete at least <b>{this.minTriesToCompleteHIT} tries</b> to submit a HIT unless you fool the AI before then.
                    Remember that you will recieve a bonus <b>only if</b> you are able to fool the AI and another person agrees with you.
                    You will not recieve the bonus if you submit the HIT after completing <b>{this.minTriesToCompleteHIT} tries</b>.
                    Therefore, we highly encourage that you try your best to come up with creative and <b>valid</b> questions to fool the AI.
                    You are also allowed to skip to the next image after {this.minTriesToSwitchImg} tries on the same image.
                    You can do so by clicking <b style={{ color: "blue" }}>Skip Image</b> button.
                </p>
                <WarningMessageLight/>
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
                        eid={response.id}
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

        const isSkipImageAllowed = (this.state.examplesInContext.size >= this.minTriesToSwitchImg || this.state.totalExamplesSoFar.size >= this.minTriesToCompleteHIT) && (fooled === "no");
        const isEnterQuestionAllowed = !(fooled === "yes");
        const shouldShowSubmitHIT = this.state.totalExamplesSoFar.size >= this.minTriesToCompleteHIT || (fooled === "yes" && correctAnswer.length > 0);
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
                    <WarningMessage/>
                    {!this.state.submitDisabled && isEnterQuestionAllowed &&
                        <>
                            <InputGroup style={{ width: '100%'}}>
                                <FormControl
                                    style={{ width: '100%', margin: 2 }}
                                    type="text"
                                    placeholder="Enter a valid question... see instructions above to see what `valid` means."
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
                    {shouldShowSubmitHIT && (
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
                        {shouldShowSubmitHIT && (
                            <Button
                                className="btn btn-primary btn-success"
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
                        "d": {
                            callback: (isSkipImageAllowed) => this.skipImage(isSkipImageAllowed),
                            params: isSkipImageAllowed
                        },
                        "escape": {
                            callback: () => this.blurTextInput()
                        },
                        "j": {
                            callback: () => this.setState((state, _) => ({ showInstructions: !state.showInstructions }))
                        },
                        "f": {
                            callback: () => { if (shouldShowSubmitHIT) { this.submitHIT() }}
                        },
                    }}
                />
           </Container>
       );
   }
}

export { CreateVQAMturkInterface }
