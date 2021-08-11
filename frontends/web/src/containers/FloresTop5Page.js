/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./TaskPage.css";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import UserContext from "./UserContext";
import FloresModelLeaderBoard from "../components/FloresComponents/FloresModelLeaderboard";

const FLORES_TASK_NAMES = ["FLORES-FULL", "FLORES-SMALL1", "FLORES-SMALL2"];

const FloresTop5Page = (props) => {
  const context = useContext(UserContext); // for API
  const [taskLookup, setTaskLookup] = useState({}); // All Flores Tasks
  const [task, setTask] = useState(null); // Current Task ID
  const [isLoading, setIsLoading] = useState(false);

  let { taskName } = useParams();

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
          const floresTasks = result.filter((t) =>
            FLORES_TASK_NAMES.includes(t.name)
          );
          const taskLookup = floresTasks.reduce(
            (map, obj) => ((map[obj.name] = obj), map),
            {}
          );

          setTaskLookup(taskLookup);

          if (FLORES_TASK_NAMES.includes(taskName)) {
            setTask(taskLookup[taskName]); // set the task from Arguments
          } else {
            setTask(taskLookup[FLORES_TASK_NAMES[0]]); // set default task
          }

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
  }, [context.api, taskName]);

  if (isLoading || !task) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container fluid>
      <Row className="px-4 px-lg-5">
        <a
          href={`/flores/${task.name}`}
          target="_blank"
          style={{ width: "100%", textDecorationLine: "none" }}
        >
          <FloresModelLeaderBoard
            {...props}
            taskTitle={task?.name}
            taskId={task.id}
            isTop5={true}
          />
        </a>
      </Row>
    </Container>
  );
};

export default FloresTop5Page;
