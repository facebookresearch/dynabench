/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./TaskPage.css";
import { Container, Row, Spinner } from "react-bootstrap";
import UserContext from "./UserContext";
import { TaskModelSnapshotLeaderboard } from "../components/TaskLeaderboard/TaskModelLeaderboardCardWrapper";
import Moment from "react-moment";

const TaskModelLeaderboardSnapshotPage = (props) => {
  const context = useContext(UserContext); // for API
  const [task, setTask] = useState(null); // Current task data
  const [snapshotData, setSnapshotData] = useState(null); // Current snapshot data
  const [isLoading, setIsLoading] = useState(false);

  const { taskCode, snapshotName } = useParams();

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
                `/tasks/${taskCode}`,
                `/tasks/${result.task_code}`
              ),
              search: props.location.search,
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
  }, [context.api, taskCode, snapshotName]);

  useEffect(() => {
    if (task == null) {
      setSnapshotData(null);
      return;
    }

    context.api.getLeaderboardSnapshot(task.id, snapshotName).then(
      (result) => {
        setSnapshotData(result);
      },
      (error) => {
        console.log(error);
        if (error && error.status_code === 404) {
          props.history.replace({
            pathname: `/tasks/${taskCode}`,
          });
        }
        setSnapshotData(null);
      }
    );
  }, [task]);

  if (isLoading || !task || !snapshotData) {
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
          <TaskModelSnapshotLeaderboard
            {...props}
            task={task}
            taskCode={taskCode}
            snapshotData={JSON.parse(snapshotData.data_json)}
            disableToggleSort={true}
            disableAdjustWeights={true}
            disableForkAndSnapshot={true}
            title={"Model Leaderboard - " + task.name + " (Snapshot)"}
          />
        </a>
        <p className={"float-right"}>
          Snapshot created{" "}
          <b>
            <Moment utc fromNow>
              {snapshotData.create_datetime}
            </Moment>
          </b>
        </p>
      </Row>
    </Container>
  );
};

export default TaskModelLeaderboardSnapshotPage;
