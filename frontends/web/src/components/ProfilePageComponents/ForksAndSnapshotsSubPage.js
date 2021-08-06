import React, { useEffect, useState } from "react";
import { Card, Col, Container, Pagination, Table } from "react-bootstrap";
import TasksContext from "../../containers/TasksContext";
import { Link } from "react-router-dom";
import Moment from "react-moment";

const ForksAndSnapshotsSubPage = (props) => {
  const [userForks, setUserForks] = useState([]);
  const [userSnapshots, setUserSnapshots] = useState([]);
  const [forksPage, setForksPage] = useState(0);
  const [snapshotsPage, setSnapshotsPage] = useState(0);
  const [isEndOfForksPage, setIsEndOfForksPage] = useState(true);
  const [isEndOfSnapshotsPage, setIsEndOfSnapshotsPage] = useState(true);

  const { api, userId } = props;
  const pageLimit = 5;

  useEffect(() => {
    api.getUserForks(userId, pageLimit, forksPage).then(
      (result) => {
        const isEndOfPage = (forksPage + 1) * pageLimit >= (result.count || 0);
        setIsEndOfForksPage(isEndOfPage);
        setUserForks(result.data || []);
      },
      (error) => {
        console.log(error);
      }
    );
  }, [userId, forksPage]);

  useEffect(() => {
    api.getUserSnapshots(userId, pageLimit, snapshotsPage).then(
      (result) => {
        const isEndOfPage =
          (snapshotsPage + 1) * pageLimit >= (result.count || 0);
        setIsEndOfSnapshotsPage(isEndOfPage);
        setUserSnapshots(result.data || []);
      },
      (error) => {
        console.log(error);
      }
    );
  }, [userId, snapshotsPage]);

  const paginateForks = (state) => {
    const is_next = state === "next";
    const newPage = is_next ? forksPage + 1 : forksPage - 1;
    setForksPage(newPage);
  };

  const paginateSnapshots = (state) => {
    const is_next = state === "next";
    const newPage = is_next ? snapshotsPage + 1 : snapshotsPage - 1;
    setSnapshotsPage(newPage);
  };

  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Your Forks</h1>
      <Col className="m-auto" lg={10}>
        <Card className="profile-card">
          <Card.Body className="overflow-auto">
            <Table className="modelTable mb-0">
              <thead className="blue-color border-bottom">
                <tr>
                  <td>
                    <b>Link to Fork</b>
                  </td>
                  <td>
                    <b>Task</b>
                  </td>
                  <td>
                    <b>Created</b>
                  </td>
                </tr>
              </thead>
              <tbody>
                {!userForks.length ? (
                  <tr>
                    <td colSpan="4">
                      <div className="text-center">No data found</div>
                    </td>
                  </tr>
                ) : null}
                {userForks.map((fork) => {
                  return (
                    <tr key={fork.tid + fork.name}>
                      <TasksContext.Consumer>
                        {({ tasks }) => {
                          const task =
                            fork && tasks.filter((e) => e.id === fork.tid);
                          if (!task || !task.length) {
                            return null;
                          }
                          const forkUrl = new URL(window.location.origin);
                          forkUrl.pathname = `/tasks/${task[0].task_code}/f/${fork.name}`;
                          return (
                            <>
                              <td>
                                <Link to={forkUrl}>{forkUrl.toString()}</Link>
                              </td>
                              <td>
                                <Link to={`/tasks/${task[0].task_code}`}>
                                  {task[0].shortname}
                                </Link>
                              </td>
                            </>
                          );
                        }}
                      </TasksContext.Consumer>
                      <td className="text-nowrap">
                        <Moment utc format={"DD-MMM-YYYY HH:mm:ss"}>
                          {fork.create_datetime}
                        </Moment>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
          <Card.Footer className="text-center">
            <Pagination className="mb-0 float-right" size="sm">
              <Pagination.Item
                disabled={!forksPage}
                onClick={() => paginateForks("prev")}
              >
                Previous
              </Pagination.Item>
              <Pagination.Item
                disabled={isEndOfForksPage}
                onClick={() => paginateForks("next")}
              >
                Next
              </Pagination.Item>
            </Pagination>
          </Card.Footer>
        </Card>
      </Col>
      <h1 className="my-4 pt-3 text-uppercase text-center">Your Snapshots</h1>
      <Col className="m-auto" lg={10}>
        <Card className="profile-card">
          <Card.Body className="overflow-auto">
            <Table className="mb-0">
              <thead className="blue-color border-bottom">
                <tr>
                  <td>
                    <b>Link to Fork</b>
                  </td>
                  <td>
                    <b>Task</b>
                  </td>
                  <td>
                    <b>Description</b>
                  </td>
                  <td>
                    <b>Created</b>
                  </td>
                </tr>
              </thead>
              <tbody>
                {!userSnapshots.length ? (
                  <tr>
                    <td colSpan="4">
                      <div className="text-center">No data found</div>
                    </td>
                  </tr>
                ) : null}
                {userSnapshots.map((snapshot) => {
                  return (
                    <tr key={snapshot.id}>
                      <TasksContext.Consumer>
                        {({ tasks }) => {
                          const task =
                            snapshot &&
                            tasks.filter((e) => e.id === snapshot.tid);
                          if (!task || !task.length) {
                            return null;
                          }
                          const snapshotUrl = new URL(window.location.origin);
                          snapshotUrl.pathname = `/tasks/${task[0].task_code}/s/${snapshot.id}`;
                          return (
                            <>
                              <td>
                                <Link to={snapshotUrl}>
                                  {snapshotUrl.toString()}
                                </Link>
                              </td>
                              <td>
                                <Link to={`/tasks/${task[0].task_code}`}>
                                  {task[0].shortname}
                                </Link>
                              </td>
                            </>
                          );
                        }}
                      </TasksContext.Consumer>
                      <td>{snapshot.desc}</td>
                      <td className="text-nowrap">
                        <Moment utc format={"DD-MMM-YYYY HH:mm:ss"}>
                          {snapshot.create_datetime}
                        </Moment>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
          <Card.Footer className="text-center">
            <Pagination className="mb-0 float-right" size="sm">
              <Pagination.Item
                disabled={!snapshotsPage}
                onClick={() => paginateSnapshots("prev")}
              >
                Previous
              </Pagination.Item>
              <Pagination.Item
                disabled={isEndOfSnapshotsPage}
                onClick={() => paginateSnapshots("next")}
              >
                Next
              </Pagination.Item>
            </Pagination>
          </Card.Footer>
        </Card>
      </Col>
    </Container>
  );
};

export default ForksAndSnapshotsSubPage;
