import { Button, Form } from "react-bootstrap";
import React from "react";
import { useState } from "react";
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
  metrics,
  enableWeights,
  datasetWeights,
  setDatasetWeight,
  totalWeight,
}) => {
  const [expanded, setExpanded] = useState(false);

  const dynascore = parseFloat(model.dynascore).toFixed(0);

  const totalRows = expanded ? model.datasets.length + 1 : 1;

  return (
    <>
      <tr key={model.model_id} onClick={() => setExpanded(!expanded)}>
        <td>
          <Link to={`/models/${model.model_id}`} className="btn-link">
            {model.model_name}
          </Link>{" "}
          <Link to={`/users/${model.owner_id}#profile`} className="btn-link">
            ({model.owner})
          </Link>
          <div style={{ float: "right" }}>
            <ChevronExpandButton expanded={expanded} />
          </div>
        </td>

        {/* {tags.map((tag) => {
          let tag_result = "-";
          if (model.metadata_json && model.metadata_json.perf_by_tag) {
            let selected_tag = model.metadata_json.perf_by_tag.filter(
              (t) => t.tag === tag
            );
            if (selected_tag.length > 0)
              tag_result = parseFloat(selected_tag[0].perf).toFixed(2) + "%";
          }
          return (
            <td className="text-right  pr-4" key={`${tag}-${model.model_id}`}>
              {tag_result}
            </td>
          );
        })} */}
        {model &&
          model.display_scores.map((score, i) => {
            return (
              <td
                className="text-right pr-4"
                key={`score-${model.model_name}-${metrics[i].id}-overall`}
              >
                {expanded ? <b>{score}</b> : score}
              </td>
            );
          })}

        <td className="text-right  align-middle pr-4 " rowSpan={totalRows}>
          {expanded ? <h1>{dynascore}</h1> : dynascore}
        </td>
      </tr>
      {expanded &&
        model.datasets &&
        model.datasets.map((dataset) => {
          const weight = datasetWeights[dataset.id];
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
                      {score}
                    </td>
                  );
                })}
            </tr>
          );
        })}
    </>
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
      <div onClick={() => toggleSort(metric.id)}>
        {sort.field === metric.id && sort.direction === "asc" && (
          <i className="fas fa-sort-up">&nbsp;</i>
        )}
        {sort.field === metric.id && sort.direction === "desc" && (
          <i className="fas fa-sort-down">&nbsp;</i>
        )}

        {metric.label}
        {!enableWeights && <sup>&nbsp;{calculatedWeight}%</sup>}
      </div>
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
  tags,
  enableWeights,
  metrics,
  setMetricWeight,
  datasetWeights,
  setDatasetWeight,
  taskShortName,
  sort,
  toggleSort,
}) => {
  const total = metrics?.reduce((sum, metric) => sum + metric.weight, 0);

  const totalDatasetsWeight = Object.values(datasetWeights).reduce(
    (acc, val) => acc + val,
    0
  );

  return (
    <Table hover className="mb-0">
      <thead>
        <tr>
          {!enableWeights && <th className="align-baseline">Model</th>}
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
          <th className="text-right pr-4 align-baseline">Dynascore</th>
        </tr>
      </thead>
      <tbody>
        {models.map((model) => (
          <OverallModelLeaderboardRow
            model={model}
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
