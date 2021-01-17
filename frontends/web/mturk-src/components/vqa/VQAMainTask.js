/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 import React from 'react';
 import AtomicImage from "../../../src/containers/AtomicImage.js";
 import CheckVQAModelAnswer from "../../../src/containers/CheckVQAModelAnswer.js";
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
        this.MODEL_STATES = { "UNKNOWN": -1, "CORRECT": 0, "INCORRECT": 1 };
        this.CONTENT_IDX = { "CONTEXT": 0, "RESPONSE": 1 };
        this.state = {
            taskId: props.taskConfig.task_id,
            showPreview: false,
            task: {},
            context: null,
            content: [null, null],
            correctAnswer: "",
            hypothesis: "",
            submitDisabled: true,
            refreshDisabled: true,
            exampleId: null,
            tries: 0,
            total_tries: 10,
            taskCompleted: false,
            modelState: this.MODEL_STATES.UNKNOWN,
            showInstructions: false
        };
        this.getNewContext = this.getNewContext.bind(this);
        this.handleTaskSubmit = this.handleTaskSubmit.bind(this);
        this.handleResponse = this.handleResponse.bind(this);
        this.handleHypothesisChange = this.handleHypothesisChange.bind(this);
        this.handleSubmitCorrectAnswer = this.handleSubmitCorrectAnswer.bind(this);
        this.setModelState = this.setModelState.bind(this);
    }

    componentDidMount() {
        this.api.getTask(this.state.taskId)
        .then(result => {
            result.targets = ['confidence', 'uncertainty'];
            this.setState({ task: result }, function() {
                this.getNewContext();
            });
        },  error => {
            console.log(error);
        });
    }

    getNewContext() {
        this.setState({ submitDisabled: true, refreshDisabled: true }, function () {
            this.api.getRandomContext(this.state.taskId, this.state.task.cur_round)
            .then(result => {
                const newContent = [{ cls: 'context', text: result.context }, null];
                this.setState({
                    context: result,
                    content: newContent,
                    hypothesis: "",
                    modelState: this.MODEL_STATES.UNKNOWN,
                    submitDisabled: false,
                    refreshDisabled: false });
            }, error => {
                console.log(error);
            });
        });
    }

    handleResponse() {
        const newContent = [this.state.content[this.CONTENT_IDX.CONTEXT], null];
        this.setState({
            modelState: this.MODEL_STATES.UNKNOWN,
            content: newContent,
            submitDisabled: true,
            refreshDisabled: true
        }, function () {
          if (this.state.hypothesis.length == 0) {
            this.setState({ submitDisabled: false, refreshDisabled: false });
            return;
          }

          let modelInputs = {
            image_url: this.state.context.context,
            question: this.state.hypothesis,
            insight: false,
          };

          this.api.getModelResponse(this.state.task.round.url, modelInputs)
            .then(result => {
                result.prob = [result.prob, 1 - result.prob];
                this.setState({
                    content: [
                        this.state.content[this.CONTENT_IDX.CONTEXT], {
                            cls: 'hypothesis',
                            modelPredStr: result.answer,
                            text: this.state.hypothesis,
                            retracted: false,
                            flagged: false,
                            response: result
                        }
                    ]
                },
                function() {
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
                        this.state.hypothesis,
                        null,
                        result,
                        metadata
                    )
                    .then(result => {
                        this.setState({
                            hypothesis: "",
                            refreshDisabled: false,
                            exampleId: result.id,
                        });
                    }, error => {
                        console.log(error);
                    });
                });
            }, error => {
                console.log(error);
            });
        });
    }

    handleHypothesisChange(e) {
        this.setState({ hypothesis: e.target.value });
    }

    handleTaskSubmit() {
        this.props.onSubmit(this.state.content);
    }

    handleSubmitCorrectAnswer(correctAnswer, newModelState) {
        this.api.
        updateExample(this.state.exampleId, correctAnswer, newModelState, this.props.providerWorkerId)
        .then((result) => {
            const newContent = [this.state.content[this.CONTENT_IDX.CONTEXT], {
                ...this.state.content[this.CONTENT_IDX.RESPONSE],
                fooled: this.state.modelState === this.MODEL_STATES.INCORRECT
            }]
            this.setState({
                content: newContent,
                tries: this.state.tries + 1,
                modelState: newModelState,
                submitDisabled: false
            }, () => {
                if (this.state.modelState === this.MODEL_STATES.INCORRECT || this.state.tries >= this.state.total_tries) {
                    this.setState({ taskCompleted: true })
                    this.getNewContext()
                }
            })
        }, (error) => {
            console.log(error);
        });
    }

    setModelState(newState) {
        this.setState({ modelState: newState });
    }

    render() {
        const contextContent = this.state.context && <AtomicImage src={this.state.context.context} maxSize={500}/>
        const taskTracker = <small style={{ padding: 7 }}>Tries: {this.state.tries} / {this.state.total_tries}</small>;
        const topInstruction = <>
            <h1>Ask questions and fool the AI</h1>
        </>
        let taskInstructionsButton = <></>
        if (this.state.showInstructions) {
          taskInstructionsButton = <Button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: false })}}>Hide Instructions</Button>
        } else {
          taskInstructionsButton = <Button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: true })}}>Show Instructions</Button>
        }

        const taskInstructions = this.state.showInstructions ? <>
          <p>You will be playing a <strong>game together with an AI</strong> that is trying to understand English and interpret images.
            </p>

            <p>You will be given an image and we would like you to write a question intended to fool the AI but a person would get right.<br />
            You will be required to indicate if the AI was correct or not. In the case the AI makes a wrong prediction, you will enter the correct answer.
            </p>

            <p>The AI will tell you what it thinks for each question you write. Your goal is to fool the AI to get it wrong.
                For each image, you will have multiple chances to write questions util you can fool the AI.</p>

            <p>
                The AI utilizes the latest technologies to understand language and can be very smart. Be creative to fool the AI - it will be fun!!!
            </p>
          </> : <></>

        const modelResponse = this.state.content[this.CONTENT_IDX.RESPONSE];
        let responseContent = null;
        let classNames = "hypothesis rounded border";
        if (modelResponse) {
            if (this.state.modelState === this.MODEL_STATES.CORRECT) {
                classNames += " response-warning";
                responseContent = (
                    <span>
                        <strong>Try again!</strong> AI answered <strong>{modelResponse.modelPredStr}</strong>
                    </span>
                )
            } else {
                responseContent = (
                    <CheckVQAModelAnswer
                        exampleId={this.state.exampleId}
                        modelPredStr={modelResponse.modelPredStr}
                        modelState={this.state.modelState}
                        setModelState={this.setModelState}
                        handleSubmitCorrectAnswer={this.handleSubmitCorrectAnswer}
                        mode="mturk"
                        MODEL_STATES={this.MODEL_STATES}
                    />
                )
                if (this.state.modelState === this.MODEL_STATES.CORRECT) {
                    classNames += " light-green-bg"
                } else {
                    classNames += " bg-light"
                }
            }
        }
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
                            <InputGroup>
                                <FormControl
                                    style={{ width: '100%', margin: 2 }}
                                    placeholder="Enter question..."
                                    value={this.state.hypothesis}
                                    onChange={this.handleHypothesisChange}
                                />
                            </InputGroup>
                            <InputGroup>
                                <small className="form-text text-muted">Please ask your question. Remember, the goal is to find a question that the model gets wrong but that another person would get right. Load time may be slow; please be patient.</small>
                            </InputGroup>
                        </>
                    }
                    {modelResponse && (
                        <Card className={classNames} style={{ minHeight: 120, width: "100%" }}>
                            <div className="mb-3">{modelResponse.text}</div>
                            <small>
                                <Card.Body className="p-3">
                                    {responseContent}
                                </Card.Body>
                            </small>
                        </Card>
                    )}
                    <InputGroup className="mb-3">
                        <Button className="btn btn-primary" style={{marginRight: 2}} onClick={this.handleResponse} disabled={this.state.submitDisabled}>Check Answer <i className={this.state.submitDisabled ? "fa fa-cog fa-spin" : ""} /></Button>
                        <Button className="btn btn-secondary" style={{marginRight: 2}} onClick={this.getNewContext} disabled={this.state.refreshDisabled}>Go to next image</Button>
                        {taskTracker}
                    </InputGroup>
                </Row>
                {this.state.taskCompleted && (
                    <div>
                        You have completed the HIT. Click the "Finish" button to submit your HIT.<br />
                        <Button className="btn btn-primary btn-success" onClick={this.handleTaskSubmit}>Finish</Button>
                    </div>
                )}
            </Container>
        );
    }
 }

export { CreateVQAMturkInterface }
