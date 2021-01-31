import React from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap'
import AtomicImage from "../../../src/containers/AtomicImage"

const getRandomIndex = max => Math.floor(Math.random() * Math.floor(max));

class VQAExamples extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            currIdx: null,
        }
    }

    render() {
        const examples = [
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000314727.jpg",
                question: "How many people are in the bathroom?",
                modelAns: "2",
                userFeedback: ["Incorrect", "1"],
                explanation: "This example requires not only image processing but also abstract reasoning to realize that although two human figures are shown there is only one person in the bathroom, the other figure is only his reflection."
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000446014.jpg",
                question: "What is the mood of the girl?",
                modelAns: "happy",
                userFeedback: ["Incorrect", "sad"],
                explanation: "The example is complex because to determine the mood the AI needs to analyze the facial expressions of the girl. However the answer is obvious for another person."
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000202153.jpg",
                question: "What is the name of the street?",
                modelAns: "Broadway",
                userFeedback: ["Incorrect", "Victoria"],
                explanation: "In this case, to get the correct answer it is needed to establish a relation betweeen the green sign with white letters and the street. The sign is not the most flagrant object in the image, so this could make it harder for the AI."
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000240927.jpg",
                question: "Why is a police patrol in the image?",
                modelAns: "traffic",
                userFeedback: ["Incorrect", "crash"],
                explanation: "This question requires interpreting the situation in the image to get the correct answer. The police patrol is behind a black SUV with the dented hood. It can be assumed that the police officer is moderating the situation."
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000554450.jpg",
                question: "What is the profession of these men?",
                modelAns: "jockey",
                userFeedback: ["Incorrect","Police officer"],
                explanation: "To get the correct answer the AI needs to extract information from the image, for example the uniforms the men are wearing, the fact that they are riding horses and bikes and even the fact that the bikes have a sign with the word \"POLICE\"."
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000554625.jpg",
                question: "What does the boy have in his right hand?",
                modelAns: "Mouse",
                userFeedback: ["Correct", null],
                explanation: "This is an interesting question because it requires that the AI differentiates between the right and left hands. In this case the model was right so there is no need to provide an answer, just selecting the \"Correct\" button"
            }
        ]
        const showExampleButtonText = this.state.currIdx === null ? "Show Example" : "Next Example";
        const showExampleButton = <Button
                className="btn btn-primary btn-success my-3"
                style={{ marginRight: 5 }}
                onClick={() => this.setState({currIdx: getRandomIndex(examples.length)})}>
                {showExampleButtonText}
            </Button>
        const hideExampleButton = <Button
                className="btn btn-primary btn-success my-3"
                onClick={() => this.setState({currIdx: null})}>
                    Hide Example
                </Button>
        return (

            <React.Fragment>
                <div className="px-0">
                    <h3>Examples</h3>
                    <div>Click the "Show Example" button to get some examples of the workflow of the task. </div>
                    {showExampleButton}
                    {hideExampleButton}
                    {this.state.currIdx !== null &&
                        <Card className="pr-2" style={{ width: "70%"}}>
                            <Row>
                                <Col className="d-flex justify-content-center my-auto" md={5}>
                                    <img src={examples[this.state.currIdx]['imageUrl']} style={{ maxHeight: 350 }}/>
                                </Col>
                                <Col className="my-auto" md={7}>
                                    <Card.Body>
                                        <p>
                                            <strong>Question:</strong><br/>
                                            <span>{examples[this.state.currIdx]['question']}</span>
                                        </p>
                                        <p>
                                            <strong>Why this is a good question?</strong><br/>
                                            <span>{examples[this.state.currIdx]['explanation']}</span>
                                        </p>
                                        <p>
                                            <strong>AI Response:</strong><br/>
                                            <span>{examples[this.state.currIdx]['modelAns']}</span>
                                        </p>
                                        <p>
                                            <strong>Determine if AI is correct or not:</strong><br/>
                                            <span>{examples[this.state.currIdx]['userFeedback'][0]}</span>
                                        </p>
                                        {examples[this.state.currIdx]['userFeedback'][0] === "Incorrect" &&
                                            <p>
                                                <strong>Provide the correct answer:</strong><br/>
                                                <span>{examples[this.state.currIdx]['userFeedback'][1]}</span>
                                            </p>
                                        }
                                    </Card.Body>
                                </Col>
                            </Row>
                        </Card>
                    }
                </div>
            </React.Fragment>

        )
    }
}

export { VQAExamples }
