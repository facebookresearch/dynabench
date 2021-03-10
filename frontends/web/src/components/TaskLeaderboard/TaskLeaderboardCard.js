import React from "react";
import { useEffect, useState, useContext } from "react";
import { Card, Pagination, Button } from "react-bootstrap";
import UserContext from "../../containers/UserContext";
import OverallModelLeaderBoard from "./OverallModelLeaderBoard";

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function mockDynaboardDataForModels(data, count) {
  for (let model of data) {
    // Mock DynaScore
    model.dynascore = rand(0, 100);
    // Mock Metric Lables
    model.metric_labels = [
      "Acc",
      "Compute",
      "Memory",
      "Fairness",
      "Robustness",
    ];
    // Mock Overall display_scores
    model.display_scores = [...Array(model.metric_labels.length)].map(
      (x, i) => "" + Math.round(rand(0, 1000)) + " units"
    );
    // Mock dataset display_scores

    let datasets = [];

    for (let i = 0; i < count; i++) {
      let dataset = {};
      dataset.id = i + 1;
      dataset.name = "Round " + (i + 1);
      dataset.display_scores = [...Array(model.metric_labels.length)].map(
        (x, i) => "" + Math.round(rand(0, 1000)) + " units"
      );

      datasets.push(dataset);
    }

    model.datasets = datasets;
  }

  return data;
}

const SortDirection = {
  ASC: "asc",
  DESC: "desc",
  getOppositeDirection(direction) {
    return direction === this.ASC ? this.DESC : this.ASC;
  },
};

const TaskLeaderboardCard = (props) => {
  const [data, setData] = useState([]);
  const [tags, setTags] = useState([]);
  const [enableWeights, setEnableWeights] = useState(false);
  const [metrics, setMetrics] = useState([
    { id: "acc", label: "Acc", weight: 2 },
    { id: "compute", label: "Compute", weight: 2 },
    { id: "memory", label: "Memory", weight: 2 },
    { id: "fairness", label: "Fairness", weight: 2 },
    { id: "robustness", label: "Robustness", weight: 2 },
  ]);

  // Dataset Weights Array of a set of dataset id and corresponding weight.
  const [datasetWeights, setDatasetWeights] = useState({});

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
    const temp = { ...datasetWeights };
    temp[datasetID] = newWeight;
    setDatasetWeights(temp);
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
    api
      .getOverallModelLeaderboard(
        taskId,
        props.location.hash.replace("#", ""),
        10,
        page
      )
      .then(
        (result) => {
          // const isEndOfPage = (page + 1) * this.state.pageLimit >= result.count;
          setData(mockDynaboardDataForModels(result.data, result.count));
          setTags(result.leaderboard_tags);
        },
        (error) => {
          console.log(error);
        }
      );
  };

  const paginate = (component, state) => {};

  const context = useContext(UserContext);

  // Mock up data weights
  useEffect(() => {
    setDatasetWeights({ 1: 2, 2: 4 });
    return () => {};
  }, []);

  // Call api on sort, page and weights changed.
  useEffect(() => {
    setIsLoading(true);
    fetchOverallModelLeaderboard(context.api, page);
    setIsLoading(false);
    return () => {};
  }, [page, sort]);

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
          tags={tags}
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
