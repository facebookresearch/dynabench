import React, { useLayoutEffect, useState } from "react";
import ContainerWidthContext from "./ContainerWidthContext";

import "./LanguageScoresMatrix.css";

// interface Props {
//   scores: Array<Array<ScoreEntry>>;
//   startIndex: [number, number];
//   setStartIndex: ([x, y]: [number, number]) => void;
// }
function scoreClass(score, min, max) {
  if (score > 0) {
    return "negative_" + Math.round((score / Math.max(5.0, max)) * 10) + "0";
  }
  return "negative_" + Math.round((score / Math.min(-5.0, min)) * 10) + "0";
}

const LanguageScoresMatrix = ({ scores, startIndex, setStartIndex }) => {
  const scoresLength = scores.length;

  const [minScore, maxScore] = scores
    .flat()
    .reduce(
      ([min, max], curr) => [
        Math.min(min, curr.score),
        Math.max(max, curr.score),
      ],
      [0, 0]
    );

  const LABEL_WIDTH = 30;

  function showTooltip(evt) {
    evt.preventDefault();

    var svg = document.getElementById("matrix_tooltip_svg");
    var tooltip = svg?.querySelector("#tooltip");
    var tooltipText = tooltip?.getElementsByTagName("text")[0];
    var tooltipRects = tooltip?.getElementsByTagName("rect");
    // var triggers = svg?.getElementsByClassName("tooltip-trigger");

    var CTM = svg?.getScreenCTM();
    if (CTM !== null && CTM !== undefined) {
      var x = (evt.clientX - CTM.e + 10) / CTM.a;
      var y = (evt.clientY - CTM.f + 10) / CTM.d;
      console.log(x, y);
      tooltip.setAttributeNS(
        null,
        "transform",
        "translate(" + x + " " + y + ")"
      );
      tooltip.setAttributeNS(null, "visibility", "visible");
    }
    tooltipText.firstChild.replaceWith(
      evt.target.getAttributeNS(null, "data-tooltip-text")
    );
    var length = tooltipText?.getComputedTextLength() ?? 0;
    if (null !== tooltipRects && undefined !== tooltipRects) {
      for (var i = 0; i < tooltipRects.length; i++) {
        tooltipRects[i].setAttributeNS(null, "width", `${length + 8}`);
      }
    }
  }
  function hideTooltip(evt) {
    evt.preventDefault();
    var svg = document.getElementById("matrix_tooltip_svg");
    var tooltip = svg?.querySelector("#tooltip");
    tooltip.setAttributeNS(null, "visibility", "hidden");
  }

  return (
    <ContainerWidthContext.Consumer>
      {({ width, height }) => {
        if (width === 0) {
          return null;
        }
        // return (
        //   <div>{scores.map((row) => row.map((entry) => entry.score))}</div>
        // );
        console.log(
          "svg width: ",
          (scoresLength + 1) * 10,
          "screen width",
          width,
          "height: ",
          height
        );

        const availableWidth = width;
        const availableHeight = Math.max(400, height);

        const maxVisibleXAxesCount =
          Math.floor((availableWidth - LABEL_WIDTH) / 10) - 1;
        const maxVisibleXAxesStartIndex = Math.max(
          0,
          scoresLength - maxVisibleXAxesCount
        ); // 0 if protein length < maxVisibleProteinCount
        const adjustedXAxesStart = Math.min(
          startIndex[0],
          maxVisibleXAxesStartIndex
        );

        const maxVisibleYAxesCount =
          Math.floor((availableHeight - LABEL_WIDTH) / 10) - 1;

        const maxVisibleYAxesStartIndex = Math.max(
          0,
          scoresLength - maxVisibleYAxesCount
        ); // 0 if protein length < maxVisibleProteinCount

        const adjustedYAxesStart = Math.min(
          startIndex[1],
          maxVisibleYAxesStartIndex
        );

        const visibleScores = scores
          .map((row) =>
            row.slice(
              adjustedXAxesStart,
              adjustedXAxesStart + maxVisibleXAxesCount
            )
          )
          .slice(adjustedYAxesStart, adjustedYAxesStart + maxVisibleYAxesCount);
        return (
          <div>
            {/* <div>{scores[0].map((entry) => entry.target + ", ")}</div> */}
            <svg
              id="score_matrix"
              width="100%"
              height={availableHeight}
              viewBox={"0 0 " + availableWidth + " " + availableHeight}
              // preserveAspectRatio="xMinYMin"
              // colorRendering="optimizeSpeed"
              // shapeRendering="optimizeSpeed"
              style={{ overflow: "visible", zIndex: 500 }}
            >
              {/* Header */}

              {visibleScores[0].map((score, i) => {
                return i < scoresLength ? (
                  <text
                    x={i * 10 + 4}
                    y={LABEL_WIDTH}
                    key={"score" + i}
                    fontSize="8pt"
                    textAnchor="start"
                    transform={`translate(${i * 10 + 7} , ${
                      LABEL_WIDTH + i * 10
                    }) rotate(-90)`}
                  >
                    {score.target}
                  </text>
                ) : null;
              })}

              {/* Rows */}
              {visibleScores?.map((row, i) => {
                return (
                  <React.Fragment key={"row-" + i}>
                    {/* Left Label */}
                    <text
                      x={LABEL_WIDTH - 2}
                      y={i * 10 - 2 + LABEL_WIDTH + 10}
                      width="50"
                      key={"source" + i}
                      fontSize="8pt"
                      textAnchor="end"
                      lengthAdjust="spacingAndGlyphs"
                    >
                      {row[0].source}
                    </text>
                    {row.map((scoreEntry, j) => {
                      const tooltip = `${scoreEntry.source} -> ${scoreEntry.target} = ${scoreEntry.score}`;
                      return (
                        <React.Fragment key={`cell-${i}-${j}`}>
                          <rect
                            key={"" + i + ":" + j}
                            width="10"
                            height="10"
                            x={j * 10 + LABEL_WIDTH}
                            y={i * 10 + LABEL_WIDTH}
                            strokeWidth={0}
                            shapeRendering="geometricPrecision"
                            data-tooltip-text={tooltip}
                            className={scoreClass(
                              scoreEntry.score,
                              minScore,
                              maxScore
                            )}
                            onClick={(e) => {}}
                            onMouseOver={(e) => {
                              showTooltip(e);
                            }}
                            onMouseMove={(e) => {
                              showTooltip(e);
                            }}
                            onMouseOut={(e) => {
                              hideTooltip(e);
                            }}
                          />
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </svg>
            {/* Tooltip */}
            <svg
              id="matrix_tooltip_svg"
              width={width}
              height={height}
              visibility="hidden"
            >
              <g id="tooltip" visibility="hidden" style={{ zIndex: 10000 }}>
                <rect
                  id="svgTooltipBackground"
                  width="80"
                  height="24"
                  x="2"
                  y="2"
                  strokeWidth={1}
                  stroke="grey"
                  fill="white"
                  shapeRendering="geometricPrecision"
                />
                <text
                  id="svgTooltipText"
                  x="6"
                  y="18"
                  fontSize="10pt"
                  fill="black"
                >
                  {" "}
                </text>
              </g>
            </svg>
          </div>
        );
      }}
    </ContainerWidthContext.Consumer>
  );
};

export default LanguageScoresMatrix;
