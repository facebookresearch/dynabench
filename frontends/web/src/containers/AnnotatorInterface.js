/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import OwnerFiltersConfig from "./OwnerFiltersConfig.js";
import ErrorAlert from "./ErrorAlert.js";
import {
    Row,
    Col,
    Card,
    InputGroup,
} from "react-bootstrap";
import {
    WarningMessage,
    WarningOwnerMode,
    WarningHateSpeech
} from "./WarningMessage.js";
import { KeyboardShortcuts } from "./KeyboardShortcuts.js";
import ContextInfo from "./ContextInfo.js";
import { ExampleContent, ExampleValidationActions } from "./ExampleInfo.js";

class AnnotatorInterface extends React.Component {
    constructor(props) {
        super(props);
        this.VALIDATION_STATES = {
            "CORRECT": "correct",
            "INCORRECT": "incorrect",
            "VALID": "valid",
            "INVALID": "invalid",
            "FLAGGED": "flagged",
            "UNKNOWN": "unknown",
        }
        this.state = {
            context: {},
            example: {},
            task: {},
            history: [],

            // current task state
            answer: this.VALIDATION_STATES.UNKNOWN,
            question: this.VALIDATION_STATES.UNKNOWN,
            totalValidationsSoFar: new Set(),
            validatorLabel: "",
            flagReason: null,
            labelExplanation: null,
            creatorAttemptExplanation: null,
            validatorHateType: null,

            // current task UI state
            examplesOverError: false,
            showErrorAlert: false,

            // current user state
            ownerValidationFlagFilter: "Any",
            ownerValidationDisagreementFilter: "Any",
            isOwner: false
        };
        this.updateAnswer = this.updateAnswer.bind(this);
        this.getNewExample = this.getNewExample.bind(this);
        this.updateValidatorSelection = this.updateValidatorSelection.bind(this);
        this.setRangesAndGetRandomFilteredExample = this.setRangesAndGetRandomFilteredExample.bind(this);
    }

    componentDidMount() {
        if (this.props.interfaceMode === "web") {
            this.setInitialOwnerFilters();
        }

        this.props.api.getTask(this.props.taskId).then(
            (result) => {
                result.targets = result.targets.split("|");
                result.selected_round = result.cur_round;
                this.setState({ task: result }, () => {
                    this.getNewExample();
                });
            },
            (error) => {
                console.log(error);
                this.setState({ showErrorAlert: true });
            }
        );
    }

    getResetState() {
        return {
            answer: this.VALIDATION_STATES.UNKNOWN,
            validatorLabel: "",
            flagReason: null,
            labelExplanation: null,
            creatorAttemptExplanation: null,
            validatorHateType: null,
        };
    }

    updateValidatorSelection(updatedValues) {
        this.setState({
            ...this.getResetState(),
            ...updatedValues,
        });
    }

    updateAnswer(value) {
        if (value.length > 0) {
            this.setState({
                validatorLabel: [value[value.length - 1]],
            });
        } else {
            this.setState({ validatorLabel: value });
        }
    }

    getTagList(props) {
        if (props.taskConfig && props.taskConfig.fetching_tags) {
            return props.taskConfig.fetching_tags.split(",")
        } else {
            return []
        }
    }

    getNewExample() {
        (this.state.isOwner
            ? this.setRangesAndGetRandomFilteredExample()
            : this.props.api
                .getRandomExample(
                    this.props.taskId,
                    this.state.task.selected_round,
                    this.getTagList(this.props),
                    this.props.providerWorkerId,
                ))
                .then((result) => {
                    console.log(result);
                    if (this.state.task.type === "clf") {
                        result.target = this.state.task.targets[
                            parseInt(result.target_pred)
                        ];
                    }
                    this.updateValidatorSelection({
                        example: result,
                        question: this.VALIDATION_STATES.UNKNOWN,
                        examplesOverError: false,
                    });
                },
                (error) => {
                    console.log(error);
                    this.setState({ examplesOverError: true });
                }
            );
    }

    shouldExampleBeValidated = () => {
        const taskName = this.state.task.shortname;

        const questionState = this.state.question;
        const answerState = this.state.answer;
        const validatorLabel = this.state.validatorLabel;
        const flagReason = this.state.flagReason;

        const UNKNOWN = this.VALIDATION_STATES.UNKNOWN;
        const VALID = this.VALIDATION_STATES.VALID;
        const INCORRECT = this.VALIDATION_STATES.INCORRECT;
        const CORRECT = this.VALIDATION_STATES.CORRECT;
        const FLAGGED = this.VALIDATION_STATES.FLAGGED;

        if (this.state.examplesOverError || ((questionState === FLAGGED || answerState === FLAGGED) && !flagReason)) {
            return false;
        }
        if (taskName === "VQA") {
            return !(questionState === UNKNOWN || (questionState === VALID && answerState === UNKNOWN));
        } else {
            return (
                (answerState === CORRECT)
                || (answerState === INCORRECT && (taskName === "Sentiment" || taskName === "Hate Speech")) || (answerState === INCORRECT && validatorLabel !== "")
            )
        }
    }

    getActionLabel = () => {
        const questionState = this.state.question;
        const answerState = this.state.answer;

        const VALID = this.VALIDATION_STATES.VALID;
        const INVALID = this.VALIDATION_STATES.INVALID;
        const FLAGGED = this.VALIDATION_STATES.FLAGGED;
        const INCORRECT = this.VALIDATION_STATES.INCORRECT;

        if (questionState === FLAGGED || answerState === FLAGGED) {
            return "flagged"
        } else if (questionState === VALID) {
            return  answerState === INCORRECT ? "correct" : "incorrect";
        } else if (questionState === INVALID) {
            return "incorrect";
        } else {
            return answerState === INCORRECT ? "incorrect" : "correct";
        }
    }

    getExampleMetadata = (interfaceMode) => {
        let taskMetadata = {
            questionValidationState: this.state.question,
            responseValidationState: this.state.answer,
            flagReason: this.state.flagReason,
            validatorLabel: this.state.validatorLabel,
            exampleExplanation: this.state.labelExplanation,
            modelExplanation: this.state.creatorAttemptExplanation,
            validatorHateType: this.state.validatorHateType,
        }
        if (interfaceMode === "mturk") {
            return {
                ...taskMetadata,
                annotator_id: this.props.providerWorkerId,
                mephisto_id: this.props.mephistoWorkerId,
                agentId: this.props.agentId,
                assignmentId: this.props.assignmentId,
            }
        }
        return taskMetadata;
    }


    submitValidation() {
        const interfaceMode = this.props.interfaceMode;
        if (interfaceMode === "mturk" && this.state.examplesOverError && this.state.totalValidationsSoFar.size > 0) {
            this.props.onSubmit(this.state.history);
            return;
        }

        if (this.shouldExampleBeValidated()) {
            const userMode = this.state.isOwner ? "owner" : "user";
            const interfaceMode = this.props.interfaceMode;
            const action = this.getActionLabel();
            const metadata = this.getExampleMetadata(interfaceMode);

            this.props.api.validateExample(
                this.state.example.id,
                action,
                userMode,
                metadata,
                this.props.providerWorkerId
            )
            .then(result => {
                if (interfaceMode === "mturk") {
                    this.setState((prevState, _) => {
                        const newTotalValidationsSoFar = new Set(prevState.totalValidationsSoFar);
                        if (prevState.example.id) {
                            newTotalValidationsSoFar.add(prevState.example.id)
                        }

                        let newHistory = [...prevState.history, {
                            id: prevState.example.id,
                            questionValidationState: prevState.questionValidationState,
                            responseValidationState: prevState.responseValidationState,
                            flagReason: prevState.flagReason,
                            totalNumValidationsSoFar: newTotalValidationsSoFar.size,
                        }];

                        return {
                            totalValidationsSoFar: newTotalValidationsSoFar,
                            history: newHistory,
                        }
                    }, () => {
                        if (this.state.totalValidationsSoFar.size === this.props.batchAmount) {
                            this.props.onSubmit(this.state.history);
                        } else {
                            this.getNewExample();
                        }
                    })
                } else {
                    if (!!result.badges) {
                        this.props.setBadges(result.badges);
                    }
                    this.getNewExample();
                }
            }, (error) => {
                console.log(error);
                this.setState({ showErrorAlert: true })
            })
        }
    }

    setRangesAndGetRandomFilteredExample() {
        let minNumFlags;
        let maxNumFlags;
        let minNumDisagreements;
        let maxNumDisagreements;

        if (this.state.ownerValidationFlagFilter === "Any") {
            minNumFlags = 0;
            maxNumFlags = 5;
        } else {
            minNumFlags = this.state.ownerValidationFlagFilter;
            maxNumFlags = this.state.ownerValidationFlagFilter;
        }

        if (this.state.ownerValidationDisagreementFilter === "Any") {
            minNumDisagreements = 0;
            maxNumDisagreements = 4;
        } else {
            minNumDisagreements = this.state.ownerValidationDisagreementFilter;
            maxNumDisagreements = this.state.ownerValidationDisagreementFilter;
        }

        return this.props.api.getRandomFilteredExample(
            this.props.taskId,
            this.state.task.selected_round,
            minNumFlags,
            maxNumFlags,
            minNumDisagreements,
            maxNumDisagreements
        );
    }

    setInitialOwnerFilters = () => {
        if (this.props.user.settings_json) {
            const settings_json = JSON.parse(this.props.user.settings_json);
            if (settings_json.hasOwnProperty('owner_validation_flag_filter')) {
              this.setState({ ownerValidationFlagFilter: settings_json['owner_validation_flag_filter'] });
            }
            if (settings_json.hasOwnProperty('owner_validation_disagreement_filter')) {
              this.setState({ ownerValidationDisagreementFilter: settings_json['owner_validation_disagreement_filter'] });
            }
        }
    }

    updateUserSettings = (key, value) => {
        let settings_json = {};
        if (this.props.user.settings_json) {
            settings_json = JSON.parse(this.props.user.settings_json);
        }
        settings_json[key] = value;
        this.props.user.settings_json = JSON.stringify(settings_json);
        this.props.api.updateUser(this.props.user.id, this.props.user);
    }

    updateOwnerValidationFlagFilter = (value) => {
        this.updateUserSettings('owner_validation_flag_filter', value);
        this.setState({ ownerValidationFlagFilter: value }, () => {
            this.getNewExample();
        });
    }

    updateOwnerValidationDisagreementFilter = (value) => {
        this.updateUserSettings('owner_validation_disagreement_filter', value);
        this.setState({ ownerValidationDisagreementFilter: value }, () => {
            this.getNewExample();
        });
    }

    toggleOwnerMode = () => {
        this.setState((state, _) => {
            return { isOwner: !state.isOwner }
        }, () => this.getNewExample())
    }

    render() {
        const interfaceMode = this.props.interfaceMode;
        const taskType = this.state.task.type;
        const taskName = this.state.task.shortname;
        const curContext = this.state.example && this.state.example.context;
        const contextBg = taskName !== "VQA" ? "light-gray-bg" : "";

        const VALID = this.VALIDATION_STATES.VALID;
        const INVALID = this.VALIDATION_STATES.INVALID;
        const FLAGGED = this.VALIDATION_STATES.FLAGGED;
        const UNKNOWN = this.VALIDATION_STATES.UNKNOWN;
        const CORRECT = this.VALIDATION_STATES.CORRECT;
        const INCORRECT = this.VALIDATION_STATES.INCORRECT;

        const questionState = this.state.question;
        const answerState = this.state.answer;
        const validatorLabel = this.state.validatorLabel;
        const validatorHateType = this.state.validatorHateType;
        const creatorAttemptExplanation = this.state.creatorAttemptExplanation;

        const shouldQuestionBeValidated = taskType === "VQA";
        const shouldAnswerBeValidated = taskType !== "VQA" || questionState === VALID;
        const shouldDisplayOwnerConfig = interfaceMode === "web" && (this.props.api.isTaskOwner(this.props.user, this.state.task.id) || this.props.user.admin);

        const taskTracker = interfaceMode === "mturk" && (
            <small
                style={{ padding: 9 }}
            >{`Validations: ${this.state.totalValidationsSoFar.size} / ${this.props.batchAmount}.`}</small>
        );

        const keyShortcuts = taskName === "VQA" && interfaceMode === "mturk" && (
            <KeyboardShortcuts
                allowedShortcutsInText={["enter", "escape"]}
                mapKeyToCallback={{
                    w: {
                        callback: () => this.updateValidatorSelection({ question: VALID }),
                    },
                    s: {
                        callback: () => this.updateValidatorSelection({ question: INVALID }),
                    },
                    f: {
                        callback: () => this.updateValidatorSelection({ question: FLAGGED }),
                    },
                    escape: {
                        callback: () => this.updateValidatorSelection({
                            question: UNKNOWN,
                            answer: UNKNOWN,
                        }),
                    },
                    d: {
                        callback: () => this.updateValidatorSelection({ answer: CORRECT }),
                    },
                    a: {
                        callback: () => this.updateValidatorSelection({ answer: INCORRECT }),
                    },
                    enter: {
                        callback: () => this.submitValidation(),
                    },
                }}
            />
        )

        return (
            <>
                {shouldDisplayOwnerConfig && (
                    <OwnerFiltersConfig
                        isOwner={this.state.isOwner}
                        toggleOwnerMode={this.toggleOwnerMode}
                        ownerValidationFlagFilter={this.state.ownerValidationFlagFilter}
                        ownerValidationDisagreementFilter={this.state.ownerValidationDisagreementFilter}
                        updateOwnerValidationFlagFilter={this.updateOwnerValidationFlagFilter}
                        updateOwnerValidationDisagreementFilter={this.updateOwnerValidationDisagreementFilter}
                    />
                )}
                {interfaceMode === "web" && (
                    <div className="mt-4 mb-5 pt-3">
                        <p className="text-uppercase mb-0 spaced-header">
                            {this.state.task.name}
                        </p>
                        <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
                            Validate examples
                        </h2>
                        <p>
                            If a model was fooled, we need to make sure that the
                            example is correct.
                        </p>
                    </div>
                )}

                {taskName === "Hate Speech" && (
                    <WarningHateSpeech/>
                )}

                <Card className="profile-card overflow-hidden">
                    {!this.state.examplesOverError ? (
                        this.state.example ? (
                            <>
                                <div className={"mb-1 p-3 " + contextBg}>
                                    {taskType !== "VQA" && (
                                        <h6 className="text-uppercase dark-blue-color spaced-header">
                                            Context:
                                        </h6>
                                    )}
                                    {curContext && (
                                        <ContextInfo
                                            taskType={taskType}
                                            text={curContext.context}
                                            needAnswer={answerState === INCORRECT && taskName === "QA"}
                                            answer={validatorLabel}
                                            updateAnswer={this.updateAnswer}
                                        />
                                    )}
                                </div>
                                {interfaceMode === "mturk" && (
                                    <WarningMessage/>
                                )}
                                <Card.Body
                                    className="overflow-auto pt-2"
                                    style={{ height: 400 }}
                                >
                                    <Card
                                        className="hypothesis rounded border m-3 card"
                                        style={{ minHeight: 120 }}
                                    >
                                        <Card.Body className="p-3">
                                            <Row>
                                                <Col xs={12} md={7}>
                                                    {shouldQuestionBeValidated && (
                                                        <>
                                                            <ExampleContent
                                                                task={this.state.task}
                                                                example={this.state.example}
                                                                validatingQuestion={true}
                                                            />
                                                            <ExampleValidationActions
                                                                correct={questionState === VALID}
                                                                incorrect={questionState === INVALID}
                                                                flagged={questionState === FLAGGED}
                                                                setCorrect={() => this.updateValidatorSelection({ question: VALID })}
                                                                setIncorrect={() => this.updateValidatorSelection({ question: INVALID })}
                                                                setFlagged={() => this.updateValidatorSelection({ question: FLAGGED })}
                                                                setFlagReason={(flagReason) => this.setState({ flagReason })}
                                                                validatingQuestion={true}
                                                                isFlaggingAllowed={true}
                                                                isOwner={this.state.isOwner}
                                                                example={this.state.example}
                                                                taskType={taskType}
                                                                taskName={taskName}
                                                            />
                                                        </>
                                                    )}
                                                    {shouldAnswerBeValidated && (
                                                        <>
                                                            <ExampleContent
                                                                task={this.state.task}
                                                                example={this.state.example}
                                                                validatingQuestion={false}
                                                            />
                                                            <ExampleValidationActions
                                                                correct={answerState === CORRECT}
                                                                incorrect={answerState === INCORRECT}
                                                                flagged={answerState === FLAGGED}
                                                                validatorLabel={validatorLabel}
                                                                validatorHateType={validatorHateType}
                                                                creatorAttemptExplanation={creatorAttemptExplanation}
                                                                setCorrect={() => this.updateValidatorSelection({ answer: CORRECT })}
                                                                setIncorrect={() => this.updateValidatorSelection({ answer: INCORRECT })}
                                                                setFlagged={() => this.updateValidatorSelection({ answer: FLAGGED })}
                                                                setFlagReason={(flagReason) => this.setState({ flagReason })}
                                                                setValidatorLabel={(validatorLabel) => this.setState({ validatorLabel })}
                                                                setValidatorHateType={(validatorHateType) => this.setState({ validatorHateType })}
                                                                setCreatorAttemptExplanation={(creatorAttemptExplanation) => this.setState({ creatorAttemptExplanation })}
                                                                validatingQuestion={false}
                                                                isFlaggingAllowed={taskName !== "VQA"}
                                                                isOwner={this.state.isOwner}
                                                                example={this.state.example}
                                                                taskType={taskType}
                                                                taskName={taskName}
                                                            />
                                                        </>
                                                    )}
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                        <Card.Footer>
                                            <InputGroup className="align-items-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary t btn-sm"
                                                    onClick={() => this.submitValidation()}
                                                >
                                                    {" "}
                                                    Submit{" "}
                                                </button>
                                                {taskType !== "VQA" && (
                                                    <button
                                                        data-index={this.props.index}
                                                        onClick={this.getNewExample}
                                                        type="button"
                                                        className="btn btn-light btn-sm pull-right"
                                                    >
                                                        <i className="fas fa-undo-alt"></i>{" "}
                                                        Skip and load new example
                                                    </button>
                                                )}
                                                {taskTracker}
                                            </InputGroup>
                                        </Card.Footer>
                                    </Card>
                                </Card.Body>
                                {this.state.isOwner &&
                                    <WarningOwnerMode/>
                                }
                            </>
                        ) : (
                            <Card.Body className="p-3">
                                <Row>
                                    <Col xs={12} md={7}>
                                        <p>Loading Examples...</p>
                                    </Col>
                                </Row>
                            </Card.Body>
                        )
                    ) : (
                        <Card>
                            <Card.Body className="p-3">
                                <Row>
                                    <Col xs={12} md={7}>
                                        <p>No more examples to be verified.</p>
                                    </Col>
                                </Row>
                            </Card.Body>
                            <Card.Footer>
                                <InputGroup className="align-items-center">
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => this.submitValidation()}>
                                        Submit
                                    </button>
                                    {taskTracker}
                                </InputGroup>
                            </Card.Footer>
                        </Card>
                    )}
                </Card>
                {this.state.showErrorAlert && <ErrorAlert/>}
                {keyShortcuts}
            </>
        );
    }
}

export { AnnotatorInterface };
