import React from "react";
import {
  Tooltip,
} from "react-bootstrap";

const METooltip = (props) => {
  return (
    <Tooltip id="button-tooltip" {...props}>
      {"The model error count is the number of model fooling examples. The model error rate is the count divided by the total number of examples. The definitions of the verified model error rate and count are analagous, except the number of verified model fooling examples is used instead of the number of model fooling examples."}
    </Tooltip>
  );
}

const RejectionTooltip = (props) => {
  return (
    <Tooltip id="button-tooltip" {...props}>
      {"The rejection count is the number of verified incorrect examples. The rejection rate is the count divided by the total number of examples."}
    </Tooltip>
  );
}

const RetractionTooltip = (props) => {
  return (
    <Tooltip id="button-tooltip" {...props}>
      {"The retraction count is the numer of retracted examples. The retraction rate is the count divided by the total number of examples."}
    </Tooltip>
  );
}


export {
  METooltip,
  RejectionTooltip,
  RetractionTooltip
}
