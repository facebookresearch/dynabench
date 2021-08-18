import React from "react";

const ChevronExpandButton = ({
  expanded,
  containerClassName,
  containerStyles,
}) => {
  return (
    <span
      type="button"
      className={containerClassName || ""}
      style={containerStyles || {}}
    >
      {expanded ? (
        <i className="fas fa-chevron-down" />
      ) : (
        <i className="fas fa-chevron-right" />
      )}
    </span>
  );
};
export default ChevronExpandButton;
