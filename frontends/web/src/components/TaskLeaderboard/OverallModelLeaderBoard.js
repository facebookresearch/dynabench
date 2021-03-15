import { Form, OverlayTrigger, Popover } from "react-bootstrap";
import React from "react";
import { useState, useRef } from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import WeightIndicator from "./WeightIndicator";

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
    <Form className="d-flex ml-2 float-right" style={{ width: "50%" }}>
      <Form.Control
        type="range"
        className="flex-grow-1"
        size="sm"
        style={{ width: "50%" }}
        min={0}
        max={5}
        value={weight}
        onInput={(event) => {
          onWeightChange(event.target.valueAsNumber);
        }}
      />
    </Form>
  );
};

/**
 * Popver to show vairance for a score component (target)
 *
 * @param {Object} params React params destructured.
 * @param {string} variance the variance value to display in the popover
 * @param {React.ReactNode} children the Score Node that triggers the popover
 */
const VariancePopover = ({ variance, children, placement = "right" }) => {
  const target = useRef(null);
  if (null === variance || undefined === variance) {
    return children;
  }

  return (
    <OverlayTrigger
      placement={placement}
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
};

/**
 * Popver to show Weight
 *
 * @param {Object} params React params destructured.
 * @param {string} weight the weight value to display in the popover
 * @param {React.ReactNode} children the Node that triggers the popover
 */
const WeightPopover = ({ label, weight, children }) => {
  const target = useRef(null);

  // if (null === weight || undefined === weight) {
  //   return children;
  // }

  // const target = useRef();
  return (
    <OverlayTrigger
      placement="right"
      delay={{ show: 250, hide: 400 }}
      overlay={
        <Popover>
          <Popover.Content>
            {label} weight: {weight}
          </Popover.Content>
        </Popover>
      }
      target={target.current}
    >
      {children}
    </OverlayTrigger>
  );
};

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
          model.averaged_scores?.map((score, i) => {
            const variance =
              model.averaged_variances.length > i
                ? model.averaged_variances[i]
                : null;
            return (
              <td
                className="text-right t-2"
                key={`score-${model.model_name}-${metrics[i].id}-overall`}
              >
                <VariancePopover variance={variance}>
                  <span>{expanded ? <b>{score}</b> : score}</span>
                </VariancePopover>
              </td>
            );
          })}

        <td className="text-right  align-middle pr-4 " rowSpan={totalRows}>
          <VariancePopover variance={model.dynavariance} placement="top">
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
                <div className="d-flex justify-content-end align-items-center">
                  <WeightPopover label={dataset.name} weight={weight}>
                    <span className="d-flex align-items-center">
                      {dataset.name}&nbsp;
                      <WeightIndicator weight={weight} />
                    </span>
                  </WeightPopover>
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
              {dataset.scores &&
                dataset.scores.map((score, i) => {
                  return (
                    <td
                      className="text-right "
                      key={`score-${model.model_name}-${dataset.id}-${i}-overall`}
                    >
                      <VariancePopover variance={dataset.variances[i]}>
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

const SortContainer = ({
  sortKey,
  toggleSort,
  currentSort,
  className,
  children,
}) => {
  return (
    <div onClick={() => toggleSort(sortKey)} className={className}>
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
  colWidth,
  setMetricWeight,
  enableWeights,
  total,
  sort,
  toggleSort,
}) => {
  const calculatedWeight =
    total === 0 ? 0 : Math.round((metric.weight / total) * 100);

  return (
    <th
      className="text-right align-baseline "
      key={`th-${metric.id}`}
      style={{ width: `${colWidth}%` }}
    >
      <SortContainer
        sortKey={metric.id}
        toggleSort={toggleSort}
        currentSort={sort}
        className="d-flex justify-content-end align-items-center"
      >
        <WeightPopover label={metric.label} weight={metric.weight}>
          <span>
            {metric.label}&nbsp;
            <WeightIndicator weight={metric.weight} />
          </span>
        </WeightPopover>
      </SortContainer>

      {!enableWeights && (
        <>
          <span class="font-weight-light small">{metric.unit}</span>
        </>
      )}
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

  const metricColumnWidht =
    60 / ((metrics?.length ?? 0) === 0 ? 1 : metrics.length);

  return (
    <Table hover className="mb-0">
      <thead>
        <tr>
          {!enableWeights && (
            <th className="align-baseline" style={{ width: "25%" }}>
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

          {metrics?.map((metric) => {
            return (
              <MetricWeightTableHeader
                metric={metric}
                colWidth={metricColumnWidht}
                setMetricWeight={setMetricWeight}
                enableWeights={enableWeights}
                total={total}
                sort={sort}
                toggleSort={toggleSort}
                key={`th-metric-${metric.id}`}
              />
            );
          })}
          <th
            className="text-right pr-4 align-baseline "
            style={{ width: "15%" }}
          >
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
        {models?.map((model) => (
          <OverallModelLeaderboardRow
            model={model}
            ordered_datasets={task.datasets}
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
