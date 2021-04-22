import React from "react";
import { useEffect, useState, useContext } from "react";
import { Card, Pagination, Button } from "react-bootstrap";
import UserContext from "../../containers/UserContext";
import OverallModelLeaderBoard from "./OverallModelLeaderBoard";

const SortDirection = {
  ASC: "asc",
  DESC: "desc",
  getOppositeDirection(direction) {
    return direction === this.ASC ? this.DESC : this.ASC;
  },
};

/**
 * Represents the leader board for a task. i.e. Dynaboard
 *
 * @param {Object} props React props de-structured.
 * @param {Object} params.task The task
 * @param {number} params.taskId The taskID
 * @param {string} props.location navigation location
 */
const TaskLeaderboardCard = (props) => {
  const task = props.task;

  const [data, setData] = useState([]);
  const [enableWeights, setEnableWeights] = useState(false);
  // Map task metrics to include weights for UI
  const [metrics, setMetrics] = useState([]);

  // Dataset Weights Array of a set of dataset id and corresponding weight.
  const [datasetWeights, setDatasetWeights] = useState([]);
  // Update weights on task change
  useEffect(() => {
    setMetrics(
      task?.ordered_metrics?.map((m) => {
        return task.perf_metric_field_name === m.field_name
          ? { id: m.name, label: m.name, weight: 5, unit: m.unit }
          : { id: m.name, label: m.name, weight: 1, unit: m.unit };
      })
    );

    setDatasetWeights(
      task.ordered_scoring_datasets?.map((ds) => {
        return { id: ds.id, weight: 5, name: ds.name }; // Default weight to max i.e. 5.
      })
    );
    return () => {};
  }, [task]);

  const [sort, setSort] = useState({
    field: "dynascore",
    direction: SortDirection.DESC,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageLimit, setPageLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const taskId = props.taskId;

  /**
   * Update weight state for the appropriate metric
   *
   *  @param {number} metricID Metric ID
   *  @param {number} newWeight New weight for metric.
   */
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

  /**
   * Update weight state for the appropriate dataset
   *
   *  @param {number} datasetID Dataset ID
   *  @param {number} newWeight New weight for dataset.
   */
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

  const context = useContext(UserContext);

  // Call api on sort, page and weights changed.
  useEffect(() => {
    /**
     * Invoke APIService to fetch leader board data
     *
     * @param {*} api instance of @see APIService
     * @param {number} page
     */
    const fetchOverallModelLeaderboard = (api, page) => {
      const metricSum = metrics?.reduce((acc, entry) => acc + entry.weight, 0);
      const orderedMetricWeights = metrics?.map((entry) =>
        metricSum === 0 ? 0.0 : entry.weight / metricSum
      );
      const dataSetSum = datasetWeights?.reduce(
        (acc, entry) => acc + entry.weight,
        0
      );
      const orderedDatasetWeights = datasetWeights?.map((entry) =>
        dataSetSum === 0 ? 0.0 : entry.weight / dataSetSum
      );

      api
        .getDynaboardScores(
          taskId,
          pageLimit,
          page * pageLimit,
          sort.field,
          sort.direction,
          orderedMetricWeights,
          orderedDatasetWeights
        )
        .then(
          (result) => {
            setData(result.data);
            setTotal(result.count);
          },
          (error) => {
            console.log(error);
          }
        );
    };

    setIsLoading(true);

    fetchOverallModelLeaderboard(context.api, page);
    setIsLoading(false);
    return () => {};
  }, [page, sort, metrics, datasetWeights, context.api, taskId, pageLimit]);

  const isEndOfPage = (page + 1) * pageLimit >= total;

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
      </Card.Footer>
    </Card>
  );
};
export default TaskLeaderboardCard;
