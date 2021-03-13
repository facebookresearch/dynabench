import React from "react";
import "./WeightIndicator.css";

export default function WeightIndicator({ weight }) {
  return (
    <svg width={10} height={12}>
      {[...Array(weight)].map((x, i) => (
        <rect
          key={"" + i}
          width="10"
          height="1"
          x={0}
          y={10 - i * 2}
          className="weight-indicator"
        />
      ))}
    </svg>
  );
}
