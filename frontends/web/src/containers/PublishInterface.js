/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardGroup,
  Button,
  Form,
} from "react-bootstrap";
import Markdown from "react-markdown";
import { Formik } from "formik";
import UserContext from "./UserContext";
import { OverlayProvider, BadgeOverlay } from "./Overlay";

class PublishInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: props.match.params.taskId,
      modelId: props.match.params.modelId,
      model: {},
      accuracy: "",
      scores: [],
      isPublished: false,
    };
  }
  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?&src=" +
          encodeURIComponent("/tasks/" + this.state.taskId + "/submit")
      );
    }
    const propState = this.props.location.state;
    if (!propState) {
      this.props.history.push("/");
      return;
    }
    this.setState({
      model: propState.detail,
      accuracy: (propState.detail && propState.detail.overall_perf) || "",
      scores: (propState.detail && propState.detail.scores) || [],
      isPublished: (propState.detail && propState.detail.isPublished) || false,
    });
  }
  handleValidation = (values) => {
    const errors = {};
    if (!values.name || values.name.trim() === "") {
      errors.name = "Required";
    }
    if (!values.description || values.description.trim() === "") {
      errors.description = "Required";
    }
    if (!values.params || values.params >>> 0 !== parseFloat(values.params)) {
      errors.params = "Required";
    }
    if (!values.languages || values.languages.trim() === "") {
      errors.languages = "Required";
    }
    if (!values.license || values.license.trim() === "") {
      values.license = "Required";
    }
    return errors;
  };
  handleSubmit = (values, { setSubmitting }) => {
    const reqObj = {
      modelId: this.state.model.id,
      name: values.name,
      description: values.description,
      params: values.params,
      languages: values.languages,
      license: values.license,
      model_card: values.model_card,
    };
    this.context.api.publishModel(reqObj).then(
      (result) => {
        if (!!result.badges) {
          this.setState({ showBadges: result.badges });
        } else {
          this.props.history.push({
            pathname: `/models/${this.state.model.id}`,
            state: { src: "publish" },
          });
        }
      },
      (error) => {
        console.log(error);
        setSubmitting(false);
      }
    );
  };

  render() {
    const { model } = this.state;
    let orderedScores = (model.scores || []).sort(
      (a, b) => a.round_id - b.round_id
    );

    let modelCardTemplate = `## Model Details
(Enter your model details here)

## Data
* Training data: (Enter your training data here)
* Evaluation data: (Enter your dev data here)

## Additional Information
(Enter additional information here)

## Ethical and Fairness Considerations
(Enter ethical and fairness considerations here)`;

    return (
      <OverlayProvider initiallyHide={true}>
        <BadgeOverlay
          badgeTypes={this.state.showBadges}
          show={!!this.state.showBadges}
          onHide={() => {
            this.setState({ showBadges: "" });
            this.props.history.push({
              pathname: `/models/${this.state.model.id}`,
              state: { src: "publish" },
            });
          }}
        ></BadgeOverlay>
        <Container>
          <Row>
            <h2 className="text-uppercase blue-color">Publish your model </h2>
          </Row>
          <Row>
            <CardGroup style={{ marginTop: 20, width: "100%" }}>
              <Card>
                <Card.Body>
                  <Container>
                    <Row className="mt-4">
                      <Col sm="4" className="mb-2">
                        <b>Your Performance</b>
                      </Col>
                      <Col sm="8">
                        <b>{model.overall_perf}%</b>
                      </Col>
                    </Row>
                    {orderedScores.map((data) => {
                      return (
                        <Row key={data.round_id}>
                          <Col sm="4" className="row-wise">
                            Round {data.round_id}
                          </Col>
                          <Col sm="7">{Number(data.accuracy).toFixed(2)}%</Col>
                        </Row>
                      );
                    })}
                  </Container>
                  {Object.keys(model).length ? (
                    <Formik
                      initialValues={{
                        name: model.name || "",
                        description: model.longdesc || "",
                        params: model.params || "",
                        languages: model.languages || "",
                        license: model.license || "",
                        model_card: model.model_card || modelCardTemplate,
                      }}
                      validate={this.handleValidation}
                      onSubmit={this.handleSubmit}
                    >
                      {({
                        values,
                        errors,
                        handleChange,
                        handleSubmit,
                        isSubmitting,
                      }) => (
                        <>
                          <form onSubmit={handleSubmit} className="mt-5 ml-2">
                            <Form.Group>
                              <Form.Label>
                                <b>Model Name</b>
                              </Form.Label>
                              <Form.Control
                                name="name"
                                type="text"
                                style={{
                                  borderColor: errors.name ? "red" : null,
                                }}
                                placeholder="Provide a name for your model"
                                onChange={handleChange}
                                value={values.name}
                              />
                            </Form.Group>
                            <Form.Group>
                              <Form.Label>
                                <b>Summary</b>
                              </Form.Label>
                              <Form.Control
                                name="description"
                                type="text"
                                style={{
                                  borderColor: errors.description
                                    ? "red"
                                    : null,
                                }}
                                placeholder="Provide a description of your model"
                                onChange={handleChange}
                                value={values.description}
                              />
                            </Form.Group>
                            <Form.Group>
                              <Form.Label>
                                <b>Number of Parameters</b>
                              </Form.Label>
                              <Form.Control
                                name="params"
                                type="int"
                                style={{
                                  borderColor: errors.params ? "red" : null,
                                }}
                                onChange={handleChange}
                                value={values.params}
                                aria-describedby="paramsHelpBlock"
                              />
                              <Form.Text id="paramsHelpBlock" muted>
                                <Markdown>
                                  To count the number of parameters, you can run
                                  `sum(p.numel() for p in model.parameters() if
                                  p.requires_grad)` in PyTorch.
                                </Markdown>
                              </Form.Text>
                            </Form.Group>
                            <Form.Group>
                              <Form.Label>
                                <b>Language(s)</b>
                              </Form.Label>
                              <Form.Control
                                name="languages"
                                type="text"
                                style={{
                                  borderColor: errors.languages ? "red" : null,
                                }}
                                placeholder="e.g. English, Chinese"
                                onChange={handleChange}
                                value={values.languages}
                              />
                            </Form.Group>
                            <Form.Group>
                              <Form.Label>
                                <b>License(s)</b>
                              </Form.Label>
                              <Form.Control
                                name="license"
                                type="text"
                                style={{
                                  borderColor: errors.license ? "red" : null,
                                }}
                                placeholder="e.g. Apache 2.0"
                                onChange={handleChange}
                                value={values.license}
                              />
                            </Form.Group>
                            <Form.Group>
                              <Form.Label>
                                <b>Model Card</b>
                              </Form.Label>
                              <Form.Control
                                as="textarea"
                                name="model_card"
                                defaultValue={values.model_card}
                                rows="12"
                                onChange={handleChange}
                              />
                              <Form.Text id="paramsHelpBlock" muted>
                                <Markdown>
                                  The text will be rendered as
                                  [markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
                                  in model page. For more details on [model
                                  cards](https://arxiv.org/abs/1810.03993).
                                </Markdown>
                              </Form.Text>
                            </Form.Group>

                            {model.is_published === "False" ? (
                              <Button
                                type="submit"
                                variant="primary"
                                className="fadeIn third submitBtn button-ellipse"
                                disabled={isSubmitting}
                              >
                                Publish
                              </Button>
                            ) : (
                              <Button
                                type="submit"
                                variant="primary"
                                className="fadeIn third submitBtn button-ellipse"
                                disabled={isSubmitting}
                              >
                                Update
                              </Button>
                            )}
                          </form>
                        </>
                      )}
                    </Formik>
                  ) : null}
                </Card.Body>
              </Card>
            </CardGroup>
          </Row>
        </Container>
      </OverlayProvider>
    );
  }
}

export default PublishInterface;
