import React from "react";

const FloresTaskDescription = ({ taskName, taskDesc }) => {
  return (
    <>
      <h5>{taskName}</h5>
      <p>
        <span className="font-weight-bold">Description: </span> {taskDesc}
      </p>
    </>
  );
};

export default FloresTaskDescription;
