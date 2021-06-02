/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useContext, useState, useEffect } from "react";
import "./TaskPage.css";
import { Container, Row, Col, ButtonGroup, Nav } from "react-bootstrap";
import UserContext from "./UserContext";
import Moment from "react-moment";
import { OverlayProvider, Annotation, OverlayContext } from "./Overlay";
import FloresActionButtons from "../components/Buttons/FloresActionButtons";
import ModelLeaderBoard from "../components/FloresComponents/ModelLeaderboard";
import FloresTaskDescription from "../components/FloresComponents/FloresTaskDescription";

const FLORES_TASK_SHORT_NAMES = [
  "FLORES-FULL",
  "FLORES-SMALL1",
  "FLORES-SMALL2",
];

const TaskNav = ({ location, tasks, taskId, setTask }) => {
  const currentHash = location.hash;

  return (
    <Nav className="flex-lg-column sidebar-wrapper sticky-top">
      {tasks.map((t) => (
        <Nav.Item>
          <Nav.Link
            href={`#${t.id}`}
            onClick={(e) => {
              e.preventDefault();
              setTask(t);
              // location.hash = `${t.id}`;
            }}
            className={`${
              taskId === t.id ? "active" : ""
            } gray-color p-3 px-lg-5`}
          >
            {t.name}
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  );
};

const FloresTaskPage = (props) => {
  const context = useContext(UserContext); // for API
  const [taskLookup, setTaskLookup] = useState({}); // All Flores Tasks
  const [task, setTask] = useState(null); // Current Task ID
  const [isLoading, setIsLoading] = useState(false);

  // Call api only once
  useEffect(() => {
    /**
     * Invoke APIService to fetch Flores Tasks
     *
     * @param {*} api instance of @see APIService
     * @param {number} page
     */
    const fetchFloresTasks = (api) => {
      setIsLoading(true);
      api.getSubmittableTasks().then(
        (result) => {
          console.log(result);

          const floresTasks = result.filter((t) =>
            FLORES_TASK_SHORT_NAMES.includes(t.shortname)
          );
          const taskLookup = floresTasks.reduce(
            (map, obj) => ((map[obj.shortname] = obj), map),
            {}
          );

          setTaskLookup(taskLookup);
          setTask(taskLookup[FLORES_TASK_SHORT_NAMES[0]]); // set default task
          setIsLoading(false);
        },
        (error) => {
          console.log(error);
          setIsLoading(false);
        }
      );
    };

    fetchFloresTasks(context.api);

    return () => {};
  }, [context.api]);

  if (isLoading || !task) {
    return <div>loading</div>;
  }

  return (
    <OverlayProvider initiallyHide={true} delayMs="1700">
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border">
            <Annotation
              placement="bottom-start"
              tooltip="FloRes tasks happen over multiple tracks. You can look at other FloRes tracks here"
            >
              <TaskNav
                {...props}
                tasks={Object.values(taskLookup)}
                taskId={task.id}
                setTask={setTask}
              />
            </Annotation>
          </Col>
          <Col lg={10} className="px-4 px-lg-5">
            <h2 className="task-page-header text-reset ml-0">FloRes</h2>
            <div style={{ float: "right", marginTop: 30 }}>
              <ButtonGroup>
                <Annotation
                  placement="left"
                  tooltip="Click to show help overlay"
                >
                  <OverlayContext.Consumer>
                    {({ hidden, setHidden }) => (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm btn-help-info"
                        onClick={() => {
                          setHidden(!hidden);
                        }}
                      >
                        <i className="fas fa-question"></i>
                      </button>
                    )}
                  </OverlayContext.Consumer>
                </Annotation>
              </ButtonGroup>
            </div>
            <p>
              {" "}
              FLoRes is a benchmark dataset for machine translation between
              English and low-resource languages.{" "}
            </p>
            <hr />
            <FloresTaskDescription taskId={task.id} />
            <FloresActionButtons
              api={context.api}
              taskId={task.id}
              user={context.user}
            />
            <p>
              The training data is provided by the publicly available Opus
              repository, which contains data of various quality from a variety
              of domains. We also provide in-domain Wikipedia monolingual data
              for each language. nn All tracks will be fully constrained, so
              only the data that is provided can be used. This will enable
              fairer comparison across methods. Check the{" "}
              <a href="http://data.statmt.org/wmt21/multilingual-task/">
                multilingual data page
              </a>{" "}
              for a detailed view of the resources.
            </p>
            <h6 className="text-dark ml-0">
              <Moment date={Date.now()} format="MMM Do YYYY" />
            </h6>
            <Row>
              <Annotation
                placement="left"
                tooltip="This shows how models have performed on a specific track"
              >
                <ModelLeaderBoard
                  {...props}
                  taskTitle={task?.name}
                  taskId={task.id}
                />
              </Annotation>
            </Row>
          </Col>
        </Row>
      </Container>
    </OverlayProvider>
  );
};

export default FloresTaskPage;
