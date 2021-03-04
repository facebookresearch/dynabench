import { Button } from "react-bootstrap";
import React from "react";
import { useState } from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";

const ChevronExpandButton = ({ expanded, onExpanded }) => {
  return (
    <a
      type="button"
      class="position-absolute start-100"
      onClick={() => onExpanded(!expanded)}
    >
      {expanded ? (
        <i class="fas fa-chevron-down"></i>
      ) : (
        <i class="fas fa-chevron-right"></i>
      )}
    </a>
  );
};

const OverallModelLeaderboardRow = ({ data, tags }) => {
  const [expanded, setExpanded] = useState(false);

  const dynascore = parseFloat(data.dynascore).toFixed(0);

  const totalRows = expanded ? data.datasets.length + 1 : 1;

  return (
    <>
      <tr key={data.model_id}>
        <td>
          <Link to={`/models/${data.model_id}`} className="btn-link">
            {data.model_name}
          </Link>{" "}
          <Link to={`/users/${data.owner_id}#profile`} className="btn-link">
            ({data.owner})
          </Link>
          <div style={{ float: "right" }}>
            <ChevronExpandButton expanded={expanded} onExpanded={setExpanded} />
          </div>
        </td>
        <td className="text-right  pr-4">
          {parseFloat(data.accuracy).toFixed(2)}%
        </td>
        {tags.map((tag) => {
          let tag_result = "-";
          if (data.metadata_json && data.metadata_json.perf_by_tag) {
            let selected_tag = data.metadata_json.perf_by_tag.filter(
              (t) => t.tag === tag
            );
            if (selected_tag.length > 0)
              tag_result = parseFloat(selected_tag[0].perf).toFixed(2) + "%";
          }
          return (
            <td className="text-right  pr-4" key={`${tag}-${data.model_id}`}>
              {tag_result}
            </td>
          );
        })}
        {data &&
          data.display_scores.map((score) => {
            return (
              <td
                className="text-right pr-4"
                key={`score-${data.model_name}-overall`}
              >
                {expanded ? <b>{score}</b> : score}
              </td>
            );
          })}

        <td className="text-right  pr-4" rowSpan={totalRows}>
          {expanded ? <h1>{dynascore}</h1> : dynascore}
          <b>{}</b>
        </td>
      </tr>
      {expanded &&
        data.datasets &&
        data.datasets.map((dataset) => {
          return (
            <tr key={`score-${dataset.name}`}>
              {/* Title */}
              <td className="text-right pr-4">{dataset.name}</td>
              <td />
              {dataset.display_scores &&
                dataset.display_scores.map((score) => {
                  return (
                    <td
                      className="text-right pr-4"
                      key={`score-${data.model_name}-overall`}
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

const OverallModelLeaderBoard = (props) => {
  return (
    <Table hover className="mb-0">
      <thead>
        <tr>
          <th>Model</th>
          {props.tags.map((tag) => {
            return (
              <th className="text-right" key={`th-${tag}`}>
                {tag}
              </th>
            );
          })}
          {props.taskShortName === "QA" ? (
            <th className="text-right pr-4">Overall F1</th>
          ) : (
            <th className="text-right pr-4">Mean Accuracy</th>
          )}
          {props &&
            props.data &&
            props.data.length > 0 &&
            props?.data[0].metric_labels.map((tag) => {
              return (
                <th className="text-right pr-4" key={`th-${tag}`}>
                  {tag}
                </th>
              );
            })}
          <th className="text-right pr-4">Dynascore</th>
        </tr>
      </thead>
      <tbody>
        {props.data.map((data) => (
          <OverallModelLeaderboardRow data={data} tags={props.tags} />
        ))}
      </tbody>
    </Table>
  );
};

export default OverallModelLeaderBoard;
