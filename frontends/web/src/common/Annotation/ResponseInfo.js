/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Row, Col, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import UserContext from "../../containers/UserContext";
import "./CreateInterface.css";
import AnnotationComponent from "./AnnotationComponent.js";
import initializeData from "./InitializeAnnotationData.js";

class ResponseInfo extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.retractExample = this.retractExample.bind(this);
    this.flagExample = this.flagExample.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.updateModelWrong = this.updateModelWrong.bind(this);
    this.state = {
      metadata: {},
      modelWrong: this.props.obj.modelWrong,
    };
  }
  componentDidMount() {
    const metadata = {};
    this.props.annotationConfig.metadata.create
      .filter(
        (annotationConfigObj) =>
          annotationConfigObj.model_wrong_condition === undefined ||
          annotationConfigObj.model_wrong_condition === this.state.modelWrong
      )
      .forEach((annotationConfigObj) => {
        initializeData(metadata, annotationConfigObj);
      });
    this.setState({
      metadata: metadata,
      exampleUpdated: null,
      feedbackSaved: null,
    });
  }

  updateMetadata() {
    const nonNullMetadata = {};
    this.props.annotationConfig.metadata.create
      .filter(
        (annotationConfigObj) =>
          annotationConfigObj.model_wrong_condition === undefined ||
          annotationConfigObj.model_wrong_condition === this.state.modelWrong
      )
      .forEach((annotationConfigObj) => {
        if (this.state.metadata[annotationConfigObj.name] !== null) {
          nonNullMetadata[annotationConfigObj.name] =
            this.state.metadata[annotationConfigObj.name];
        }
      });
    this.context.api.updateExample(this.props.exampleId, {
      metadata: nonNullMetadata,
    });
  }

  updateModelWrong(modelWrong) {
    if (this.props.obj.livemode) {
      this.context.api
        .updateExample(this.props.exampleId, {
          model_wrong: modelWrong,
        })
        .then(
          (result) => this.setState({ modelWrong: modelWrong }),
          (error) => {
            console.log(error);
          }
        );
    } else {
      this.setState({ modelWrong: modelWrong });
    }
  }

  retractExample(e) {
    e.preventDefault();
    var idx = e.target.getAttribute("data-index");
    this.context.api.retractExample(this.props.exampleId).then(
      (result) => {
        const newContent = this.props.content.slice();
        newContent[idx].cls = "retracted";
        newContent[idx].retracted = true;
        this.setState({ content: newContent });
      },
      (error) => {
        console.log(error);
      }
    );
  }
  flagExample(e) {
    e.preventDefault();
    var idx = e.target.getAttribute("data-index");
    this.context.api.flagExample(this.props.exampleId).then(
      (result) => {
        const newContent = this.props.content.slice();
        newContent[idx].cls = "flagged";
        newContent[idx].flagged = true;
        this.setState({ content: newContent });
      },
      (error) => {
        console.log(error);
      }
    );
  }

  render() {
    let sandboxContent = null;
    if (!this.props.obj.livemode) {
      sandboxContent = (
        <div className="mt-3">
          This example was not stored because you are in sandbox mode.
          {!this.context.api.loggedIn() && (
            <div>
              <Link
                to={
                  "/register?msg=" +
                  encodeURIComponent(
                    "Please sign up or log in so that you can get credit for your generated examples."
                  ) +
                  "&src=" +
                  encodeURIComponent(`/tasks/${this.props.taskCode}/create`)
                }
              >
                Sign up now
              </Link>{" "}
              to make sure your examples are stored and you get credit for your
              examples!
            </div>
          )}
        </div>
      );
    }

    const inputInterface = this.props.annotationConfig.input.map(
      (annotationConfigObj) => (
        <AnnotationComponent
          displayName={annotationConfigObj.display_name}
          className="name-display-secondary"
          key={annotationConfigObj.name}
          name={annotationConfigObj.name}
          data={this.props.obj.input}
          type={annotationConfigObj.type}
          constructorArgs={annotationConfigObj.constructor_args}
        />
      )
    );

    const targetInterface = this.props.annotationConfig.target.map(
      (annotationConfigObj) => (
        <AnnotationComponent
          displayName={annotationConfigObj.display_name}
          className="name-display-secondary"
          key={annotationConfigObj.name}
          name={annotationConfigObj.name}
          data={this.props.obj.target}
          type={annotationConfigObj.type}
          constructorArgs={annotationConfigObj.constructor_args}
        />
      )
    );

    const outputToCompareToTargetInterface =
      this.props.obj.url !== null &&
      this.props.annotationConfig.target.map((annotationConfigObj) => (
        <AnnotationComponent
          displayName={annotationConfigObj.display_name}
          className="name-display-secondary"
          key={annotationConfigObj.name}
          name={annotationConfigObj.name}
          data={this.props.obj.output}
          type={annotationConfigObj.type}
          constructorArgs={annotationConfigObj.constructor_args}
        />
      ));

    const otherModelOutputInterface =
      this.props.obj.url === null &&
      this.props.annotationConfig.output
        .filter(
          (annotationConfigObj) =>
            !this.props.annotationConfig.target
              .map((annotationConfigObjT) => annotationConfigObjT.name)
              .includes(annotationConfigObj.name)
        )
        .map((annotationConfigObj) => (
          <AnnotationComponent
            displayName={annotationConfigObj.display_name}
            className="name-display-secondary"
            key={annotationConfigObj.name}
            name={annotationConfigObj.name}
            data={this.props.obj.output}
            type={annotationConfigObj.type}
            constructorArgs={annotationConfigObj.constructor_args}
          />
        ));

    const metadataInterface = this.props.annotationConfig.metadata.create
      .filter(
        (annotationConfigObj) =>
          annotationConfigObj.model_wrong_condition === undefined ||
          annotationConfigObj.model_wrong_condition === this.state.modelWrong
      )
      .map((annotationConfigObj) => (
        <AnnotationComponent
          displayName={annotationConfigObj.display_name}
          className="user-input-secondary"
          key={annotationConfigObj.name}
          create={true}
          name={annotationConfigObj.name}
          data={this.state.metadata}
          setData={(data) =>
            this.setState({ metadata: data, exampleUpdated: false })
          }
          type={annotationConfigObj.type}
          constructorArgs={annotationConfigObj.constructor_args}
        />
      ));

    var classNames = this.props.obj.cls + " rounded border m-3";

    var userFeedback = (
      <>
        {this.props.obj.livemode &&
          (this.state.modelWrong !== null || this.props.obj.url === null) &&
          metadataInterface.length > 0 && (
            <div className="mt-3">
              <span>You can enter more info for your example:</span>
              <button
                onClick={() => {
                  this.updateMetadata();
                  this.setState({ exampleUpdated: true });
                }}
                type="button"
                style={{ float: "right", margin: "5px" }}
                className="btn btn-outline-primary btn-sm "
                disabled={this.state.exampleUpdated}
              >
                {this.state.exampleUpdated ? "Saved!" : "Save Info"}
              </button>
              {metadataInterface}
            </div>
          )}
      </>
    );

    var title = null;
    var modelCorrectQuestion = null;
    if (this.props.obj.retracted) {
      classNames += " response-warning";
      userFeedback = null;
      title = (
        <span>
          <strong>Example retracted</strong> - thanks
        </span>
      );
    } else if (this.props.obj.flagged) {
      classNames += " response-warning";
      userFeedback = null;
      title = (
        <span>
          <strong>Example flagged</strong> - thanks
        </span>
      );
    } else {
      if (this.props.obj.url === null) {
        title = (
          <span>
            <strong>Thank you for your example</strong>
          </span>
        );
      } else {
        if (this.state.modelWrong === null) {
          classNames += " light-gray-bg";
          modelCorrectQuestion = (
            <span>
              <strong>Is the model correct?</strong>
              <br />
              <div className="btn-group" role="group" aria-label="model wrong">
                <button
                  data-index={this.props.index}
                  onClick={() => this.updateModelWrong(false)}
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                >
                  Correct
                </button>
                <button
                  data-index={this.props.index}
                  onClick={() => this.updateModelWrong(true)}
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                >
                  Incorrect
                </button>
              </div>
            </span>
          );
        } else {
          if (this.state.modelWrong) {
            classNames += " light-green-bg";
            title = (
              <span>
                <strong>You fooled the model!</strong>
              </span>
            );
          } else {
            classNames += " response-warning";
            title = (
              <span>
                <strong>You didn't fool the model. Please try again!</strong>
              </span>
            );
          }
        }
      }
    }

    const submissionResults = (
      <Row>
        <Col>
          <nobr>The model predicted</nobr>
        </Col>
        <Col className="text-center">
          <strong>{outputToCompareToTargetInterface}</strong>
        </Col>
        <Col>
          <nobr>and you say</nobr>
        </Col>
        <Col className="text-center">
          <strong>{targetInterface}</strong>
        </Col>
      </Row>
    );

    const submissionResultsNoModel = (
      <Row>
        <Col>
          <nobr>You say</nobr>
        </Col>
        <Col className="text-center">
          <strong>{targetInterface}</strong>
        </Col>
        <Col>
          <nobr>given the input</nobr>
        </Col>
        <Col className="text-center">
          <strong>{inputInterface}</strong>
        </Col>
      </Row>
    );

    const submissionResultsNoTarget = (
      <Row>
        <Col>
          <nobr>The model predicted</nobr>
        </Col>
        <Col className="text-center">
          <strong>{otherModelOutputInterface}</strong>
        </Col>
        <Col>
          <nobr>given the input</nobr>
        </Col>
        <Col className="text-center">
          <strong>{inputInterface}</strong>
        </Col>
      </Row>
    );

    return (
      <Card className={classNames} style={{ minHeight: 120 }}>
        <Card.Body className="p-3">
          {this.props.obj.url === null ? (
            <Row>
              <Col xs={12} md={9}>
                {title !== null && <div className="mb-3">{title}</div>}
                {submissionResultsNoModel}
                {userFeedback}
                {sandboxContent}
              </Col>
              <Col className="text-center" xs={12} md={3}></Col>
            </Row>
          ) : targetInterface.length > 0 ? (
            <Row>
              <Col xs={12} md={9}>
                {title !== null && <div className="mb-3">{title}</div>}
                {modelCorrectQuestion !== null && (
                  <div className="mb-3">{modelCorrectQuestion}</div>
                )}
                <div className="mb-3">
                  <strong>{inputInterface}</strong>
                </div>
                {submissionResults}
                {userFeedback}
                {sandboxContent}
              </Col>
              <Col className="text-center" xs={12} md={3}>
                {otherModelOutputInterface}
              </Col>
            </Row>
          ) : (
            <Row>
              <Col xs={12} md={9}>
                {title !== null && <div className="mb-3">{title}</div>}
                {submissionResultsNoTarget}
                {modelCorrectQuestion !== null && (
                  <div className="mb-3">{modelCorrectQuestion}</div>
                )}
                {userFeedback}
                {sandboxContent}
              </Col>
              <Col className="text-center" xs={12} md={3}></Col>
            </Row>
          )}
        </Card.Body>
        {!this.props.obj.retracted &&
          !this.props.obj.flagged &&
          this.props.obj.livemode && (
            <Card.Footer>
              {
                <div
                  className="btn-group"
                  role="group"
                  aria-label="response actions"
                >
                  <OverlayTrigger
                    placement="top"
                    delay={{ show: 250, hide: 400 }}
                    overlay={(props) => (
                      <Tooltip {...props}>
                        If you made a mistake, you can retract this entry from
                        the dataset.
                      </Tooltip>
                    )}
                  >
                    <button
                      data-index={this.props.index}
                      onClick={this.retractExample}
                      type="button"
                      className="btn btn-light btn-sm"
                    >
                      <i className="fas fa-undo-alt"></i> Retract
                    </button>
                  </OverlayTrigger>
                  <OverlayTrigger
                    placement="top"
                    delay={{ show: 250, hide: 400 }}
                    overlay={(props) => (
                      <Tooltip {...props}>
                        Something wrong? Flag this example and we will take a
                        look.
                      </Tooltip>
                    )}
                  >
                    <button
                      data-index={this.props.index}
                      onClick={this.flagExample}
                      type="button"
                      className="btn btn-light btn-sm"
                    >
                      <i className="fas fa-flag"></i> Flag
                    </button>
                  </OverlayTrigger>
                </div>
              }
            </Card.Footer>
          )}
      </Card>
    );
  }
}

export default ResponseInfo;
