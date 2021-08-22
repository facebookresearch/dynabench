import React from "react";
import ForkAndSnapshotModal from "./ForkAndSnapshotModal";
import { getOrderedWeights } from "./TaskModelLeaderboardCardWrapper";

/**
 *
 * This is a wrapper around ForkAndSnapshotModal.js which allows to extract out the logic for saving the fork/snapshot
 * to the database along with some other props.
 *
 * @param {boolean} isFork Whether the modal is used to create fork or snapshot
 * @param {string} modalDescription Description of what a fork/snapshot is
 * @param {function} handleSave Function that contains the API call to save the fork/snapshot.
 * @returns {function(*)} A functional component that uses the custom props and function passed to
 * forkAndSnapshotModalWrapper and renders a ForkAndSnapshotModal.
 */
const forkAndSnapshotModalWrapper = (isFork, modalDescription, handleSave) => {
  return (props) => {
    const { metricWeights, datasetWeights, taskId, sort, total } = props;

    return (
      <ForkAndSnapshotModal
        {...props}
        isFork={isFork}
        modalDescription={modalDescription}
        handleSave={(...args) =>
          handleSave(
            ...args,
            metricWeights,
            datasetWeights,
            taskId,
            sort,
            total
          )
        }
      />
    );
  };
};

const createLeaderboardConfiguration = (
  uriEncodedName,
  description,
  api,
  metricWeights,
  datasetWeights,
  taskId,
  sort,
  total
) => {
  const configuration_json = JSON.stringify({
    metricWeights: metricWeights,
    datasetWeights: datasetWeights,
  });

  return api.createLeaderboardConfiguration(
    taskId,
    uriEncodedName,
    configuration_json,
    description
  );
};

const createSnapshot = (
  uriEncodedName,
  description,
  api,
  metricWeights,
  datasetWeights,
  taskId,
  sort,
  total
) => {
  const { orderedMetricWeights, orderedDatasetWeights } = getOrderedWeights(
    metricWeights,
    datasetWeights
  );

  return api.createLeaderboardSnapshot(
    taskId,
    sort,
    metricWeights,
    datasetWeights,
    orderedMetricWeights,
    orderedDatasetWeights,
    total,
    description,
    uriEncodedName
  );
};

export const ForkModal = forkAndSnapshotModalWrapper(
  true,
  `Save the weights for metrics and datasets such that the
    configuration can be shared with anyone using a link. This creates a
    custom "fork" of the default leaderboard configuration.`,
  createLeaderboardConfiguration
);

export const SnapshotModal = forkAndSnapshotModalWrapper(
  false,
  `Save leaderboard standings along with weights for metrics and 
    datasets and share with anyone using a link. Results shown in the 
    snapshot table will be frozen and will not change over time.`,
  createSnapshot
);

export const FloresSnapshotModal = forkAndSnapshotModalWrapper(
  false,
  `Save leaderboard standings and share with 
    anyone using a permanent link. Results shown in the snapshot 
    table will be frozen and will not change over time.`,
  createSnapshot
);
