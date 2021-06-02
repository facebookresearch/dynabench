import React, { useState } from "react";
import { Form } from "react-bootstrap";
import ScoresMiniMatrix from "./ScoresMiniMatrix";

// interface Props {
//   languageScores: Array<Array<ScoreEntry>>;

//   setStartIndex: ([x, y]: [number, number]) => void;
// }

const ScoresMiniContainer = (props) => {
  const [threshold, setThreshold] = useState(50);
  return (
    <div style={{ marginTop: 30 }}>
      {/* {threshold} */}

      <ScoresMiniMatrix {...props} threshold={threshold} />
      <Form className="d-flex ml-2 mt-3">
        <Form.Control
          type="range"
          className="flex-grow-1"
          size="sm"
          min={0}
          max={100}
          value={threshold}
          onInput={(event) => {
            setThreshold(event.target.valueAsNumber);
          }}
        />
      </Form>
    </div>
  );
};

export default ScoresMiniContainer;
