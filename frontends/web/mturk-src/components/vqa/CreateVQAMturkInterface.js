/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AtomicImage from "../../../src/containers/AtomicImage.js";
import CheckVQAModelAnswer from "../../../src/containers/CheckVQAModelAnswer.js";
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
       this.MODEL_STATES = { "UNKNOWN": -1, "CORRECT": 0, "INCORRECT": 1 };
       this.minTriesToSwitchImg = 3;
       this.minTriesToCompleteHIT = 10;
       this.state = {
           taskId: props.taskConfig.task_id,
           task: {},
           context: {},
           mapKeyToExampleId: {},
           responseContent: [],
           history: [],
           question: "",
           totalTriesSoFar: 0,
           triesInContext: 0,
           submitDisabled: true,
           refreshDisabled: true,
           fooled: false,
           taskCompleted: false,
           fetchPredictionError: false,
           showInstructions: false,
           showErrorAlert: false,
       };
       this.storeExample = this.storeExample.bind(this);
       this.getNewContext = this.getNewContext.bind(this);
       this.getModelResponseAndStoreExample = this.getModelResponseAndStoreExample.bind(this);
       this.removeLastResponseFromContent = this.removeLastResponseFromContent.bind(this);
       this.handleKeyPress = this.handleKeyPress.bind(this);
       this.handleSubmitTask = this.handleSubmitTask.bind(this);
       this.handleQuestionChange = this.handleQuestionChange.bind(this);
       this.handleSubmitCorrectAnswer = this.handleSubmitCorrectAnswer.bind(this);
       this.handleCheckAnswerButtonClick = this.handleCheckAnswerButtonClick.bind(this);
       this.setModelState = this.setModelState.bind(this);
       this.bottomAnchorRef = React.createRef();
   }

    componentDidMount() {
            this.api.getTask(this.state.taskId)
            .then(result => {
                this.setState({ task: result, showErrorAlert: false }, () => {
                    this.getNewContext();
                });
            },  error => {
                this.setState({ showErrorAlert: true });
                console.log(error);
            });
    }

   getNewContext() {
       const unitContent = Object.keys(this.state.context).length > 0
            ? [{ cls: 'context', text: this.state.context.context }, ...this.state.responseContent]
            : [];
       this.setState({ submitDisabled: true, refreshDisabled: true }, () => {
            this.api.getRandomContext(this.state.taskId, this.state.task.cur_round)
            .then(result => {
                this.setState({
                    history: [...this.state.history, unitContent],
                    context: result,
                    responseContent: [],
                    question: "",
                    fetchPredictionError: false,
                    triesInContext: 0,
                    submitDisabled: false,
                    refreshDisabled: false,
                    showErrorAlert: false,
                });
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

    storeExample(modelResponse) {
        const metadata = {
            'annotator_id': this.props.providerWorkerId,
            'mephisto_id': this.props.mephistoWorkerId,
            'model': 'MovieMCAN',
            'agentId': this.props.agentId,
            'assignmentId': this.props.assignmentId,
        };
        this.api.storeExample(
            this.state.task.id,
            this.state.task.cur_round,
            'turk',
            this.state.context.id,
            this.state.question,
            null,
            modelResponse,
            metadata
        )
        .then(newExample => {
            let key = this.state.responseContent.length - 1;
            this.setState({
                question: "",
                showErrorAlert: false,
                mapKeyToExampleId: {
                    ...this.state.mapKeyToExampleId,
                    [key]: newExample.id
                }
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
                modelResponse.prob = [modelResponse.prob, 1 - modelResponse.prob];
                let updatedContent = this.state.responseContent;
                updatedContent[updatedContent.length - 1] = {
                    ...updatedContent[updatedContent.length - 1],
                    loadingResponse: false,
                    text: this.state.question,
                    modelPredStr: modelResponse.answer,
                    response: modelResponse
                }
                this.setState({
                    responseContent: updatedContent,
                    fetchPredictionError: false,
                    showErrorAlert: false,
                }, this.storeExample(modelResponse));
            }
        }, error => {
            this.setState({ showErrorAlert: true });
            console.log(error);
        });
    }

    handleCheckAnswerButtonClick() {
        if (this.state.question.length == 0) { return; }
        this.setState({
           submitDisabled: true,
           refreshDisabled: true,
           responseContent: [
               ...this.state.responseContent, {
                    cls: "hypothesis",
                    modelState: this.MODEL_STATES.UNKNOWN,
                    feedbackSaved: null,
                    retracted: false,
                    flagged: false,
                    loadingResponse: true,
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

    handleSubmitTask() {
        const unitContent = [{ cls: 'context', text: this.state.context.context }, ...this.state.responseContent];
        this.setState({ history: [...this.state.history, unitContent] }, () => {
            this.props.onSubmit(this.state.history);
        });
    }

    handleSubmitCorrectAnswer(correctAnswer, newModelState) {
        let idx = this.state.responseContent.length - 1;
        let updatedContent = this.state.responseContent;
        updatedContent[idx].feedbackSaved = false;
        const exampleId = this.state.mapKeyToExampleId[idx];
        this.setState({ responseContent: updatedContent }, () => {
            this.api.updateExample(exampleId, correctAnswer, newModelState, this.props.providerWorkerId)
            .then((result) => {
                let updatedContent = this.state.responseContent;
                updatedContent[idx] = { ...updatedContent[idx], modelState: newModelState, feedbackSaved: true }
                this.setState({
                    responseContent: updatedContent,
                    totalTriesSoFar: this.state.totalTriesSoFar + 1,
                    triesInContext: this.state.triesInContext + 1,
                    fooled: newModelState === this.MODEL_STATES.INCORRECT,
                    submitDisabled: false,
                    refreshDisabled: false,
                    showErrorAlert: false,
                }, () => {
                    if (newModelState === this.MODEL_STATES.INCORRECT || this.state.totalTriesSoFar >= this.minTriesToCompleteHIT) {
                        this.setState({ taskCompleted: true });
                    }
                })
            }, (error) => {
                this.setState({ showErrorAlert: true });
                console.log(error);
            });
        })
    }

    setModelState(newState) {
        let idx = this.state.responseContent.length - 1;
        let updatedContent = this.state.responseContent;
        updatedContent[idx].modelState = newState;
        this.setState({ responseContent: updatedContent }, () => {
            if (newState === this.MODEL_STATES.INCORRECT) {
                this.smoothlyAnimateToBottom();
            }
        });
    }

    smoothlyAnimateToBottom() {
        if (this.bottomAnchorRef.current) {
          this.bottomAnchorRef.current.scrollIntoView({ block: "end", behavior: "smooth" });
        }
    }

    render() {
        let taskTrackerMessage = "";
        if (this.state.fooled) {
            taskTrackerMessage = "Congratulations! You fooled the model and got the bonus.";
        } else if (this.state.totalTriesSoFar >= this.minTriesToCompleteHIT) {
            taskTrackerMessage += " Minimum required tries completed. You can continue to get the bonus.";
        } else {
            taskTrackerMessage += ` Tries: ${this.state.totalTriesSoFar} / ${this.minTriesToCompleteHIT}.`
        }
        const taskTracker = <small style={{ padding: 7 }}>{taskTrackerMessage}</small>;
        const topInstruction = <h1>Ask questions and fool the AI</h1>

        let taskInstructionsButton = <></>
        if (this.state.showInstructions) {
            taskInstructionsButton = <Button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: false })}}>Hide Instructions</Button>
        } else {
            taskInstructionsButton = <Button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: true })}}>Show Instructions</Button>
        }
        const taskInstructions = this.state.showInstructions ? <>
            <p>
                In this task, you will be asked to find questions that fool an AI model
                into answering incorrectly. The AI is able to understand English
                and interpret images using common sense.
            </p>
            <p>
                Given an <b>image</b> that you will use as context, you are expected to
                do the following:
            </p>
            <ol className="mx-5">
                <li>
                    Write an <b>answerable question</b> based on the image that you think the AI
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
                Sometimes AI might be tricky to fool. When you have spent {this.minTriesToSwitchImg} tries
                without success you will be able to skip to the next image by clicking
                <b style={{ color: "blue" }}>Switch Image</b> button.
            </p>
            <p>
                You will have <b>{this.minTriesToCompleteHIT} tries</b> to fool the AI. If you succeed earlier you complete a HIT.
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
        </> : <></>

        const contextContent = this.state.context && <AtomicImage src={this.state.context.context} maxSize={500}/>
        const responseInfo = this.state.responseContent.map((response, idx) => {
            let classNames = "hypothesis rounded border";
            let feedbackContent = <></>;
            if (response.modelState === this.MODEL_STATES.CORRECT) {
                classNames += " response-warning";
                feedbackContent =
                    <span>
                        <strong>Try again!</strong> AI answered <strong>{response.modelPredStr}</strong>
                    </span>
            } else {
                feedbackContent = (
                    <CheckVQAModelAnswer
                        modelPredStr={response.modelPredStr}
                        modelState={response.modelState}
                        loadingResponse={response.loadingResponse}
                        feedbackSaved={response.feedbackSaved}
                        setModelState={this.setModelState}
                        updateExample={this.handleSubmitCorrectAnswer}
                        MODEL_STATES={this.MODEL_STATES}
                    />
                 )
                 if (response.modelState === this.MODEL_STATES.INCORRECT) {
                     classNames += " light-green-bg";
                 } else {
                    classNames += " bg-light"
                }
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


       return (
           <Container>
                {topInstruction}
                {taskInstructionsButton}
                {taskInstructions}
                <Row>
                    <CardGroup style={{ width: '100%'}}>
                        <Card border='dark'>
                            <Card.Body className="d-flex justify-content-center pt-0" style={{ height: "auto", overflowY: 'scroll' }}>
                                {contextContent}
                            </Card.Body>
                        </Card>
                    </CardGroup>
                    {!this.state.submitDisabled &&
                        <>
                            <InputGroup style={{ width: '100%'}}>
                                <FormControl
                                    style={{ width: '100%', margin: 2 }}
                                    placeholder="Enter question..."
                                    value={this.state.question}
                                    onChange={this.handleQuestionChange}
                                    onKeyPress={this.handleKeyPress}
                                />
                            </InputGroup>
                            <InputGroup>
                                <small className="form-text text-muted">Please ask your question. Remember, the goal is to find a question that the model gets wrong but that another person would get right. Load time may be slow; please be patient.</small>
                            </InputGroup>
                        </>
                    }
                    <Card style={{maxHeight: 250, overflowY: 'scroll', width: "100%" }}>
                        {responseInfo}
                        <div
                            className="bottom-anchor"
                            ref={this.bottomAnchorRef}
                        />
                    </Card>
                    <InputGroup className="mb-3" style={{ width: '100%'}}>
                        {!this.state.fooled && (
                            <Button className="btn btn-primary" style={{marginRight: 2}} onClick={this.handleCheckAnswerButtonClick} disabled={this.state.submitDisabled}>Check Answer <i className={this.state.submitDisabled ? "fa fa-cog fa-spin" : ""} /></Button>
                        )}
                        {!this.state.fooled && this.state.triesInContext >= this.minTriesToSwitchImg && (
                            <Button className="btn btn-warning" style={{marginRight: 2}} onClick={this.getNewContext} disabled={this.state.refreshDisabled}>Skip Image</Button>
                        )}
                        {this.state.taskCompleted && (
                            <Button className="btn btn-primary btn-success" onClick={this.handleSubmitTask}>Submit HIT</Button>
                        )}
                        {taskTracker}
                    </InputGroup>
                    {this.state.fetchPredictionError && (
                        <span style={{ color: "#e65959", width: "100%" }}>
                            * An error occured with the AI. Please try another question.
                        </span>
                    )}
                    {this.state.showErrorAlert && (
                        <Alert variant={"danger"} className="px-2 mx-0" style={{ width: '100%'}}>
                            There is a problem with the platform.
                            Please contact <Alert.Link href="mailto:dynabench@fb.com">dynabench@fb.com</Alert.Link>.
                        </Alert>
                    )}
                </Row>
           </Container>
       );
   }
}

export { CreateVQAMturkInterface }
