import React from "react";
import {Button} from "react-bootstrap";


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


class ExampleGoodCards extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            curExample: null,
            show: false
        }

        this.data = [
            {
                passage: "Family members and friends told Fox News that the couple had been fighting over several things, including Luong's girlfriend, on Sunday evening, and Monday morning. Luong later drove off with his four children, whom he reported missing to the police and claimed he had left them with his girlfriend who lives in a hotel. Police however became suspicious due to \"holes in his story\" and he later changed his story. The Associated Press says that the authorities believe that Dauphin Island Bridge is where Luong threw the four children, of which he was the biological father of three, into the water.",
                hypothesis: "Luong put holes in his story on purpose because the police were suspicious of him.",
                targetLabel: 2,
                modelPrediction: [0.001, 0.998, 0.001],
                labelExplanation: "The police became suspicious because of the holes. Luong didn't put holes in his story because the police become suspicious. The causal relation is reversed.",
                modelExplanation: "The model probably made a mistake because of the added accurate statement that the police were suspicious of him.",
            },
            {
                passage: "CHICAGO (AP) — Nicole Branagh and Jenny Kropp won the AVP Kingston Chicago Open on Sunday, beating Kim DiCello and Kendra Van Zwieten 21-16, 21-19. After falling to the second-seeded DiCello and Van Zwieten in the third round of the double-elimination tournament Saturday, Branagh and Kropp rebounded to set up the rematch. The title was Kropp s first, and Branagh s 17th. Brad Keenan and Ty Tramblie won the men s title in their first event together, beating top-seeded Ryan Doherty and John Mayer 21-19, 22-20.",
                hypothesis: "Ryan Doherty won the tournament in Chicago.",
                targetLabel: 1,
                modelPrediction: [0.998, 0.001, 0.001],
                labelExplanation: "Doherty and Mayer did compete in the tournament in Chicago, and the article talks about other people winning.",
                modelExplanation: "The model might be confused about Ryan Doherty with other people who actually won.",
            },
            {
                passage: "Kevin Vincent, 44, of Arlington, Va., said his wife buys store brand acetaminophen and he wanted to find out more about the problem.",
                hypothesis: "Kevin was a middle-aged man who bought store brand acetaminophen.",
                targetLabel: 2,
                modelPrediction: [0.6658, 0.1804, 0.1538],
                labelExplanation: "Kevin's wife bought the store brand acetaminophen, not him. And the fact that he thought it was a problem, means he would not buy it.",
                modelExplanation: "A part of the statement was correct (Kevin was a middle-aged man) and the other part was in a complex sentence (relative clause). The model might make a mistake because of the correct part.",
            },
            {
                passage: "I found out my cat is pregnant. I had no idea why she was making all these funny noises. She would hide a lot under my bed. A friend told me this behavior was of a pregnant animal. I cannot wait to see the kittens.",
                hypothesis: "The woman is pregnant and has a cat.",
                targetLabel: 1,
                modelPrediction: [0.8643, 0.0032, 0.1325],
                labelExplanation: "The woman does have a cat, but it is not known whether she is pregnant or not.",
                modelExplanation: "The context and premise have a lot of word overlap. This might lead to the model give a wrong prediction to “definitely correct”. And also maybe because \"the women are pregnant\" may have a high joint distribution.",
            },
            {
                passage: "I found out my cat is pregnant. I had no idea why she was making all these funny noises. She would hide a lot under my bed. A friend told me this behavior was of a pregnant animal. I cannot wait to see the kittens.",
                hypothesis: "The woman is pregnant and has a cat.",
                targetLabel: 1,
                modelPrediction: [0.8643, 0.0032, 0.1325],
                labelExplanation: "The woman does have a cat, but it is not known whether she is pregnant or not.",
                modelExplanation: "The context and premise have a lot of word overlap. This might lead to the model give a wrong prediction to “definitely correct”. And also maybe because \"the women are pregnant\" may have a high joint distribution.",
            }
        ]

        this.label_mappiing = {
            0: "Definitely Correct",
            1: "neither Definitely Correct nor Definitely Incorrect",
            2: "Definitely Incorrect",
        }
    }

    showExample = () => {
        const randomIndex = getRandomInt(this.data.length)
        this.setState({
            curExample: this.data[randomIndex],
            show: true
        })
        console.log(this)
        console.log(this.state)
        // randomly pick one example
    }

    render() {
        const showExampleButtonText = this.state.show ?  "Switch Example" : "Show Example"
        const showExampleButton = <Button className="btn btn-primary btn-success" onClick={this.showExample}>{showExampleButtonText}</Button>
        const hideExampleButton = <Button className="btn btn-primary btn-success" onClick={() => this.setState({show: false, curExample: null})}>Hide Example</Button>

        let curExamplePanel = <div></div>
        if (this.state.curExample !== null) {
            curExamplePanel = <div className="card">
                <div className="card-body">
                    <div style={{color: "blue"}} className="card-text">
                        <strong>Passage:</strong> {this.state.curExample.passage}
                    </div>
                    <div style={{color: "red"}} className="card-text">
                        <strong>Based on the passage, write a hypothesis that
                            is <u>{this.label_mappiing[this.state.curExample.targetLabel]}</u></strong>: {this.state.curExample.hypothesis}
                    </div>
                    <div style={{color: "blue"}} className="card-text">
                        <strong>The AI system thinks that your hypothesis is:</strong>
                        <ul>
                            <li>Definitely Correct: {(this.state.curExample.modelPrediction[0] * 100).toFixed(2)} %</li>
                            <li>Definitely Incorrect: {(this.state.curExample.modelPrediction[2] * 100).toFixed(2)} %</li>
                            <li>Neither: {(this.state.curExample.modelPrediction[1] * 100).toFixed(2)} %</li>
                        </ul>
                    </div>
                    <div style={{color: "red"}} className="card-text">
                        <strong>Why do you think the hypothesis
                        is <u>{this.label_mappiing[this.state.curExample.targetLabel]}</u></strong>: {this.state.curExample.labelExplanation}
                    </div>

                    <div style={{color: "red"}} className="card-text">
                        <strong>Why do you think the model gives the wrong prediction</strong>: {this.state.curExample.modelExplanation}
                    </div>

                </div>
                <div className="card-text text-muted">
                    The text in the <span style={{color: "blue"}}>blue</span> is what you will be provided in the HITs.<br />
                    The text in the <span style={{color: "red"}}>red</span> <u>is what we would like you to write.</u><br />
                    Please follow the instructions in the HITs and give the responses according.
                </div>
            </div>
        }

        return <React.Fragment>
            <div>Click the Button to show an example. We hope that the examples can help you understand the task and get inspired if you find it hard to fool the AI.</div>
            {showExampleButton}&nbsp;&nbsp;{hideExampleButton}
            {curExamplePanel}
            </React.Fragment>
    }
}

export { ExampleGoodCards }