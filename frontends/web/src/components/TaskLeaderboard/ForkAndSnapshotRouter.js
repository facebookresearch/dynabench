/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UserContext from "../../containers/UserContext";
import { Spinner } from "react-bootstrap";
import TaskPage from "../../containers/TaskPage";
import TaskModelLeaderboardSnapshotPage from "../../containers/TaskModelLeaderboardSnapshotPage";

const ForkAndSnapshotRouter = (props) => {
  const { taskCode, forkOrSnapshotName } = useParams();
  const context = useContext(UserContext);
  const [type, setType] = useState("");

  const navigateToTaskPage = () => {
    props.history.replace({
      pathname: taskCode.indexOf("flores") > -1 ? "/flores" : "/tasks",
    });
  };

  useEffect(() => {
    const uriEncodedName = encodeURIComponent(forkOrSnapshotName);
    context.api.disambiguateForkAndSnapshot(taskCode, uriEncodedName).then(
      (result) => {
        setType(result.type);
      },
      (error) => {
        console.log(error);
        if (error && error.status_code === 404) {
          navigateToTaskPage();
        }
      }
    );
  }, [context.api, forkOrSnapshotName, navigateToTaskPage, taskCode]);

  if (type === "") {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  } else if (type === "fork") {
    return <TaskPage {...props} />;
  } else if (type === "snapshot") {
    return <TaskModelLeaderboardSnapshotPage {...props} />;
  } else {
    return null;
  }
};

export default ForkAndSnapshotRouter;
