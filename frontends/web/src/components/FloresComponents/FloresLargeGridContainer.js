import React, { useState, useRef } from "react";
import { Col, Container, Row, Form } from "react-bootstrap";
import { useResizeDetector } from "react-resize-detector";
import LanguageScoresMatrix from "./LanguageScoresMatrix";
import ScoresMiniContainer from "./ScoresMiniContainer";
import ContainerWidthContext from "./ContainerWidthContext";

// interface ContainerProps {
//   children: React.ReactElement;
// }

const ContainerWithSize = (props) => {
  // const size = useSize(target);
  const targetRef = useRef();
  const { width, height } = useResizeDetector({targetRef});

  return (
    <div ref={targetRef}>
      <ContainerWidthContext.Provider
        value={{ width: width ?? 0, height: height ?? 0 }}
      >
        {props.children}
      </ContainerWidthContext.Provider>
    </div>
  );
};

const FloresLargeGridContainer = ({ data }) => {
  const [start, setStart] = useState([0, 0]);

  return (
    <Container>
      <Row>
        <Col>
          <Form className="d-flex ml-2 mt-3">
            <Form.Control
              type="range"
              className="flex-grow-1"
              size="sm"
              min={0}
              max={100}
              value={start[0]}
              onChange={() => {}}
              onInput={(event) => {
                setStart([event.target.valueAsNumber, start[1]]);
              }}
            />
          </Form>
          <Form className="d-flex ml-2 mt-3">
            <Form.Control
              type="range"
              className="flex-grow-1"
              size="sm"
              min={0}
              max={100}
              value={start[1]}
              onChange={() => {}}
              onInput={(event) => {
                setStart([start[0], event.target.valueAsNumber]);
              }}
            />
          </Form>
        </Col>
      </Row>
      <Row>
        <Col id="col_protein_matrix">
          <ContainerWithSize>
            <LanguageScoresMatrix
              scores={data}
              startIndex={start}
              setStartIndex={setStart}
            />
          </ContainerWithSize>
        </Col>
        <Col
          id="col_contact_map"
          xs="auto"
          className="d-flex align-items-start"
          style={{ marginTop: 30 }}
        >
          <ScoresMiniContainer languageScores={data} setStartIndex={setStart} />
        </Col>
      </Row>
    </Container>
  );
};

export default FloresLargeGridContainer;
