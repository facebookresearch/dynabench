import React from "react";
import {
  FormControl,
  DropdownButton,
  Dropdown,
  Badge,
  InputGroup,
} from "react-bootstrap";
import { PieRechart } from "../components/Rechart";
import { useState } from "react";
import { TokenAnnotator } from "react-text-annotate";
import AtomicImage from "./AtomicImage";
import "./IO.css";

const MultipleChoiceIO = ({
  displayName,
  className,
  create,
  exampleIO,
  setExampleIO,
  name,
  constructorArgs,
}) => {
  const [choice, setChoice] = useState(constructorArgs.placeholder);
  const labels = constructorArgs.labels;
  // This ensures that the UI resets when the value goes back to null
  if (exampleIO[name] === null && choice !== constructorArgs.placeholder) {
    setChoice(constructorArgs.placeholder);
  }
  return (
    <div className="mb-1 mt-1">
      {!create ? (
        <>
          <h6 className={"spaced-header " + className}>
            {displayName ? displayName : name}:
          </h6>
          {exampleIO[name]}
        </>
      ) : (
        <>
          <DropdownButton variant="light" className="p-1" title={choice}>
            {labels
              .filter((label) => label !== choice)
              .map((label, index) => (
                <Dropdown.Item
                  key={index}
                  onClick={() => {
                    setChoice(label);
                    exampleIO[name] = label;
                    setExampleIO(exampleIO);
                  }}
                  name={index}
                  index={index}
                >
                  {label}
                </Dropdown.Item>
              ))}
          </DropdownButton>
        </>
      )}
    </div>
  );
};

const GoalMessageMultipleChoiceIO = ({
  displayName,
  className,
  create,
  exampleIO,
  setExampleIO,
  name,
  constructorArgs,
}) => {
  const labels = constructorArgs.labels;
  const [choice, setChoice] = useState(exampleIO[name]);

  // This ensures that the UI resets when the value externally changes
  if (choice !== exampleIO[name]) {
    setChoice(exampleIO[name]);
  }

  const vowels = ["a", "e", "i", "o", "u"];
  const indefiniteArticle = vowels.indexOf(choice[0]) >= 0 ? "an" : "a";
  const otherLabels = labels.filter((label) => label !== choice);
  const otherLabelsStr =
    otherLabels.slice(0, otherLabels.length - 2).join(", ") +
    otherLabels.slice(otherLabels.length - 2, otherLabels.length).join(" or ");
  return (
    <div className="mb-1 mt-1">
      {!create ? (
        <>
          <h6 className={"spaced-header " + className}>
            {displayName ? displayName : name}:
          </h6>
          {exampleIO[name]}
        </>
      ) : (
        <>
          <InputGroup className="align-items-center">
            <i className="fas fa-flag-checkered mr-1"></i>
            Your goal: enter {indefiniteArticle}
            <DropdownButton variant="light" className="p-1" title={choice}>
              {labels
                .filter((label) => label !== choice)
                .map((label, index) => (
                  <Dropdown.Item
                    key={index}
                    onClick={() => {
                      setChoice(label);
                      exampleIO[name] = label;
                      setExampleIO(exampleIO);
                    }}
                    name={index}
                    index={index}
                  >
                    {label}
                  </Dropdown.Item>
                ))}
            </DropdownButton>
            example that fools the model into predicting {otherLabelsStr}.
          </InputGroup>
        </>
      )}
    </div>
  );
};

const StringIO = ({
  displayName,
  className,
  create,
  exampleIO,
  setExampleIO,
  name,
  constructorArgs,
}) => {
  return (
    <div className="mb-1 mt-1">
      {!create ? (
        <>
          <h6 className={"spaced-header " + className}>
            {displayName ? displayName : name}:
          </h6>
          {exampleIO[name]}
        </>
      ) : (
        <>
          <FormControl
            className={"rounded-1 thick-border p-3 " + className}
            placeholder={constructorArgs.placeholder}
            value={exampleIO[name] ? exampleIO[name] : ""}
            onChange={(event) => {
              exampleIO[name] = event.target.value;
              setExampleIO(exampleIO);
            }}
            required={true}
          />
        </>
      )}
    </div>
  );
};

const ContextStringSelectionIO = ({
  displayName,
  className,
  create,
  exampleIO,
  setExampleIO,
  name,
  constructorArgs,
}) => {
  const [selectionInfo, setSelectionInfo] = useState("");
  // This ensures that the UI resets when the value goes back to null
  if (exampleIO[name] === null && selectionInfo !== "") {
    setSelectionInfo("");
  }
  return (
    <div className="mb-1 mt-1">
      {!create ? (
        <>
          <h6 className={"spaced-header " + className}>
            {displayName ? displayName : name}:
          </h6>
          {exampleIO[name]}
        </>
      ) : (
        <>
          <Badge variant="primary">
            {" "}
            Select {displayName ? displayName : name} in{" "}
            {constructorArgs.reference_name}
          </Badge>
          <br />
          <TokenAnnotator
            className="mb-1 p-3 light-gray-bg qa-context"
            tokens={exampleIO[constructorArgs.reference_name].split(/\b/)}
            value={selectionInfo}
            onChange={(value) => {
              if (value.length > 0) {
                setSelectionInfo([value[value.length - 1]]);
                exampleIO[name] = value[value.length - 1].tokens.join("");
                setExampleIO(exampleIO);
              }
            }}
            getSpan={(span) => ({
              ...span,
              tag: name,
            })}
          />
        </>
      )}
    </div>
  );
};

const MultipleChoiceProbsIO = ({
  create,
  exampleIO,
  setExampleIO,
  name,
  constructorArgs,
}) => {
  if (exampleIO[name]) {
    const labels = Object.keys(exampleIO[name]);
    const probs = labels.map((key) => exampleIO[name][key]);
    return <PieRechart data={probs} labels={labels} />;
  }
  return null;
};

const ConfIO = ({ create, exampleIO, setExampleIO, name, constructorArgs }) => {
  if (exampleIO[name]) {
    const labels = ["confidence", "uncertianty"];
    const probs = [exampleIO[name], 1 - exampleIO[name]];
    return <PieRechart data={probs} labels={labels} />;
  }
  return null;
};

const ImageUrlIO = ({
  displayName,
  className,
  create,
  exampleIO,
  setExampleIO,
  name,
  constructorArgs,
}) => {
  return (
    <div className="mb-1 mt-1">
      <h6 className={"spaced-header " + className}>
        {displayName ? displayName : name}:
      </h6>
      <AtomicImage src={exampleIO[name]} />
    </div>
  );
};

const IO = ({
  displayName,
  className,
  create,
  exampleIO,
  setExampleIO,
  name,
  type,
  constructorArgs,
}) => {
  switch (type) {
    case "image_url":
      return (
        <ImageUrlIO
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          exampleIO={exampleIO}
          setExampleIO={setExampleIO}
          constructorArgs={constructorArgs}
        />
      );
    case "string":
      return (
        <StringIO
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          exampleIO={exampleIO}
          setExampleIO={setExampleIO}
          constructorArgs={constructorArgs}
        />
      );
    case "multiple_choice":
      return (
        <MultipleChoiceIO
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          exampleIO={exampleIO}
          setExampleIO={setExampleIO}
          constructorArgs={constructorArgs}
        />
      );
    case "goal_message_multiple_choice":
      return (
        <GoalMessageMultipleChoiceIO
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          exampleIO={exampleIO}
          setExampleIO={setExampleIO}
          constructorArgs={constructorArgs}
        />
      );
    case "context_string_selection":
      return (
        <ContextStringSelectionIO
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          exampleIO={exampleIO}
          setExampleIO={setExampleIO}
          constructorArgs={constructorArgs}
        />
      );
    case "multiple_choice_probs":
      return (
        <MultipleChoiceProbsIO
          create={create}
          name={name}
          exampleIO={exampleIO}
          setExampleIO={setExampleIO}
          constructorArgs={constructorArgs}
        />
      );
    case "conf":
      return (
        <ConfIO
          create={create}
          name={name}
          exampleIO={exampleIO}
          setExampleIO={setExampleIO}
          constructorArgs={constructorArgs}
        />
      );
    default:
      return null;
  }
};

export default IO;
