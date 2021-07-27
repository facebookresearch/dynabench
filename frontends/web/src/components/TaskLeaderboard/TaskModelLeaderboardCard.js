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
import TaskModelLeaderboardTable from "./TaskModelLeaderboardTable";
import { ForkModal, SnapshotModal } from "./ForkAndSnapshotModalWrapper";

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
 * @param {Object} props.task The task
 * @param {number} props.taskId The taskID
 * @param {boolean} props.disableToggleSort Whether or not changing sort field/direction is allowed
 * @param {boolean} props.disableAdjustWeights Whether or not changing metric/dataset weights is allowed
 * @param {boolean} props.disableForkAndSnapshot Whether or not forking and snapshotting is allowed
 * @param {function} props.getInitialWeights Fn to initialize weights for metrics and datasets
 * @param {function} props.fetchLeaderboardData Fn to load leaderboard data
 * @param {string} props.history navigation API
 * @param {string} props.location navigation location
 * @param {boolean} props.isStandalone is in Stand alone mode
 */
const TaskModelLeaderboardCard = (props) => {
  const task = props.task;

  const [data, setData] = useState([]);
  const [enableHelp, setEnableHelp] = useState(false);
  const [enableWeights, setEnableWeights] = useState(false);
  const [enableDatasetWeights, setEnableDatasetWeights] = useState(false);

  // Map task metrics to include weights for UI
  const [metrics, setMetrics] = useState();

  // Dataset Weights Array of a set of dataset id and corresponding weight.
  const [datasetWeights, setDatasetWeights] = useState();

  // Update weights on task change
  useEffect(() => {
    props.getInitialWeights(task, context.api, (result) => {
      setMetrics(result.orderedMetricWeights);
      setDatasetWeights(result.orderedDatasetWeights);
    });
  }, [context.api, props, task]);

  const [sort, setSort] = useState({
    field: "dynascore",
    direction: SortDirection.DESC,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageLimit, setPageLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showForkModal, setShowForkModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

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
    if (props.disableToggleSort || props.isStandalone) {
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

  // Call api on sort, page and weights changed.
  useEffect(() => {
    setIsLoading(true);
    props.fetchLeaderboardData(
      context.api,
      taskId,
      pageLimit,
      page,
      sort,
      metrics,
      datasetWeights,
      (result) => {
        setData(result ? result.data : []);
        setTotal(result ? result.count : 0);
        if (
          result &&
          result.sort &&
          (result.sort.direction !== sort.direction ||
            result.sort.field !== sort.field)
        ) {
          setSort(result.sort);
        }
        setIsLoading(false);
      }
    );

    return () => {};
  }, [
    page,
    sort,
    metrics,
    datasetWeights,
    context.api,
    taskId,
    pageLimit,
    props,
  ]);

  const isEndOfPage = (page + 1) * pageLimit >= total;

  return (
    <Card className="my-4">
      <Card.Header className="light-gray-bg d-flex align-items-center">
        <h2 className="text-uppercase m-0 text-reset">
          Model Leaderboard {props.isStandalone ? " - " + task.name : ""}
        </h2>
        <div className="d-flex justify-content-end flex-fill">
          <ForkModal
            metricWeights={metrics}
            datasetWeights={datasetWeights}
            taskId={taskId}
            showModal={showForkModal}
            setShowModal={setShowForkModal}
            history={props.history}
          />
          <SnapshotModal
            metricWeights={metrics}
            datasetWeights={datasetWeights}
            taskId={taskId}
            showModal={showSnapshotModal}
            setShowModal={setShowSnapshotModal}
            history={props.history}
            sort={sort}
            total={total}
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
          {(process.env.REACT_APP_ENABLE_LEADERBOARD_SNAPSHOT === "true" ||
            context.user.admin) &&
            !props.disableForkAndSnapshot && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tip-leaderboard-fork">Snapshot</Tooltip>}
              >
                <Button
                  className="btn bg-transparent border-0"
                  onClick={() => {
                    if (context.api.loggedIn()) {
                      setShowSnapshotModal(true);
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
            !props.disableForkAndSnapshot &&
            !props.isStandalone && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tip-leaderboard-fork">Fork</Tooltip>}
              >
                <Button
                  className="btn bg-transparent border-0"
                  onClick={() => {
                    if (context.api.loggedIn()) {
                      setShowForkModal(true);
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
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setEnableHelp(!enableHelp);
              }}
            >
              <span className="text-black-50">
                <i className="fas fa-question"></i>
              </span>
            </Button>
          </OverlayTrigger>
          {!props.disableAdjustWeights && !props.isStandalone && (
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
        <TaskModelLeaderboardTable
          models={data}
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
          {props.isStandalone && (
            <img
              src="/Powered_by_Dynabench-Logo.svg"
              style={{ height: "24px" }}
            />
          )}
          {!props.isStandalone && (
            <>
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
            </>
          )}
        </Pagination>
      </Card.Footer>
    </Card>
  );
};
export default TaskModelLeaderboardCard;
