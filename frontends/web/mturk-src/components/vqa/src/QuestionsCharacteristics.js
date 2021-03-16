import React from "react";

class InvalidQuestionCharacteristics extends React.Component {
  render() {
    return (
      <>
        <p>
          A question is considered <b>invalid</b> if any of the following
          conditions is met:
        </p>
        <ul className="mx-3" style={{ listStyleType: "disc" }}>
          <li>
            <b>The question does not require the image to answer.</b>
            <ul>
              <li>ie., What is the capital of the USA?</li>
            </ul>
          </li>
          <li>
            <b>The answer is not commonly known to other people.</b>
            <ul>
              <li>
                ie., "What is the name of this plant?" when very few people
                would be able to recognize the plant and know the name.
              </li>
            </ul>
          </li>
          <li>
            <b>
              The question is not based on the scene depicted in the image or
              the answer could not be provided correctly based on the image.
            </b>
            <ul>
              <li>
                ie., "What is the brand of the soap?" when the brand name of the
                soap is only partially visible from the image.
              </li>
              <li>
                ie., "What is the woman doing?" when there is no woman in the
                image.
              </li>
            </ul>
          </li>
        </ul>
      </>
    );
  }
}

class ValidQuestionCharacteristics extends React.Component {
  render() {
    return (
      <>
        <ul className="mx-3" style={{ listStyleType: "disc" }}>
          <li>The question requires the image to answer.</li>
          <ul>
            <li>Invalid: What is the capital of the USA?</li>
            <li>Valid: Which country does the flag in the image represent?</li>
          </ul>
          <li>
            Another person is likely to provide the same answer to the question.
          </li>
          <ul>
            <li>
              Invalid: What is the breed of this dog? (when the dog is barely
              visible or if few people would know the breed.)
            </li>
            <li>
              Valid: What are people waiting for? (when there is a train/bus
              station sign next to them.)
            </li>
          </ul>
          <li>
            The question is based on the scene depicted in the image. An answer{" "}
            <b>can</b> be provided.
          </li>
          <ul>
            <li>
              Invalid: What is the woman doing? (when there is no women or if
              there are multiple women each doing something different.)
            </li>
            <li>
              Valid: What is the woman to the left of the man doing? (when there
              is only one woman that satisfies the criteria and it is clear
              another person will agree with your answer to the question.)
            </li>
          </ul>
          <li>
            <b>
              Remember that most questions are tricky! Please use the image
              magnifier by hovering your mouse over the image to investigate.
            </b>
          </li>
        </ul>
      </>
    );
  }
}

export { InvalidQuestionCharacteristics, ValidQuestionCharacteristics };
