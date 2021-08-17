import React, { useContext, useEffect, useState } from "react";
import { Annotation } from "../../containers/Overlay";
import UserContext from "../../containers/UserContext";
import {
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  DropdownButton,
  Form,
  InputGroup,
  Modal,
  Row,
} from "react-bootstrap";
import { Formik } from "formik";
import DragAndDrop from "../DragAndDrop/DragAndDrop";

const TaskOwnerConsole = (props) => {
  const context = useContext(UserContext);

  const [showTaskOwnerSettingsModal, setShowTaskOwnerSettingsModal] =
    useState(false);
  const [validateNonFooling, setValidateNonFooling] = useState(false);
  const [numMatchingValidations, setNumMatchingValidations] = useState(3);

  useEffect(() => {
    getSavedTaskSettings();
  }, [props.task]);

  useEffect(() => {
    updateTaskSettings();
  }, [validateNonFooling, numMatchingValidations]);

  const getSavedTaskSettings = () => {
    if (props.task.settings_json) {
      const settings_json = JSON.parse(props.task.settings_json);
      setValidateNonFooling(
        settings_json.hasOwnProperty("validate_non_fooling")
          ? settings_json["validate_non_fooling"]
          : false
      );
      setNumMatchingValidations(
        settings_json.hasOwnProperty("num_matching_validations")
          ? settings_json["num_matching_validations"]
          : 3
      );
    } else {
      setValidateNonFooling(false);
      setNumMatchingValidations(3);
    }
  };

  const updateTaskSettings = () => {
    if (!props.task.id) {
      return;
    }
    context.api.updateTaskSettings(props.task.id, {
      validate_non_fooling: validateNonFooling,
      num_matching_validations: numMatchingValidations,
    });
  };

  const exportAllTaskData = () => {
    return context.api.exportData(props.task.id);
  };

  const exportCurrentRoundData = () => {
    return context.api.exportData(props.task.id, props.task.cur_round);
  };

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const handleValidation = (values) => {
    const errors = {};
    let allowedTaskExtension = ".jsonl";
    const allowedExtensions = new RegExp(
      escapeRegExp(allowedTaskExtension) + "$",
      "i"
    );

    if (!values.file) {
      errors.file = "Required";
      values.result = "";
    } else if (!allowedExtensions.exec(values.file.name)) {
      errors.file =
        "Invalid file type - Please upload in " +
        allowedTaskExtension +
        " format";
      values.result = "";
    }
    return errors;
  };

  const handleSubmit = (values, { setFieldValue, setSubmitting }) => {
    const reqObj = {
      taskId: props.task.id,
      file: values.file,
    };
    context.api.submitContexts(reqObj).then(
      (result) => {
        setSubmitting(false);
        setFieldValue("file", null, false);
        setFieldValue("result", "Submitted!", false);
      },
      (error) => {
        setSubmitting(false);
        setFieldValue("result", "Failed To Submit. Plese try again");
        console.log(error);
      }
    );
  };

  return context.api.isTaskOwner(context.user, props.task.id) ||
    context.user.admin ? (
    <>
      <Annotation
        placement="top"
        tooltip="Click to adjust your owner task settings"
      >
        <button
          type="button"
          className="btn btn-outline-primary btn-sm btn-help-info"
          onClick={() => setShowTaskOwnerSettingsModal(true)}
        >
          <i className="fa fa-cog"></i>
        </button>
      </Annotation>
      <Modal
        show={showTaskOwnerSettingsModal}
        onHide={() => setShowTaskOwnerSettingsModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Task Owner Console</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Modal.Title style={{ fontSize: 20 }}>Settings</Modal.Title>
          <hr />
          Validate non-model-fooling examples? &nbsp;
          <span className="float-right">
            <Form.Check
              checked={validateNonFooling}
              onChange={() => {
                setValidateNonFooling(!validateNonFooling);
              }}
            />
          </span>
          <hr />
          Number of correct, incorrect, <br /> or flagged marks when an example
          <span className="float-right">
            {numMatchingValidations}
            <span className="float-right">
              <Form.Control
                className="p-1"
                type="range"
                min="1"
                max="10"
                step="1"
                defaultValue={numMatchingValidations}
                onChange={(e) => {
                  setNumMatchingValidations(parseInt(e.target.value));
                }}
              />
            </span>
          </span>
          <br /> is no longer shown to validators?
          <hr />
          <Modal.Title style={{ fontSize: 20 }}>Actions</Modal.Title>
          <hr />
          <span className="float-right">
            <DropdownButton
              className="border-0 blue-color font-weight-bold p-1"
              id="dropdown-basic-button"
              title="Export Data"
            >
              <Dropdown.Item onClick={exportCurrentRoundData}>
                Export current round
              </Dropdown.Item>
              <Dropdown.Item onClick={exportAllTaskData}>
                Export all
              </Dropdown.Item>
            </DropdownButton>
          </span>
          Click here to export data from the <br />
          current round or all rounds
          <hr />
          Add new contexts to the current round by uploading them here, as a
          jsonl where each datum has three fields: <br /> <br />
          <b>context_io</b>: a json with keys and values for each of the context
          io components
          <br />
          <b>tag</b>: a string that associates this context with a set of other
          contexts <br />
          <b>metadata</b>: a dictionary in json format representing any other
          data that is useful to you <br /> <br />
          <Formik
            initialValues={{
              file: null,
              result: "",
            }}
            validate={handleValidation}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              handleChange,
              setFieldValue,
              handleSubmit,
              isSubmitting,
              setValues,
            }) => (
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <Container>
                  <Form.Group>
                    {values.file ? (
                      <div className="UploadResult">
                        <Card>
                          <Card.Body>
                            <Container>
                              <Row>
                                <Col md={10}>{values.file.name}</Col>
                                <Col md={2}>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={(event) => {
                                      setFieldValue("result", "");
                                      setFieldValue("file", null);
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </Col>
                              </Row>
                            </Container>
                          </Card.Body>
                        </Card>
                      </div>
                    ) : (
                      <DragAndDrop
                        handleChange={(event) => {
                          setValues({
                            ...values,
                            file: event.currentTarget.files[0],
                            result: "",
                          });
                        }}
                        required={errors.file}
                        name="file"
                      >
                        Drag
                      </DragAndDrop>
                    )}
                    <small className="form-text text-muted">
                      {errors.file}
                      {values.result}
                    </small>
                    <InputGroup>
                      <Button
                        type="submit"
                        variant="primary"
                        className="fadeIn third submitBtn button-ellipse"
                        disabled={isSubmitting}
                      >
                        Upload Contexts
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Container>
              </form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </>
  ) : (
    ""
  );
};

export default TaskOwnerConsole;
