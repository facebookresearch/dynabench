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
import { TaskModelDefaultLeaderboard } from "../components/TaskLeaderboard/TaskModelLeaderboardCardWrapper";

const TaskModelLeaderboardPage = (props) => {
  const context = useContext(UserContext); // for API
  const [task, setTask] = useState(null); // Current Task ID
  const [isLoading, setIsLoading] = useState(false);

  const { taskCode } = useParams();

  // Call api only once
  useEffect(() => {
    /**
     * Invoke APIService to fetch  Task
     *
     * @param {*} api instance of @see APIService
     */
    const fetchTask = (api) => {
      setIsLoading(true);
      api.getTask(taskCode).then(
        (result) => {
          setTask(result);
          if (taskCode !== result.task_code) {
            props.history.replace({
              pathname: props.location.pathname.replace(
                `/tasks/top/${taskCode}`,
                `/tasks/top/${result.task_code}`
              ),
              search: props.location.search
            });
          }

          setIsLoading(false);
        },
        (error) => {
          console.log(error);
          setIsLoading(false);
        }
      );
    };

    fetchTask(context.api);

    return () => {};
  }, [context.api, taskCode]);

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
          href={`/tasks/${taskCode}`}
          target="_blank"
          style={{ width: "100%", textDecorationLine: "none" }}
        >
          <TaskModelDefaultLeaderboard
            task={task}
            taskCode={taskCode}
            isStandalone={true}
          />
        </a>
      </Row>
    </Container>
  );
};

export default TaskModelLeaderboardPage;
