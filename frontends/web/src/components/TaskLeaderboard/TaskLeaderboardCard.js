import React from "react";
import { useEffect, useState, useContext } from "react";
import { Card, Pagination, Button } from "react-bootstrap";
import UserContext from "../../containers/UserContext";
import OverallModelLeaderBoard from "./OverallModelLeaderBoard";

function rand(min, max) {
  return min + Math.random() * (max - min);
}

const SortDirection = {
  ASC: "asc",
  DESC: "desc",
  getOppositeDirection(direction) {
    return direction === this.ASC ? this.DESC : this.ASC;
  },
};

const TaskLeaderboardCard = (props) => {
  const task = props.task;

  const [data, setData] = useState([]);
  const [enableWeights, setEnableWeights] = useState(false);
  const [metrics, setMetrics] = useState(
    task?.ordered_metrics?.map((m) => {
      return { id: m, label: m, weight: 1 };
    })
  );

  // Dataset Weights Array of a set of dataset id and corresponding weight.
  const [datasetWeights, setDatasetWeights] = useState(
    task?.ordered_datasets?.map((ds) => {
      return { id: ds.id, weight: 1 };
    })
  );

  const [sort, setSort] = useState({
    field: "acc",
    direction: SortDirection.ASC,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);

  const taskId = props.taskId;

  const setMetricWeight = (metricID, newWeight) => {
    setMetrics((state) => {
      const list = state.map((item, j) => {
        if (item.id === metricID) {
          return { ...item, weight: newWeight };
        } else {
          return item;
        }
      });
      return list;
    });
  };

  const setDatasetWeight = (datasetID, newWeight) => {
    setDatasetWeights((state) => {
      const list = state.map((item, j) => {
        if (item.id === datasetID) {
          return { ...item, weight: newWeight };
        } else {
          return item;
        }
      });
      return list;
    });
  };

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

  const fetchOverallModelLeaderboard = (api, page) => {
    const metricSum = metrics.reduce((acc, entry) => acc + entry.weight, 0);
    const orderedMetricWeights = metrics.map((entry) =>
      metricSum === 0 ? 0.0 : entry.weight / metricSum
    );
    const dataSetSum = datasetWeights.reduce(
      (acc, entry) => acc + entry.weight,
      0
    );
    const orderedDatasetWeights = datasetWeights.map((entry) =>
      dataSetSum === 0 ? 0.0 : entry.weight / dataSetSum
    );

    api
      .getDynaboardScores(
        taskId,
        10,
        page,
        sort.field,
        sort.direction,
        orderedMetricWeights,
        orderedDatasetWeights
      )
      .then(
        (result) => {
          // const isEndOfPage = (page + 1) * this.state.pageLimit >= result.count;
          setData(result.data);
        },
        (error) => {
          console.log(error);
        }
      );
  };

  const paginate = (component, state) => {};

  const context = useContext(UserContext);

  // Call api on sort, page and weights changed.
  useEffect(() => {
    setIsLoading(true);
    fetchOverallModelLeaderboard(context.api, page);
    setIsLoading(false);
    return () => {};
  }, [page, sort, metrics, datasetWeights]);

  return (
    <Card className="my-4">
      <Card.Header className="p-3 light-gray-bg">
        <h2 className="text-uppercase m-0 text-reset">
          {props && props.location && props.location.hash === "#overall"
            ? "Overall Model Leaderboard"
            : "Round " + props.displayRoundId + " Model Leaderboard"}
        </h2>
        <Button
          className="btn bg-transparent border-0 float-right"
          onClick={() => setEnableWeights(!enableWeights)}
        >
          <span className="text-black-50">
            <i className="fas fa-sliders-h"></i>
          </span>
        </Button>
      </Card.Header>
      <Card.Body className="p-0 leaderboard-container">
        <OverallModelLeaderBoard
          models={data}
          task={task}
          enableWeights={enableWeights}
          metrics={metrics}
          setMetricWeight={setMetricWeight}
          datasetWeights={datasetWeights}
          setDatasetWeight={setDatasetWeight}
          taskShortName={props.task.shortname}
          sort={sort}
          toggleSort={toggleSort}
        />
      </Card.Body>
      <Card.Footer className="text-center">
        <Pagination className="mb-0 float-right" size="sm">
          <Pagination.Item
            disabled={isLoading || page === 0}
            onClick={() => paginate("model", "previous")}
          >
            Previous
          </Pagination.Item>
          <Pagination.Item
            // disabled={this.state.isEndOfModelLeaderPage}
            onClick={() => paginate("model", "next")}
          >
            Next
          </Pagination.Item>
        </Pagination>
      </Card.Footer>
    </Card>
  );
};
export default TaskLeaderboardCard;
