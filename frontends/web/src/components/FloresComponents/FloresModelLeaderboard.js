import React, { Fragment, useState, useEffect, useContext } from "react";
import { Card, Pagination, Col, Spinner } from "react-bootstrap";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import UserContext from "../../containers/UserContext";

const SortDirection = {
  ASC: "asc",
  DESC: "desc",
  getOppositeDirection(direction) {
    return direction === this.ASC ? this.DESC : this.ASC;
  },
};

/**
 * Container to show and toggle current sort by.
 *
 * @param {String} props.sortKey the sortBy key for this instance
 * @param {(String)=>void} props.toggleSort function to change the sortBy field.
 * @param {currentSort} props.currentSort the current sortBy field.
 */
const SortContainer = ({
  sortKey,
  toggleSort,
  currentSort,
  className,
  children,
}) => {
  return (
    <div onClick={() => toggleSort(sortKey)} className={className}>
      {currentSort.field === sortKey && currentSort.direction === "asc" && (
        <i className="fas fa-sort-up">&nbsp;</i>
      )}
      {currentSort.field === sortKey && currentSort.direction === "desc" && (
        <i className="fas fa-sort-down">&nbsp;</i>
      )}

      {children}
    </div>
  );
};

/**
 * The Overall Model Leader board component
 *
 * @param {String} props.taskTitle title of track to show
 * @param {String} props.taskId the flores task for the leader board.
 */
const ModelLeaderBoard = ({ taskId, history, isTop5 }) => {
  const context = useContext(UserContext);
  const [data, setData] = useState([]);
  const [task, setTask] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageLimit, setPageLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState({
    field: "sp-BLEU",
    direction: SortDirection.DESC,
  });

  useEffect(() => {
    setIsLoading(true);

    context.api
      .getDynaboardScores(
        taskId,
        isTop5 ? 5 : pageLimit,
        page * pageLimit,
        sort.field,
        sort.direction,
        [1, 0, 0, 0, 0],
        [1]
      ) // No weights.
      .then(
        (result) => {
          setTotal(result.count);
          setData(result.data);
        },
        (error) => {
          console.log(error);
          if (error.status_code === 404 || error.status_code === 405) {
            history.push("/");
          }
        }
      );
    setIsLoading(false);
    return () => {};
  }, [taskId, context.api, page, pageLimit, sort, history, isTop5]);

  useEffect(() => {
    setIsLoading(true);
    context.api.getTask(taskId).then(
      (result) => {
        setTask(result);
      },
      (error) => {
        console.log(error);
      }
    );
    setIsLoading(false);
    return () => {};
  }, [taskId, context.api]);

  /**
   * Update or toggle the sort field.
   *
   * @param {string} field
   */
  const toggleSort = (field) => {
    const currentDirection = sort.direction;

    const newDirection =
      field !== sort.field
        ? SortDirection.DESC
        : SortDirection.getOppositeDirection(currentDirection);

    setSort({
      field: field,
      direction: newDirection,
    });
  };

  const isEndOfPage = (page + 1) * pageLimit >= total;

  const leaderBoardData = data.map((i, index) => {
    const modelCell = isTop5 ? (
      <td>
        {i.model_name} ({i.username})
      </td>
    ) : (
      <td>
        <Link to={`/models/${i.model_id}`} className="btn-link">
          {i.model_name}
        </Link>{" "}
        <Link to={`/users/${i.uid}#profile`} className="btn-link">
          ({i.username})
        </Link>
      </td>
    );

    return (
      <Fragment key={i.model_id}>
        <tr>
          {modelCell}
          <td className="text-right">{i.averaged_scores[0].toFixed(2)}</td>
        </tr>
      </Fragment>
    );
  });

  if (isLoading) return <Spinner animation="border" />;

  return (
    <Col className="ml-auto mr-auto" md={isTop5 ? "12" : "5"}>
      <Card className="my-4">
        <Card.Header className="light-gray-bg">
          <h2 className="text-uppercase m-0 text-reset">
            Model Leaderboard - {task.shortname}
          </h2>
        </Card.Header>
        <Card.Body className="p-0 leaderboard-container">
          <Table hover className="mb-0">
            <thead>
              <tr>
                <th>Model</th>
                <th className="text-right">
                  <SortContainer
                    sortKey={task.perf_metric_field_name}
                    toggleSort={toggleSort}
                    currentSort={sort}
                  >
                    Average BLEU
                  </SortContainer>
                </th>
              </tr>
            </thead>
            <tbody>{leaderBoardData}</tbody>
          </Table>
        </Card.Body>
        <Card.Footer>
          {isTop5 && (
            <img
              src="/Powered_by_Dynabench-Logo.svg"
              style={{ height: "24px" }}
            />
          )}
          {!isTop5 && (
            <Pagination className="mb-0 float-right" size="sm">
              <Pagination.Item
                disabled={isLoading || page === 0}
                onClick={() => {
                  setPage(page - 1);
                }}
              >
                Previous
              </Pagination.Item>
              <Pagination.Item
                disabled={isLoading || isEndOfPage}
                onClick={() => {
                  setPage(page + 1);
                }}
              >
                Next
              </Pagination.Item>
            </Pagination>
          )}
        </Card.Footer>
      </Card>
    </Col>
  );
};

export default ModelLeaderBoard;
