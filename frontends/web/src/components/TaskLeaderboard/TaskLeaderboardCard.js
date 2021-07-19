import React from "react";
import { useEffect, useState, useContext } from "react";
import {
  Card,
  Pagination,
  Button,
  Tooltip,
  OverlayTrigger,
  Modal,
} from "react-bootstrap";
import UserContext from "../../containers/UserContext";
import OverallModelLeaderBoard from "./OverallModelLeaderBoard";
import ForkModal from "./ForkModal";

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
  const [enableHelp, setEnableHelp] = useState(false);
  const [enableWeights, setEnableWeights] = useState(false);
  const [enableDatasetWeights, setEnableDatasetWeights] = useState(false);
  // Map task metrics to include weights for UI
  const [metrics, setMetrics] = useState();

  // Dataset Weights Array of a set of dataset id and corresponding weight.
  const [datasetWeights, setDatasetWeights] = useState();

  const [snapshotName, setSnapshotName] = useState(
    props.match.params.snapshotName
  );

  // Update weights on task change
  useEffect(() => {
    // Used to load default weights for metrics. When a new metric is found which was not saved in a leaderboard
    // configuration, the default weight is used.
    const metricIdToDataObj = {};
    task.ordered_metrics.forEach((m) => {
      metricIdToDataObj[m.name] = {
        id: m.name,
        label: m.name,
        weight: m.default_weight,
        unit: m.unit,
      };
    });

    // Used to load default weights for datasets. When a new dataset is found which was not saved in a leaderboard
    // configuration, the default weight is used.
    const datasetIdToDataObj = {};
    task.ordered_scoring_datasets.forEach((ds) => {
      datasetIdToDataObj[ds.id] = {
        id: ds.id,
        weight: ds.default_weight,
        name: ds.name,
      };
    });

    const setMetricsAndDatasetsWeights = () => {
      const orderedMetricWeights = task.ordered_metrics.map(
        (m) => metricIdToDataObj[m.name]
      );
      const orderedDatasetWeights = task.ordered_scoring_datasets.map(
        (ds) => datasetIdToDataObj[ds.id]
      );
      setMetrics(orderedMetricWeights);
      setDatasetWeights(orderedDatasetWeights);
    };

    const leaderboardName = props.match.params.leaderboardName;

    const updateMetricAndDatasetWeightFromJson = (configurationJson) => {
      configurationJson.metricWeights.forEach((m) => {
        if (m.id in metricIdToDataObj) {
          metricIdToDataObj[m.id].weight = m.weight;
        }
      });
      configurationJson.datasetWeights.forEach((d) => {
        if (d.id in datasetIdToDataObj) {
          datasetIdToDataObj[d.id].weight = d.weight;
        }
      });
      setMetricsAndDatasetsWeights();
    };

    const forkOrSnapshotErrorCallback = (error) => {
      console.log(error);
      if (error?.status_code === 404) {
        props.history.replace({
          pathname: `/tasks/${taskId}`,
        });
      }
      setMetricsAndDatasetsWeights();
      setSnapshotName(null);
    };

    if (leaderboardName != null) {
      context.api
        .getLeaderboardConfiguration(task.id, leaderboardName)
        .then((result) => {
          const configuration_json = JSON.parse(result.configuration_json);
          updateMetricAndDatasetWeightFromJson(configuration_json);
        }, forkOrSnapshotErrorCallback);
    } else if (snapshotName != null) {
      context.api
        .getLeaderboardSnapshot(task.id, snapshotName)
        .then((result) => {
          const dataJson = JSON.parse(result.data_json);
          updateMetricAndDatasetWeightFromJson(dataJson.configuration_json);
          setData(dataJson.data);
          setTotal(dataJson.count);
          setSort(dataJson.misc_info_json.sort);
        }, forkOrSnapshotErrorCallback);
    } else {
      setMetricsAndDatasetsWeights();
    }

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
  const [showForkModal, setShowForkModal] = useState(false);

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
    if (snapshotName) {
      return;
    }

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

  const getOrderedWeights = () => {
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
    return {
      orderedMetricWeights,
      orderedDatasetWeights,
    };
  };

  // Call api on sort, page and weights changed.
  useEffect(() => {
    /**
     * Invoke APIService to fetch leader board data
     *
     * @param {*} api instance of @see APIService
     * @param {number} page
     */
    const fetchOverallModelLeaderboard = (api, page) => {
      const { orderedMetricWeights, orderedDatasetWeights } =
        getOrderedWeights();
      if (!snapshotName && orderedMetricWeights && orderedDatasetWeights) {
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
      }
    };

    setIsLoading(true);

    fetchOverallModelLeaderboard(context.api, page);
    setIsLoading(false);
    return () => {};
  }, [
    page,
    sort,
    metrics,
    datasetWeights,
    context.api,
    taskId,
    pageLimit,
    snapshotName,
  ]);

  const isEndOfPage = (page + 1) * pageLimit >= total;

  return (
    <Card className="my-4">
      <Card.Header className="light-gray-bg d-flex align-items-center">
        <h2 className="text-uppercase m-0 text-reset">Model Leaderboard</h2>
        <div className="d-flex justify-content-end flex-fill">
          <ForkModal
            metricWeights={metrics}
            datasetWeights={datasetWeights}
            taskId={taskId}
            showForkModal={showForkModal}
            setShowForkModal={setShowForkModal}
            history={props.history}
          />
          <Modal
            size="lg"
            show={enableHelp}
            onHide={() => setEnableHelp(!enableHelp)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Dynaboard Information</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              This is a <b>dynamic leaderboard</b>. It allows you, the user, to
              specify your own utility function over a variety of metrics and
              datasets, which determines the final ranking of models for this
              particular task. The default initial weights are specified by the
              task owners.
              <br />
              <br />
              There are a few important caveats that you should keep in mind
              when interacting with this leaderboard:
              <br />
              <br />
              <ul>
                <li>
                  The dynascore is dynamic. It is computed with respect to other
                  models in the system, and thus keeps changing over time. We do
                  not recommend reporting solely on the dynascore in papers,
                  unless it is clearly accompanied with a reference to the
                  dynamic leaderboard.
                </li>
                <li>
                  The fairness and robustness metrics are far from perfect.
                  There is no singular way to measure model fairness. Whether to
                  include any explicit fairness metric was a difficult choice –
                  we acknowledge that we might inadvertently facilitate false or
                  spurious fairness claims, fairness-value hacking, or give
                  people a false sense of fairness. The research community has a
                  long way to go in terms of developing well-defined concrete
                  fairness measurements. Ultimately, however, we came to the
                  conclusion that fairness is such an important axis of
                  evaluation that we would rather have an imperfect metric than
                  no metric at all: in our view, a multi-metric model evaluation
                  framework simply must include fairness as a primary evaluation
                  axis. Please refer to the paper for more details. We encourage
                  the community to come up with better blackbox fairness and
                  robustness metrics.
                </li>
                <li>
                  The compute and memory metrics are computed using AWS
                  Cloudwatch. Throughput in examples per second is computed as
                  the total number of examples divided by the inference time in
                  seconds. The inference time is the difference between
                  TransformEndTime and TransformStartTime from AWS’s{" "}
                  <a
                    href={
                      "https://docs.aws.amazon.com/sagemaker/latest/APIReference/API_DescribeTransformJob.html"
                    }
                  >
                    DescribeTransformJob API
                  </a>
                  . Memory is the average of all logged{" "}
                  <a
                    href={
                      "https://docs.aws.amazon.com/sagemaker/latest/dg/monitoring-cloudwatch.html#cloudwatch-metrics-jobs"
                    }
                  >
                    MemoryUtilization
                  </a>{" "}
                  data points (logged as a utilization percentage every 1 minute
                  by AWS) during inference, which is converted into GiB by
                  multiplying with the total available memory of the instance
                  type. Note that this is the memory utilization of the entire
                  model’s docker container that serves the model. Both metrics
                  are dependent on the instance type, and contain some
                  randomness, i.e. they are expected to change slightly every
                  time even in exactly the same setup. In our setup,{" "}
                  <a href={"https://aws.amazon.com/sagemaker/pricing/"}>
                    ml.m5.2xlarge
                  </a>{" "}
                  is the default machine instance, which has 8 cpus and 32 GiB
                  memory. All metrics are higher-is-better, except memory, where
                  lower is better.
                </li>
              </ul>
              For more details, see the paper.
            </Modal.Body>
          </Modal>
          {(process.env.REACT_APP_ENABLE_LEADERBOARD_FORK === "true" ||
            context.user.admin) &&
            !snapshotName && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tip-leaderboard-fork">Snapshot</Tooltip>}
              >
                <Button
                  className="btn bg-transparent border-0"
                  onClick={() => {
                    if (context.api.loggedIn()) {
                      // setShowForkModal(!showForkModal);
                      const { orderedMetricWeights, orderedDatasetWeights } =
                        getOrderedWeights();
                      context.api
                        .createLeaderboardSnapshot(
                          taskId,
                          "test_name",
                          sort,
                          metrics,
                          datasetWeights,
                          orderedMetricWeights,
                          orderedDatasetWeights,
                          total
                        )
                        .then(
                          (result) => console.log(result),
                          (error) => console.log(error)
                        );
                    } else {
                      props.history.push(
                        "/login?msg=" +
                          encodeURIComponent(
                            "You need to login to snapshot a leaderboard."
                          ) +
                          `&src=/tasks/${taskId}`
                      );
                    }
                  }}
                >
                  <span className="text-black-50">
                    <i className="fas fa-camera"></i>
                  </span>
                </Button>
              </OverlayTrigger>
            )}
          {(process.env.REACT_APP_ENABLE_LEADERBOARD_FORK === "true" ||
            context.user.admin) &&
            !snapshotName && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tip-leaderboard-fork">Fork</Tooltip>}
              >
                <Button
                  className="btn bg-transparent border-0"
                  onClick={() => {
                    if (context.api.loggedIn()) {
                      setShowForkModal(!showForkModal);
                    } else {
                      props.history.push(
                        "/login?msg=" +
                          encodeURIComponent(
                            "You need to login to fork a leaderboard."
                          ) +
                          `&src=/tasks/${taskId}`
                      );
                    }
                  }}
                >
                  <span className="text-black-50">
                    <i className="fas fa-code-branch"></i>
                  </span>
                </Button>
              </OverlayTrigger>
            )}
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="tip-metric-weights">Help</Tooltip>}
          >
            <Button
              className="btn bg-transparent border-0"
              onClick={() => {
                setEnableHelp(!enableHelp);
              }}
            >
              <span className="text-black-50">
                <i className="fas fa-question"></i>
              </span>
            </Button>
          </OverlayTrigger>
          {!snapshotName && (
            <>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tip-metric-weights">Metric Weights</Tooltip>
                }
              >
                <Button
                  className="btn bg-transparent border-0"
                  onClick={() => {
                    setEnableWeights(!enableWeights);
                    setEnableDatasetWeights(false);
                  }}
                >
                  <span className="text-black-50">
                    <i className="fas fa-sliders-h"></i>
                  </span>
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tip-dataset-weights">Dataset Weights</Tooltip>
                }
              >
                <Button
                  className="btn bg-transparent border-0"
                  onClick={() => {
                    setEnableDatasetWeights(!enableDatasetWeights);
                    setEnableWeights(false);
                  }}
                >
                  <span className="text-black-50">
                    <i className="fas fa-database"></i>
                  </span>
                </Button>
              </OverlayTrigger>
            </>
          )}
        </div>
      </Card.Header>
      <Card.Body className="p-0 leaderboard-container">
        <OverallModelLeaderBoard
          models={data}
          task={task}
          enableWeights={enableWeights}
          metrics={metrics}
          setMetricWeight={setMetricWeight}
          enableDatasetWeights={enableDatasetWeights}
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
