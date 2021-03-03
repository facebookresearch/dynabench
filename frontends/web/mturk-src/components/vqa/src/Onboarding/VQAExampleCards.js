import React from "react";
import { Button, Carousel } from "react-bootstrap";
import { WarningMessage } from "../WarningMessage.js";
import ExampleCard from "./ExampleCard.js";
import { InvalidQuestionCharacteristics } from "../QuestionsCharacteristics.js";
import getVQAValidInvalidExamples from "./Examples/VQAValidInvalidExamples.js";

class VQAExampleCards extends React.Component {
  constructor(props) {
    super(props);
    this.examples = getVQAValidInvalidExamples(this.props.onboardingMode);
    this.state = {
      currIdx: 0,
      showInstructions: true,
    };
  }

  handleSelect = (selectedIndex, e) => {
    this.setState(
      {
        currIdx: selectedIndex,
      },
      () => {
        if (this.state.currIdx >= this.examples.length - 1) {
          this.props.setPhaseCompleted();
        }
      }
    );
  };

  render() {
    let phaseInstructionsButton = <></>;
    if (this.state.showInstructions) {
      phaseInstructionsButton = (
        <Button
          className="btn btn-info mb-3"
          onClick={() => {
            this.setState({ showInstructions: false });
          }}
        >
          Hide Instructions
        </Button>
      );
    } else {
      phaseInstructionsButton = (
        <Button
          className="btn btn-info mb-3"
          onClick={() => {
            this.setState({ showInstructions: true });
          }}
        >
          Show Instructions
        </Button>
      );
    }
    const phaseTitle = <h4>Examples</h4>;
    const phaseInstructions = this.state.showInstructions ? (
      <div>
        <p>
          In this section please carefully go through each example of{" "}
          <b>valid</b> and <b>invalid</b> questions.
        </p>
        <InvalidQuestionCharacteristics />
        <p>
          For each example below, we show an <b>image</b>, a <b>question</b> and
          a <b>description</b> of why the question is valid or invalid.
          Additionally, for the valid questions we include the answer
          {this.props.onboardingMode === "creation" ? " the AI produced" : ""},
          and whether the answer was correct or not.
        </p>
        <p>
          <b>Please go through each example carefully.</b>
        </p>
      </div>
    ) : (
      <></>
    );
    const exampleCards = this.examples.map((example) => (
      <Carousel.Item>
        <ExampleCard
          example={example}
          onboardingMode={this.props.onboardingMode}
        />
      </Carousel.Item>
    ));
    const exampleTracker = (
      <small style={{ padding: 7 }}>
        Example: {this.state.currIdx + 1} / {this.examples.length}
      </small>
    );
    return (
      <>
        {phaseTitle}
        {phaseInstructionsButton}
        {phaseInstructions}
        <WarningMessage />
        <Carousel
          activeIndex={this.state.currIdx}
          interval={null}
          wrap={false}
          onSelect={this.handleSelect}
        >
          {exampleCards}
        </Carousel>
        {exampleTracker}
      </>
    );
  }
}

export { VQAExampleCards };
