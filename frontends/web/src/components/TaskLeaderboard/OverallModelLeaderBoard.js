import { Form, OverlayTrigger, Popover } from "react-bootstrap";
import React from "react";
import { useState, useRef } from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";

const ChevronExpandButton = ({ expanded }) => {
  return (
    <a type="button" className="position-absolute start-100">
      {expanded ? (
        <i className="fas fa-chevron-down"></i>
      ) : (
        <i className="fas fa-chevron-right"></i>
      )}
    </a>
  );
};

const WeightSlider = ({ weight, onWeightChange }) => {
  return (
    <Form className="d-flex ml-2">
      <Form.Control
        type="range"
        className="flex-grow-1"
        size="sm"
        min={0}
        max={5}
        value={weight}
        onInput={(event) => {
          // console.log(weight.id, event.target.valueAsNumber);
          //
          onWeightChange(event.target.valueAsNumber);
        }}
      />

      <span className="fw-lighter flex-grow-0">&nbsp;&nbsp;{weight}/5</span>
    </Form>
  );
};

const VariancePopover = ({ target, variance, children }) => (
  <OverlayTrigger
    placement="right"
    delay={{ show: 250, hide: 400 }}
    overlay={
      <Popover>
        <Popover.Content>
          <div style={{ display: "inline" }}>
            <span className="position-absolute  mt-1">&minus;</span>
            <span>+</span>
          </div>
          {variance}
        </Popover.Content>
      </Popover>
    }
    target={target.current}
  >
    {children}
  </OverlayTrigger>
);

/**
 * A Row representing a Models score in the leaderbord.
 * This component also manages the expansion state of the row.
 *
 * @param {*} model The model data
 * @param {*} metrics Metrcis metadata use for lables and weights.
 *
 */
const OverallModelLeaderboardRow = ({
  model,
  ordered_datasets,
  metrics,
  enableWeights,
  datasetWeights,
  setDatasetWeight,
  totalWeight,
}) => {
  const [expanded, setExpanded] = useState(false);

  const dynascore = parseFloat(model.dynascore).toFixed(0);

  const totalRows = expanded ? model.datasets.length + 1 : 1;

  const weightsLookup = datasetWeights.reduce((acc, entry) => {
    acc[entry.id] = entry.weight;
    return acc;
  }, {});

  const target = useRef(null);

  return (
    <>
      <tr key={model.model_id} onClick={() => setExpanded(!expanded)}>
        <td>
          <Link to={`/models/${model.model_id}`} className="btn-link">
            {model.model_name}
          </Link>{" "}
          <Link to={`/users/${model.uid}#profile`} className="btn-link">
            ({model.username})
          </Link>
          <div style={{ float: "right" }}>
            <ChevronExpandButton expanded={expanded} />
          </div>
        </td>

        {model &&
          model.averaged_display_scores.map((score, i) => {
            return (
              <td
                className="text-right t-2"
                key={`score-${model.model_name}-${metrics[i].id}-overall`}
              >
                <VariancePopover
                  target={target}
                  variance={model.averaged_display_variances[i]}
                >
                  <span>{expanded ? <b>{score}</b> : score}</span>
                </VariancePopover>
              </td>
            );
          })}

        <td className="text-right  align-middle pr-4 " rowSpan={totalRows}>
          <VariancePopover target={target} variance={model.dynavariance}>
            <span>{expanded ? <h1>{dynascore}</h1> : dynascore}</span>
          </VariancePopover>
        </td>
      </tr>
      {expanded &&
        model.datasets &&
        model.datasets.map((dataset) => {
          const weight = weightsLookup[dataset.id];
          const calculatedWeight =
            totalWeight === 0 ? 0 : Math.round((weight / totalWeight) * 100);
          return (
            <tr key={`score-${dataset.name}`}>
              {/* Title */}
              <td className="text-right pr-4  text-nowrap">
                <div className="d-flex justify-content-end">
                  <span>
                    {dataset.name}
                    {!enableWeights && <sup>{calculatedWeight}%</sup>}
                  </span>
                  {enableWeights && (
                    <WeightSlider
                      weight={weight}
                      onWeightChange={(newWeight) => {
                        setDatasetWeight(dataset.id, newWeight);
                      }}
                    />
                  )}
                </div>
              </td>
              {dataset.display_scores &&
                dataset.display_scores.map((score, i) => {
                  return (
                    <td
                      className="text-right pr-4"
                      key={`score-${model.model_name}-${dataset.id}-${i}-overall`}
                    >
                      <VariancePopover
                        target={target}
                        variance={dataset.display_variances[i]}
                      >
                        <span>{score}</span>
                      </VariancePopover>
                    </td>
                  );
                })}
            </tr>
          );
        })}
    </>
  );
};

const SortContainer = ({ sortKey, toggleSort, currentSort, children }) => {
  return (
    <div onClick={() => toggleSort(sortKey)}>
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

const MetricWeightTableHeader = ({
  metric,
  setMetricWeight,
  enableWeights,
  total,
  sort,
  toggleSort,
}) => {
  const calculatedWeight =
    total === 0 ? 0 : Math.round((metric.weight / total) * 100);

  return (
    <th className="text-right pr-4 " key={`th-${metric.id}`}>
      <SortContainer
        sortKey={metric.id}
        toggleSort={toggleSort}
        currentSort={sort}
      >
        {metric.label}
        {!enableWeights && <sup>&nbsp;{calculatedWeight}%</sup>}
      </SortContainer>
      {enableWeights && (
        <WeightSlider
          weight={metric.weight}
          onWeightChange={(newWeight) => setMetricWeight(metric.id, newWeight)}
        />
      )}
    </th>
  );
};

const OverallModelLeaderBoard = ({
  models,
  task,
  tags,
  enableWeights,
  metrics,
  setMetricWeight,
  datasetWeights,
  setDatasetWeight,
  sort,
  toggleSort,
}) => {
  const total = metrics?.reduce((sum, metric) => sum + metric.weight, 0);

  const totalDatasetsWeight = datasetWeights?.reduce(
    (acc, dataset_weight) => acc + dataset_weight.weight,
    0
  );

  return (
    <Table hover className="mb-0">
      <thead>
        <tr>
          {!enableWeights && (
            <th className="align-baseline">
              <SortContainer
                sortKey={"model"}
                toggleSort={toggleSort}
                currentSort={sort}
              >
                Model
              </SortContainer>
            </th>
          )}
          {enableWeights && <th className="align-bottom">Adjust Weights</th>}

          {metrics.map((metric) => {
            return (
              <MetricWeightTableHeader
                metric={metric}
                setMetricWeight={setMetricWeight}
                enableWeights={enableWeights}
                total={total}
                sort={sort}
                toggleSort={toggleSort}
                key={`th-metric-${metric.id}`}
              />
            );
          })}
          <th className="text-right pr-4 align-baseline">
            <SortContainer
              sortKey={"dynascore"}
              toggleSort={toggleSort}
              currentSort={sort}
            >
              Dynascore
            </SortContainer>
          </th>
        </tr>
      </thead>
      <tbody>
        {models.map((model) => (
          <OverallModelLeaderboardRow
            model={model}
            ordered_datasets={task.ordered_datasets}
            metrics={metrics}
            key={`model-${model.model_id}`}
            enableWeights={enableWeights}
            datasetWeights={datasetWeights}
            setDatasetWeight={setDatasetWeight}
            totalWeight={totalDatasetsWeight}
          />
        ))}
      </tbody>
    </Table>
  );
};

export default OverallModelLeaderBoard;
