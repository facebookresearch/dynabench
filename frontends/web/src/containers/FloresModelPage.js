/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState, useContext } from "react";
import "./ModelPage.css";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Spinner,
} from "react-bootstrap";
import Moment from "react-moment";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";
import TasksContext from "./TasksContext";
import UserContext from "./UserContext";
import FloresGrid from "../components/FloresComponents/FloresGrid";

const FloresModelPage = (props) => {
  const context = useContext(UserContext);
  const { modelId } = props.match.params;

  const [isLoading, setIsLoading] = useState(false);
  const [ctxUserId, setCtxUserId] = useState(null);
  const [model, setModel] = useState({});

  // Call api to fetch model
  useEffect(() => {
    /**
     * Invoke APIService to fetch leader board data
     *
     * @param {*} api instance of @see APIService
     * @param {number} page
     */
    const fetchFloresModel = (api) => {
      api.getModel(108).then(
        (result) => {
          setModel(result);
        },
        (error) => {
          console.log(error);
          if (error.status_code === 404 || error.status_code === 405) {
            props.history.push("/");
          }
        }
      );
    };

    setIsLoading(true);

    fetchFloresModel(context.api);
    setIsLoading(false);
    return () => {};
  }, [context.api, modelId, props.history]);

  useEffect(() => {
    const user = context.api.getCredentials();
    setCtxUserId(user.id);
  }, [context.api]);

  console.log(model);

  const handleBack = () => {
    const propState = props.location.state;
    if (propState && propState.src === "publish") {
      props.history.push("/account#models");
    } else {
      props.history.goBack();
    }
  };

  if (isLoading) return <Spinner animation="border" />;

  return (
    <Container className="mb-3 pb-5 mt-4">
      <Row>
        <Col className="m-auto" lg={8}>
          <Card className="my-4">
            <Card.Header className="light-gray-bg">
              <div className="d-flex justify-content-between">
                <Button
                  className={`blue-bg border-0 font-weight-bold`}
                  size="sm"
                  onClick={handleBack}
                >
                  <i className="fas fa-arrow-left"></i>
                </Button>
                <div className="align-items">
                  <h2 className="align-items text-uppercase m-0 text-reset">
                    Model Overview
                  </h2>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0 leaderboard-container">
              <div className="mx-2 mt-4 p-0">
                <p>
                  <span className="font-weight-bold">Model Name - </span>{" "}
                  {model.name || "Unknown"}
                </p>
                <hr />
              </div>
              <Table hover className="mb-0 floresModel">
                <thead />
                <tbody>
                  <tr style={{ border: `none` }}>
                    <td>Owner</td>
                    <td>
                      <Link to={`/users/${model.user_id}`}>
                        {model.username}
                      </Link>
                    </td>
                  </tr>
                  <tr style={{ border: `none` }}>
                    <td>Task</td>
                    <td>
                      <Link to={`/tasks/${model.tid}#overall`}>
                        <TasksContext.Consumer>
                          {({ tasks }) => {
                            const task =
                              model && tasks.filter((e) => e.id === model.tid);
                            return task && task.length && task[0].shortname;
                          }}
                        </TasksContext.Consumer>
                      </Link>
                    </td>
                  </tr>
                  <tr style={{ border: `none` }}>
                    <td>Summary</td>
                    <td>{model.longdesc}</td>
                  </tr>
                  <tr style={{ border: `none` }}>
                    <td style={{ whiteSpace: "nowrap" }}># Parameters</td>
                    <td>{model.params}</td>
                  </tr>
                  <tr style={{ border: `none` }}>
                    <td>Language(s)</td>
                    <td>{model.languages}</td>
                  </tr>
                  <tr style={{ border: `none` }}>
                    <td>License(s)</td>
                    <td>{model.license}</td>
                  </tr>
                  <tr style={{ border: `none` }}>
                    <td style={{ verticalAlign: "middle" }}>Model Card</td>
                    <td className="modelCard">
                      <Markdown>{"..."}</Markdown>
                    </td>
                  </tr>
                </tbody>
              </Table>
              <div className="float-right mr-2">
                <p className="upload-time">
                  <i className="fas fa-clock"></i> Uploaded{" "}
                  <Moment utc fromNow>
                    {model.upload_datetime}
                  </Moment>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col className="m-auto" lg={12}>
          <Card className="my-4">
            <Card.Header className="light-gray-bg">
              <div className="d-flex justify-content-between">
                <Button
                  className={`blue-bg border-0 font-weight-bold`}
                  size="sm"
                  onClick={() => {}}
                >
                  <i className="fas fa-info-circle"></i>
                </Button>
                <div className="align-items">
                  <h2 className="align-items text-uppercase m-0 text-reset">
                    Performance Grid
                  </h2>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-4 my-0">
              <div className="">
                <FloresGrid model={model} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FloresModelPage;
