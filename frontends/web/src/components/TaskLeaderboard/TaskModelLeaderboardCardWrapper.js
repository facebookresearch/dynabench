import React from "react";
import TaskModelLeaderboardCard from "./TaskModelLeaderboardCard";

/**
 *
 * This is a wrapper around TaskModelLeaderboardCard.js which allows to extract out the logic for initializing weights
 * and fetching leaderboard data. A custom task leaderboard can be created simply by passing in custom functions for
 * initializing weights and fetching data.
 *
 * @param getInitialWeights Function that defines how weights for metrics and datasets are to be initialized
 * @param fetchLeaderboardData Function that defines how the leaderboard data is to be fetched
 * @returns {function(*)} A functional component that uses the custom function passed to taskModelLeaderboardCardWrapper
 * and renders the TaskModelLeaderboardCard.
 */
const taskModelLeaderboardCardWrapper = (
  getInitialWeights,
  fetchLeaderboardData
) => {
  return (props) => {
    const dataFromProps = {
      snapshotName: props.match?.params.snapshotName,
      leaderboardName: props.match?.params.leaderboardName,
      history: props.history,
    };

    return (
      <TaskModelLeaderboardCard
        {...props}
        getInitialWeights={(...args) =>
          getInitialWeights(...args, dataFromProps)
        }
        fetchLeaderboardData={(...args) =>
          fetchLeaderboardData(...args, dataFromProps)
        }
      />
    );
  };
};

const loadDefaultWeights = (metricIdToDataObj, datasetIdToDataObj, task) => {
  task.ordered_metrics.forEach((m) => {
    metricIdToDataObj[m.name] = {
      id: m.name,
      label: m.name,
      weight: m.default_weight,
      unit: m.unit,
    };
  });

  task.ordered_scoring_datasets.forEach((ds) => {
    datasetIdToDataObj[ds.id] = {
      id: ds.id,
      weight: ds.default_weight,
      name: ds.name,
    };
  });
};

export const getOrderedWeights = (metricWeights, datasetWeights) => {
  const metricSum = metricWeights?.reduce(
    (acc, entry) => acc + entry.weight,
    0
  );
  const orderedMetricWeights = metricWeights?.map((entry) =>
    metricSum === 0 ? 0.0 : entry.weight / metricSum
  );
  const dataSetSum = datasetWeights?.reduce(
    (acc, entry) => acc + entry.weight,
    0
  );
  const orderedDatasetWeights = datasetWeights?.map((entry) =>
    dataSetSum === 0 ? 0.0 : entry.weight / dataSetSum
  );

  return { orderedMetricWeights, orderedDatasetWeights };
};

const loadDefaultData = (
  api,
  taskId,
  pageLimit,
  page,
  sort,
  metrics,
  datasetWeights,
  updateResultCallback
) => {
  const { orderedMetricWeights, orderedDatasetWeights } = getOrderedWeights(
    metrics,
    datasetWeights
  );

  if (orderedMetricWeights && orderedDatasetWeights) {
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
        (result) => updateResultCallback(result),
        (error) => {
          console.log(error);
          updateResultCallback(null);
        }
      );
  }
};

const getOrderedWeightObjects = (
  metricIdToDataObj,
  datasetIdToDataObj,
  task
) => {
  const orderedMetricWeights = task.ordered_metrics.map(
    (m) => metricIdToDataObj[m.name]
  );
  const orderedDatasetWeights = task.ordered_scoring_datasets.map(
    (ds) => datasetIdToDataObj[ds.id]
  );
  return { orderedMetricWeights, orderedDatasetWeights };
};

export const TaskModelDefaultLeaderboard = taskModelLeaderboardCardWrapper(
  (task, api, setWeightsCallback) => {
    const metricIdToDataObj = {};
    const datasetIdToDataObj = {};

    loadDefaultWeights(metricIdToDataObj, datasetIdToDataObj, task);
    setWeightsCallback(
      getOrderedWeightObjects(metricIdToDataObj, datasetIdToDataObj, task)
    );
  },
  loadDefaultData
);

export const TaskModelForkLeaderboard = taskModelLeaderboardCardWrapper(
  (task, api, setWeightsCallback, dataFromProps) => {
    const metricIdToDataObj = {};
    const datasetIdToDataObj = {};

    /* We first load the default weights for metrics and datasets. This is useful to load the default weight for
     * a metric/dataset which was added after the creation of a fork.
     */
    loadDefaultWeights(metricIdToDataObj, datasetIdToDataObj, task);

    const { leaderboardName, history } = dataFromProps;

    /* Through this API, the default weights for metrics and datasets get overwritten by the weights saved during
     * creation of the fork.
     */
    api.getLeaderboardConfiguration(task.id, leaderboardName).then(
      (result) => {
        const configuration_json = JSON.parse(result.configuration_json);
        configuration_json.metricWeights.forEach((m) => {
          if (m.id in metricIdToDataObj) {
            metricIdToDataObj[m.id].weight = m.weight;
          }
        });
        configuration_json.datasetWeights.forEach((d) => {
          if (d.id in datasetIdToDataObj) {
            datasetIdToDataObj[d.id].weight = d.weight;
          }
        });
        setWeightsCallback(
          getOrderedWeightObjects(metricIdToDataObj, datasetIdToDataObj, task)
        );
      },
      (error) => {
        console.log(error);
        if (error && error.status_code === 404) {
          history.replace({
            pathname: `/tasks/${task.task_code}`,
          });
        }
        setWeightsCallback(
          getOrderedWeightObjects(metricIdToDataObj, datasetIdToDataObj, task)
        );
      }
    );
  },
  loadDefaultData
);

const getSnapshotData = (
  taskId,
  snapshotName,
  api,
  history,
  resultCallback
) => {
  api.getLeaderboardSnapshot(taskId, snapshotName).then(
    (result) => {
      const dataJson = JSON.parse(result.data_json);
      resultCallback(dataJson);
    },
    (error) => {
      console.log(error);
      if (error && error.status_code === 404) {
        history.replace({
          pathname: `/tasks/${taskId}`,
        });
      }
      resultCallback(null);
    }
  );
};

export const TaskModelSnapshotLeaderboard = taskModelLeaderboardCardWrapper(
  (task, api, setWeightsCallback, dataFromProps) => {
    const metricIdToDataObj = {};
    const datasetIdToDataObj = {};

    const { snapshotName, history } = dataFromProps;

    getSnapshotData(task.id, snapshotName, api, history, (result) => {
      if (result != null) {
        const { metricWeights, datasetWeights } = result;
        setWeightsCallback({
          orderedMetricWeights: metricWeights,
          orderedDatasetWeights: datasetWeights,
        });
      } else {
        loadDefaultWeights(metricIdToDataObj, datasetIdToDataObj, task);
        setWeightsCallback(
          getOrderedWeightObjects(metricIdToDataObj, datasetIdToDataObj, task)
        );
      }
    });
  },
  (
    api,
    taskId,
    pageLimit,
    page,
    sort,
    metrics,
    datasetWeights,
    updateResultCallback,
    dataFromProps
  ) => {
    const { snapshotName, history } = dataFromProps;

    getSnapshotData(taskId, snapshotName, api, history, (result) => {
      if (result != null) {
        updateResultCallback({
          data: result.data.slice(page * pageLimit, (page + 1) * pageLimit),
          count: result.count,
          sort: result.miscInfoJson.sort,
        });
      } else {
        updateResultCallback(null);
      }
    });
  }
);
