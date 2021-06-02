import React, { useMemo, useState } from "react";

import "./ScoresMiniMatrix.css";

// interface Props {
//   languageScores: Array<Array<ScoreEntry>>;

//   setStartIndex: ([x, y]: [number, number]) => void;
//   threshold: number;
// }

// interface HoverInfo {
//   position: { x: number; y: number };
//   score: number;
// }

const ScoresMiniMatrix = ({ languageScores, setStartIndex, threshold }) => {
  // console.log(languageScores);

  const [hoverInfo, setHoverInfo] = useState(null);

  const map = useMemo(() => {
    const size = 200 / Math.min(languageScores.length, 200);

    // using guidance on creating svg tooltips from : https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/

    // var triggers = svg?.getElementsByClassName("tooltip-trigger");

    function showTooltip(evt) {
      //React.MouseEvent<SVGRectElement, MouseEvent>
      evt.preventDefault();

      var svg = document.getElementById("tooltip_svg");
      var tooltip = svg?.querySelector("#tooltip");
      var tooltipText = tooltip?.getElementsByTagName("text")[0];
      var tooltipRects = tooltip?.getElementsByTagName("rect");

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
      var svg = document.getElementById("tooltip_svg");
      var tooltip = svg?.querySelector("#tooltip");

      tooltip.setAttributeNS(null, "visibility", "hidden");
    }

    return languageScores.map((xScores, x) => {
      return xScores.map((entry, y) => {
        if (entry.score < threshold) {
          return null;
        }

        return (
          <rect
            key={`score${x}:${y}`}
            width={1}
            height={1}
            x={x * 1}
            y={y * 1}
            className={"contact_fill"}
            data-tooltip-text={`${entry.source} -> ${entry.target} = ${entry.score}`}
            onMouseMove={(e) => {
              showTooltip(e);
            }}
            onMouseOut={(e) => {
              hideTooltip(e);
            }}
          />
        );
      });
    });
  }, [languageScores, threshold]);

  return (
    <div id="scores_mini_matrix">
      {/* Axis Labels */}
      <svg id="axis" width={200} height={200}>
        {/* Border */}
        <rect
          id="svg-bg"
          width="200"
          height="200"
          x="0"
          y="0"
          strokeWidth={1}
          stroke="grey"
          fill="transparent"
          shapeRendering="geometricPrecision"
        />
      </svg>
      <svg
        id="map"
        width={200}
        height={200}
        viewBox={`0 0 ${languageScores.length} ${languageScores.length}`}
        preserveAspectRatio="none"
        colorRendering="optimizeSpeed"
        shapeRendering="optimizeSpeed"
        onClick={(e) => {
          const x = Math.round(e.nativeEvent.offsetX);
          const y = Math.round(e.nativeEvent.offsetY);
          setStartIndex([x, y]);
        }}
      >
        {map}
      </svg>

      {/* Tooltip */}
      <svg
        id="tooltip_svg"
        key="tooltip_svg"
        width={200}
        height={200}
        visibility="hidden"
      >
        <g id="tooltip" visibility="hidden">
          <rect
            id="svgTooltipBackground"
            width="80"
            height="24"
            x="2"
            y="2"
            strokeWidth={1}
            stroke="grey"
            fill="white"
            opacity="0.9"
            shapeRendering="geometricPrecision"
          />
          <text id="svgTooltipText" x="6" y="18" fontSize="10pt" fill="black">
            {" "}
          </text>
        </g>
      </svg>
      {/* End Tooltip */}
    </div>
  );
};

export default ScoresMiniMatrix;
