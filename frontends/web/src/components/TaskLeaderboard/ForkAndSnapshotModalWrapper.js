import ForkAndSnapshotModal from "./ForkAndSnapshotModal";
import React from "react";
import { getOrderedWeights } from "./TaskModelLeaderboardCardWrapper";

const ForkAndSnapshotModalWrapper = (
  title,
  description,
  showWeights,
  nameForTexts,
  isNameMandatory,
  onSave
) => {
  return (props) => {
    const dataFromProps = {
      metricWeights: props.metricWeights,
      datasetWeights: props.datasetWeights,
      sort: props.sort,
      total: props.total,
    };

    return (
      <ForkAndSnapshotModal
        {...props}
        title={title}
        description={description}
        showWeights={showWeights}
        nameForTexts={nameForTexts}
        isNameMandatory={isNameMandatory}
        onSave={(...args) => onSave(...args, dataFromProps)}
      />
    );
  };
};

export const ForkModal = ForkAndSnapshotModalWrapper(
  "Fork",
  `Save the weights for metrics and datasets and share this saved configuration with anyone using a
  link. Results shown in a forked table will not be frozen. They would be derived based on the latest models,
  datasets and metrics.`,
  true,
  "Fork",
  true,
  (
    leaderboardName,
    taskId,
    context,
    onSuccessCallback,
    onErrorCallback,
    dataFromProps
  ) => {
    const uriEncodedForkName = encodeURIComponent(leaderboardName.trim());
    const { metricWeights, datasetWeights } = dataFromProps;

    const configuration_json = JSON.stringify({
      metricWeights: metricWeights,
      datasetWeights: datasetWeights,
    });

    context.api
      .createLeaderboardConfiguration(
        taskId,
        uriEncodedForkName,
        configuration_json
      )
      .then(
        () => {
          onSuccessCallback(
            `/tasks/${taskId}/leaderboard_configuration/${uriEncodedForkName}`
          );
        },
        (error) => {
          console.log(error);
          onErrorCallback(
            error,
            "A fork with the same name already exists.",
            "You need to login to fork a leaderboard."
          );
        }
      );
  }
);

export const SnapshotModal = ForkAndSnapshotModalWrapper(
  "Snapshot",
  `Save the leaderboard standings along weights for metrics and datasets and share with anyone using a
  link. Results shown in a snapshot table will be frozen and will not change over time.`,
  false,
  "Snapshot",
  false,
  (
    snapshotName,
    taskId,
    context,
    onSuccessCallback,
    onErrorCallback,
    dataFromProps
  ) => {
    let uriEncodedSnapshotName = null;
    if (snapshotName.length !== 0) {
      uriEncodedSnapshotName = encodeURIComponent(snapshotName.trim());
    }

    const { sort, total, metricWeights, datasetWeights } = dataFromProps;
    const { orderedMetricWeights, orderedDatasetWeights } = getOrderedWeights(
      metricWeights,
      datasetWeights
    );

    context.api
      .createLeaderboardSnapshot(
        taskId,
        uriEncodedSnapshotName,
        sort,
        metricWeights,
        datasetWeights,
        orderedMetricWeights,
        orderedDatasetWeights,
        total
      )
      .then(
        (result) => {
          onSuccessCallback(
            `/tasks/${taskId}/leaderboard_snapshot/${result.name}`
          );
        },
        (error) => {
          console.log(error);
          onErrorCallback(
            error,
            "A snapshot with the same name already exists.",
            "You need to login to snapshot a leaderboard."
          );
        }
      );
  }
);
