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

const TaskLeaderboardCard = (props) => {
  const [data, setData] = useState([]);
  const [tags, setTags] = useState([]);
  const [enableWeights, setEnableWeights] = useState(true);
  const [weights, setWeights] = useState([
    { id: "acc", label: "Acc", weight: 20 },
    { id: "compute", label: "Compute", weight: 20 },
    { id: "memory", label: "Memory", weight: 20 },
    { id: "fairness", label: "Fairness", weight: 20 },
    { id: "robustness", label: "Robustness", weight: 20 },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);

  const taskId = props.taskId;

  const setWeightForId = (weightID, newWeight) => {
    setWeights((state) => {
      const list = state.map((item, j) => {
        if (item.id === weightID) {
          return { ...item, weight: newWeight };
        } else {
          return item;
        }
      });

      return list;
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

  useEffect(() => {
    setIsLoading(true);
    fetchOverallModelLeaderboard(context.api, page);
    setIsLoading(false);
    return () => {};
  }, [page]);

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
          <span class="text-black-50">
            <i class="fas fa-sliders-h"></i>
          </span>
        </Button>
      </Card.Header>
      <Card.Body className="p-0 leaderboard-container">
        <OverallModelLeaderBoard
          models={data}
          tags={tags}
          enableWeights={enableWeights}
          weights={weights}
          setWeightForId={setWeightForId}
          taskShortName={props.task.shortname}
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