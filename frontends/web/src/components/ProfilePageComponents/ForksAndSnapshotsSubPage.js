import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Pagination,
  Table,
} from "react-bootstrap";
import TasksContext from "../../containers/TasksContext";
import { Link } from "react-router-dom";
import Moment from "react-moment";

const ForkOrSnapshotTable = (props) => {
  const { data, isForkList, page, paginate, isEndOfPage } = props;
  const [descriptionConfiguration, setDescriptionConfiguration] = useState({});

  const usesEllipsis = (elementId) => {
    const e = document.getElementById(elementId);
    return e == null ? false : e.offsetWidth < e.scrollWidth;
  };

  useEffect(() => {
    const newDescriptionConfiguration = {};
    data.forEach((datum) => {
      const descriptionId = getDescriptionId(datum);
      newDescriptionConfiguration[descriptionId] = {
        usesEllipsis: usesEllipsis(descriptionId),
        isExpanded: false,
      };
    });
    setDescriptionConfiguration(newDescriptionConfiguration);
  }, [data]);

  const getRowKey = (datum) => {
    return isForkList ? datum.tid + "-" + datum.name : datum.id;
  };

  const getDescriptionId = (datum) => {
    return getRowKey(datum) + "-desc";
  };

  const toggleDescriptionEllipsis = (descriptionId) => {
    const dupDescriptionConfiguration = {
      ...descriptionConfiguration,
    };
    dupDescriptionConfiguration[descriptionId].isExpanded =
      !dupDescriptionConfiguration[descriptionId].isExpanded;
    setDescriptionConfiguration(dupDescriptionConfiguration);
  };

  return (
    <Col className="m-auto" lg={12}>
      <Card className="profile-card">
        <Card.Body className="overflow-auto">
          <Table className="mb-0">
            <thead className="blue-color border-bottom">
              <tr>
                <td className="col-4">
                  <b>Link to {isForkList ? "Fork" : "Snapshot"}</b>
                </td>
                <td className="col-1">
                  <b>Task</b>
                </td>
                <td className="col-5">
                  <b>Description</b>
                </td>
                <td className="col-2">
                  <b>Created</b>
                </td>
              </tr>
            </thead>
            <tbody>
              {!data.length ? (
                <tr>
                  <td colSpan="4">
                    <div className="text-center">No data found</div>
                  </td>
                </tr>
              ) : null}
              {data.map((datum) => {
                const rowKey = getRowKey(datum);
                const descriptionId = getDescriptionId(datum);
                const usesEllipsis =
                  descriptionConfiguration[descriptionId]?.usesEllipsis;
                const isDescriptionExpanded =
                  descriptionConfiguration[descriptionId]?.isExpanded;

                return (
                  <tr key={rowKey}>
                    <TasksContext.Consumer>
                      {({ tasks }) => {
                        const task =
                          datum && tasks.filter((e) => e.id === datum.tid);
                        if (!task || !task.length) {
                          return null;
                        }
                        const forkOrSnapshotUrl = new URL(
                          window.location.origin
                        );
                        forkOrSnapshotUrl.pathname = `/tasks/${
                          task[0].task_code
                        }/${isForkList ? datum.name : datum.id}`;
                        return (
                          <>
                            <td className="text-truncate long-text">
                              <span>
                                <Link to={forkOrSnapshotUrl}>
                                  {forkOrSnapshotUrl.toString()}
                                </Link>
                              </span>
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
                    <td
                      id={descriptionId}
                      className={`${
                        isDescriptionExpanded ? "" : "text-truncate"
                      } long-text col`}
                    >
                      <span>{datum.desc}</span>
                      {usesEllipsis && (
                        <Button
                          className="btn-xs float-right p-1 mt-1"
                          variant="outline-primary"
                          onClick={() =>
                            toggleDescriptionEllipsis(descriptionId)
                          }
                        >
                          {isDescriptionExpanded ? "show less" : "show more"}
                        </Button>
                      )}
                    </td>
                    <td className="text-nowrap">
                      <Moment utc format={"DD-MMM-YYYY HH:mm:ss"}>
                        {datum.create_datetime}
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
            <Pagination.Item disabled={!page} onClick={() => paginate("prev")}>
              Previous
            </Pagination.Item>
            <Pagination.Item
              disabled={isEndOfPage}
              onClick={() => paginate("next")}
            >
              Next
            </Pagination.Item>
          </Pagination>
        </Card.Footer>
      </Card>
    </Col>
  );
};

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
      <ForkOrSnapshotTable
        data={userForks}
        isForkList={true}
        page={forksPage}
        paginate={paginateForks}
        isEndOfPage={isEndOfForksPage}
      />
      <h1 className="my-4 pt-3 text-uppercase text-center">Your Snapshots</h1>
      <ForkOrSnapshotTable
        data={userSnapshots}
        isForkList={false}
        page={snapshotsPage}
        paginate={paginateSnapshots}
        isEndOfPage={isEndOfSnapshotsPage}
      />
    </Container>
  );
};

export default ForksAndSnapshotsSubPage;
