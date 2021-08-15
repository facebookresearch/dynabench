import React from "react";
import AtomicImage from "./AtomicImage.js";
import { Card, Row, Col } from "react-bootstrap";

const FoolingExampleCard = (props) => {
  const mapExampleTypeToTasks = {
    question: ["QA", "VQA"],
    statement: ["Sentiment", "Hate Speech"],
    hypoythesis: ["NLI"],
  };

  const capitalizeFirstLetter = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  const getExampleType = (taskShortname) => {
    const exampleTypes = Object.keys(mapExampleTypeToTasks);
    for (let i = 0; i < exampleTypes.length; i++) {
      let type = exampleTypes[i];
      if (mapExampleTypeToTasks[type].includes(taskShortname)) {
        return capitalizeFirstLetter(type);
      }
    }
    return "Statement";
  };

  const getModelPredictionsText = () => {
    const taskType = props.task.type;
    let modelPreds = props.example.model_preds.split("|");
    if (taskType == "clf") {
      modelPreds = modelPreds.map((strProb) => parseFloat(strProb));
      const modelPredIdx = modelPreds.indexOf(Math.max(...modelPreds));
      return props.task.targets[modelPredIdx];
    } else if (taskType === "extract") {
      return modelPreds[1];
    } else if (taskType === "VQA") {
      return modelPreds[0];
    }
  };

  const getAnnotatorProposedAnswer = () => {
    if (props.task.type === "clf")
      return props.task.targets[parseInt(props.example.target_pred)];
    return props.example.target_pred;
  };

  return (
    <Card className="d-flex justify-content-center overflow-hidden">
      {props.task.has_context &&
        (props.task.type === "VQA" ? (
          <AtomicImage
            src={props.example.context.context}
            maxHeight={400}
            maxWidth={600}
          />
        ) : (
          <div className="mb-1 p-3 light-gray-bg">
            {props.example.context.context.replace("<br>", "\n")}
          </div>
        ))}
      <Card.Body>
        <Card className="hypothesis rounded border m-3 card">
          <Card.Body className="p-3">
            <Row>
              <Col>
                <h6 className="text-uppercase dark-blue-color spaced-header">
                  {getExampleType(props.task.shortname)}
                </h6>
                {<p>{props.example.text}</p>}
                <h6 className="text-uppercase dark-blue-color spaced-header">
                  Model predictions
                </h6>
                <p>{getModelPredictionsText()}</p>
                <h6 className="text-uppercase dark-blue-color spaced-header">
                  Annotator's proposed answer
                </h6>
                <p>{getAnnotatorProposedAnswer()}</p>
                {props.example.example_explanation && (
                  <>
                    <h6 className="text-uppercase dark-blue-color spaced-header">
                      Example explanation{" "}
                      <small>(why target label is correct)</small>
                    </h6>
                    <p>{props.example.example_explanation}</p>
                  </>
                )}
                {props.example.model_explanation && (
                  <>
                    <h6 className="text-uppercase dark-blue-color spaced-header">
                      Model explanation <small>( why model was fooled )</small>
                    </h6>
                    <p>{props.example.model_explanation}</p>
                  </>
                )}
                {props.example.metadata_json &&
                  JSON.parse(props.example.metadata_json).hasOwnProperty(
                    "hate_type"
                  ) && (
                    <>
                      <h6 className="text-uppercase dark-blue-color spaced-header">
                        Hate Target:
                      </h6>
                      <p>{JSON.parse(props.example.metadata_json).hate_type}</p>
                    </>
                  )}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Card.Body>
    </Card>
  );
};

export { FoolingExampleCard };
