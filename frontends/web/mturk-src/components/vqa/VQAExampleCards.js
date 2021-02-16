import React from 'react';
import {
    Card,
    Row,
    Button,
    InputGroup,
    Col
} from 'react-bootstrap';
import AtomicImage from "../../../src/containers/AtomicImage.js";
import { VQAValidInvalidExamples } from "./OnboardingInfo/VQAValidInvalidExamples.js";

class VQAExampleCards extends React.Component {

    constructor() {
        super();
        this.examples = VQAValidInvalidExamples;
        this.state = {
            currIdx: 0,
            showInstructions: true,
        }
    }

    getNextExample = () => {

        if (this.state.currIdx < this.examples.length - 1) {
            this.setState({
                currIdx: this.state.currIdx + 1,
            }, () => {
                if (this.state.currIdx >= this.examples.length - 1) {
                    this.props.setPhaseCompleted();
                }
            });
        }
    }

    getPrevExample = () => {
        if (this.state.currIdx > 0) {
            this.setState(state => {
                return { currIdx: state.currIdx - 1 };
            });
        }
    }

    render() {
        let phaseInstructionsButton = <></>;
        if (this.state.showInstructions) {
            phaseInstructionsButton = <Button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: false })}}>Hide Instructions</Button>
        } else {
            phaseInstructionsButton = <Button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: true })}}>Show Instructions</Button>
        }
        const phaseTitle = <h4>Examples</h4>
        const phaseInstructions = this.state.showInstructions ?
            <div>
                <p>
                    In this section we show a bunch of examples of <b>valid</b> and <b>invalid</b> questions.
                    A valid question is one that needs the image to determine the answer, and the image is sufficient
                    to determine the answer. An invalid question is one that does not need the image, or where the
                    question can not be answered from the image.
                    For each example below, we show an <b>image</b>, a <b>question</b> and a <b>description</b> of why
                    the question is valid or invalid. Additionally, for the valid questions we include
                    the answer the AI produced, and whether the answer was correct or not.
                </p>
                <p>
                    Please go through each example carefully.
                </p>
            </div>
        :   <></>

        const exampleSelector = <InputGroup>
            <Button
                className="btn btn-sm btn-success"
                onClick={this.getPrevExample}
                disabled={this.state.currIdx === 0}>
                    Previous Example
            </Button>
            <Button
                className="btn btn-sm btn-success"
                style={{ marginLeft: 5 }}
                onClick={this.getNextExample}
                disabled={this.state.currIdx === this.examples.length - 1}>
                    Next Example
            </Button>
        </InputGroup>
        const exampleTracker = <small style={{ padding: 7 }}>Example: {this.state.currIdx + 1} / {this.examples.length}</small>
        return (
            <>
                {phaseTitle}
                {phaseInstructionsButton}
                {phaseInstructions}
                    <Card className="d-flex justify-content-center overflow-hidden" style={{ height: "auto" }}>
                        <Card.Header className="mb-2">
                            <h5 className="text-uppercase dark-blue-color spaced-header">
                                {this.examples[this.state.currIdx].isValid ? "Valid Question" : "Invalid Question"}
                            </h5>
                        </Card.Header>
                        <AtomicImage src={this.examples[this.state.currIdx]['imageUrl']} maxWidth={600} maxHeight={400}/>
                        <Card.Body className="overflow-auto pt-2" style={{ height: "auto" }}>
                            <Card
                                className="hypothesis rounded border m-3 card"
                                style={{ minHeight: 120 }}>
                                <Card.Body className="p-3">
                                    <Row>
                                        <Col>
                                            <h6 className="text-uppercase dark-blue-color spaced-header">
                                                Question:
                                            </h6>
                                            <p>
                                                <small>{this.examples[this.state.currIdx]['question']}</small>
                                            </p>
                                            <h6 className="text-uppercase dark-blue-color spaced-header">
                                                Why is this a {this.examples[this.state.currIdx].isValid ? (
                                                    "valid"
                                                    ) : (
                                                        "invalid"
                                                        )} question?
                                            </h6>
                                            <p>
                                                <small>{this.examples[this.state.currIdx]['explanation']}</small>
                                            </p>
                                            {this.examples[this.state.currIdx].isValid && (
                                                <>
                                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                                        AI Answer:
                                                    </h6>
                                                    <p>
                                                        <small>{this.examples[this.state.currIdx]['modelAns']}</small>
                                                    </p>
                                                </>
                                            )}
                                            {this.examples[this.state.currIdx].isValid && (
                                                <>
                                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                                        Determine if AI is correct or not:
                                                    </h6>
                                                    <p>
                                                        <small>{this.examples[this.state.currIdx]['userFeedback'][0]}</small>
                                                    </p>
                                                    {this.examples[this.state.currIdx]['userFeedback'][0] === "Incorrect" && (
                                                        <>
                                                            <h6 className="text-uppercase dark-blue-color spaced-header">
                                                                Provide the correct answer:
                                                            </h6>
                                                            <p>
                                                                <small>{this.examples[this.state.currIdx]['userFeedback'][1]}</small>
                                                            </p>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Card.Body>
                        <Card.Footer>
                            {exampleSelector}
                        </Card.Footer>
                    </Card>
                    {exampleTracker}
            </>
        )
    }
}

export { VQAExampleCards };
