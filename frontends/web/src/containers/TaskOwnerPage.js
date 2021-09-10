/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import UserContext from "./UserContext";
import Models from "../components/TaskOwnerPageComponents/Models";
import Owners from "../components/TaskOwnerPageComponents/Owners";
import Rounds from "../components/TaskOwnerPageComponents/Rounds";
import Settings from "../components/TaskOwnerPageComponents/Settings";
import Datasets from "../components/TaskOwnerPageComponents/Datasets";

class TaskOwnerPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      task: null,
      rounds: null,
      owners_string: null,
      model_identifiers_for_target_selection: null,
      model_identifiers: null,
      datasets: null,
      availableDatasetAccessTypes: null,
      dataExporting: false,
    };
  }

  refreshData() {
    if (
      this.props.location.hash === "" ||
      this.props.location.hash === "#settings"
    ) {
      return this.fetchTask();
    } else if (this.props.location.hash === "#owners") {
      return this.fetchTask().then(() => this.fetchOwners());
    } else if (this.props.location.hash === "#rounds") {
      return this.fetchTask().then(() =>
        this.fetchRounds().then(() =>
          this.fetchModelIdentifiersForTargetSelection()
        )
      );
    } else if (this.props.location.hash === "#models") {
      return this.fetchTask().then(() => this.fetchModelIdentifiers());
    } else if (this.props.location.hash === "#datasets") {
      return this.fetchTask().then(() =>
        this.fetchDatasets(() => this.fetchAvailableDatasetAccessTypes())
      );
    }
  }

  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" +
          encodeURIComponent("Please login first.") +
          "&src=/owner#profile"
      );
    } else {
      this.refreshData();
    }
  }

  fetchTask = (callback = () => {}) => {
    return this.context.api.getTask(this.props.match.params.taskCode).then(
      (result) => {
        this.setState({ task: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchOwners = (callback = () => {}) => {
    return this.context.api.getOwners(this.state.task.id).then(
      (result) => {
        this.setState({ owners_string: result.join(", ") }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchRounds = (callback = () => {}) => {
    return this.context.api.getRounds(this.state.task.id).then(
      (result) => {
        this.setState({ rounds: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchDatasets = (callback = () => {}) => {
    return this.context.api.getDatasets(this.state.task.id).then(
      (result) => {
        this.setState({ datasets: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchAvailableDatasetAccessTypes = (callback = () => {}) => {
    return this.context.api.getAvailableDatasetAccessTypes().then(
      (result) => {
        this.setState({ availableDatasetAccessTypes: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchModelIdentifiers = (callback = () => {}) => {
    this.context.api.getModelIdentifiers(this.state.task.id).then(
      (result) => {
        this.setState({ model_identifiers: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  exportData = (rid, callback = () => {}) => {
    this.setState({ dataExporting: true });
    return this.context.api.exportData(this.state.task.id, rid).then(
      (result) => {
        this.setState({ dataExporting: false }, callback);
      },
      (error) => {
        console.log(error);
        this.setState({ dataExporting: false }, callback);
      }
    );
  };

  fetchModelIdentifiersForTargetSelection = (callback = () => {}) => {
    this.context.api
      .getModelIdentifiersForTargetSelection(this.state.task.id)
      .then(
        (result) => {
          this.setState(
            { model_identifiers_for_target_selection: result },
            callback
          );
        },
        (error) => {
          console.log(error);
        }
      );
  };

  componentDidUpdate(prevProps) {
    if (prevProps.location.hash !== this.props.location.hash) {
      this.refreshData();
    }
  }

  handleContextsSubmit = (
    values,
    { setFieldError, setFieldValue, resetForm, setSubmitting }
  ) => {
    const data = {
      file: values.contexts_file,
    };

    return this.context.api
      .submitContexts(this.state.task.id, values.rid, data)
      .then(
        (result) => {
          values.contexts_file = null;
          resetForm({ values: values });
          setSubmitting(false);
        },
        (error) => {
          values.contexts_file = null;
          resetForm({ values: values });
          setFieldError(
            "accept",
            "File could not be submitted (" + error.error + ")"
          );
          setSubmitting(false);
          console.log(error);
        }
      );
  };

  handleTaskUpdateWithActivate = (
    values,
    { setFieldError, setSubmitting, resetForm }
  ) => {
    if (
      this.state.task.active === false &&
      values.hasOwnProperty("annotation_config_json")
    ) {
      this.context.api
        .activateTask(this.state.task.id, values.annotation_config_json)
        .then(
          (result) => {
            this.handleTaskUpdate(values, {
              setFieldError,
              setSubmitting,
              resetForm,
            });
          },
          (error) => {
            console.log(error);
            setFieldError(
              "accept",
              "Task could not be updated (" + error.error + ")"
            );
            setSubmitting(false);
          }
        );
    } else {
      this.handleTaskUpdate(values, {
        setFieldError,
        setSubmitting,
        resetForm,
      });
    }
  };

  handleTaskUpdate = (values, { setFieldError, setSubmitting, resetForm }) => {
    const allowed = [
      "num_matching_validations",
      "unpublished_models_in_leaderboard",
      "validate_non_fooling",
      "instructions_md",
      "hidden",
      "submitable",
      "create_endpoint",
    ];

    const data = Object.keys(values)
      .filter((key) => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = values[key];
        return obj;
      }, {});

    this.context.api.updateTask(this.state.task.id, data).then(
      (result) => {
        this.fetchTask(() => {
          resetForm({ values: data });
          setSubmitting(false);
        });
      },
      (error) => {
        console.log(error);
        setFieldError(
          "accept",
          "Task could not be updated (" + error.error + ")"
        );
        setSubmitting(false);
      }
    );
  };

  handleOwnerUpdate = (values, { setFieldError, setSubmitting, resetForm }) => {
    this.context.api
      .toggleOwner(this.state.task.id, values.owner_to_toggle)
      .then(
        () => {
          this.fetchOwners(() => {
            resetForm({
              values: {
                owners_string: this.state.owners_string,
                owner_to_toggle: null,
              },
            });
            setSubmitting(false);
          });
        },
        (error) => {
          console.log(error);
          setFieldError(
            "accept",
            "Owners could not be updated (" + error.error + ")"
          );
          setSubmitting(false);
        }
      );
  };

  handleDatasetUpdate = (
    values,
    { setFieldError, setSubmitting, resetForm }
  ) => {
    const allowed = ["name", "longdesc", "rid", "source_url", "access_type"];

    const data = Object.keys(values)
      .filter((key) => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = values[key];
        return obj;
      }, {});

    this.context.api.updateDataset(values.id, data).then(
      (result) => {
        this.fetchDatasets(() => {
          resetForm({
            values: values,
          });
          setSubmitting(false);
        });
      },
      (error) => {
        console.log(error);
        setFieldError(
          "accept",
          "Dataset could not be updated (" + error.error + ")"
        );
        setSubmitting(false);
      }
    );
  };

  handleRoundUpdate = (
    values,
    { setFieldError, setSubmitting, setFieldValue, resetForm }
  ) => {
    const model_ids = [];

    for (const model_identifier of values.model_identifiers) {
      if (model_identifier.is_target) {
        model_ids.push(model_identifier.model_id);
      }
    }

    const data = {
      model_ids: model_ids,
      longdesc: values.longdesc,
    };

    this.context.api.updateRound(this.state.task.id, values.rid, data).then(
      () => {
        if (values.contexts_file) {
          this.handleContextsSubmit(values, {
            setFieldError,
            setFieldValue,
            setSubmitting,
            resetForm,
          }).then(
            this.fetchRounds(() => {
              resetForm({
                values: values,
              });
              setSubmitting(false);
            })
          );
        } else {
          this.fetchRounds(() => {
            resetForm({
              values: values,
            });
            setSubmitting(false);
          });
        }
      },
      (error) => {
        console.log(error);
        setFieldError(
          "accept",
          "Round could not be updated (" + error.error + ")"
        );
        setSubmitting(false);
      }
    );
  };

  createRound = () => {
    this.context.api.createRound(this.state.task.id).then(
      () => {
        this.refreshData();
      },
      (error) => {
        console.log(error);
      }
    );
  };

  handleUploadAndCreateDataset = (
    values,
    { setFieldError, setSubmitting, setFieldValue, resetForm }
  ) => {
    const files = { file: values.file };
    for (const config of JSON.parse(this.state.task.annotation_config_json)
      .delta_metrics) {
      files[config.type] = values[config.type];
    }
    this.context.api
      .uploadAndCreateDataset(this.state.task.id, values.name, files)
      .then(
        () => {
          this.refreshData();
          values.name = "";
          for (const [fname, _] of Object.entries(files)) {
            values[fname] = null;
          }
          resetForm({ values: values });
          setSubmitting(false);
        },
        (error) => {
          console.log(error);
          setFieldError(
            "accept",
            "Dataset cound not be added (" + error.error + ")"
          );
          setSubmitting(false);
        }
      );
  };

  render() {
    const navOptions = [
      {
        href: "#settings",
        buttonText: "Settings",
      },
      {
        href: "#owners",
        buttonText: "Owners",
      },
      {
        href: "#rounds",
        buttonText: "Rounds",
      },
      {
        href: "#models",
        buttonText: "Models",
      },
      {
        href: "#datasets",
        buttonText: "Datasets",
      },
    ];

    return (
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border">
            <Nav className="flex-lg-column sidebar-wrapper sticky-top">
              {navOptions.map((navOption) => (
                <Nav.Item key={navOption.href}>
                  <Nav.Link
                    href={navOption.href}
                    className={`gray-color p-4 px-lg-6 ${
                      this.props.location.hash === navOption.href
                        ? "active"
                        : ""
                    }`}
                  >
                    {navOption.buttonText}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </Col>
          <Col>
            {this.props.location.hash === "#settings" && this.state.task ? (
              <Settings
                task={this.state.task}
                handleTaskUpdateWithActivate={this.handleTaskUpdateWithActivate}
              />
            ) : null}
            {this.props.location.hash === "#owners" &&
            this.state.owners_string ? (
              <Owners
                owners_string={this.state.owners_string}
                handleOwnerUpdate={this.handleOwnerUpdate}
              />
            ) : null}
            {this.props.location.hash === "#rounds" &&
            this.state.rounds &&
            this.state.model_identifiers_for_target_selection ? (
              <Rounds
                rounds={this.state.rounds}
                model_identifiers_for_target_selection={
                  this.state.model_identifiers_for_target_selection
                }
                createRound={this.createRound}
                handleRoundUpdate={this.handleRoundUpdate}
                exportData={this.exportData}
                dataExporting={this.state.dataExporting}
              />
            ) : null}
            {this.props.location.hash === "#models" &&
            this.state.model_identifiers ? (
              <Models model_identifiers={this.state.model_identifiers} />
            ) : null}
            {this.props.location.hash === "#datasets" &&
            this.state.task &&
            this.state.datasets &&
            this.state.availableDatasetAccessTypes ? (
              <Datasets
                task={this.state.task}
                datasets={this.state.datasets}
                availableAccessTypes={this.state.availableDatasetAccessTypes}
                handleDatasetUpdate={this.handleDatasetUpdate}
                handleUploadAndCreateDataset={this.handleUploadAndCreateDataset}
              />
            ) : null}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default TaskOwnerPage;
