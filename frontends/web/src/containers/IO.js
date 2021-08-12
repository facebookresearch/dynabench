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
  display_name,
  className,
  create,
  example_io,
  set_example_io,
  name,
  constructor_args,
}) => {
  const [choice, setChoice] = useState(constructor_args.placeholder);
  const labels = constructor_args.labels;
  // This ensures that the UI resets when the value goes back to null
  if (example_io[name] === null && choice !== constructor_args.placeholder) {
    setChoice(constructor_args.placeholder);
  }
  return (
    <div className="mb-1 mt-1">
      {!create ? (
        <>
          <h6 className={"spaced-header " + className}>
            {display_name ? display_name : name}:
          </h6>
          {example_io[name]}
        </>
      ) : (
        <>
          <DropdownButton variant="light" className="p-1" title={choice}>
            {labels
              .filter((label, _) => label !== choice)
              .map((label, index) => (
                <Dropdown.Item
                  key={index}
                  onClick={() => {
                    setChoice(label);
                    example_io[name] = label;
                    set_example_io(example_io);
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
  display_name,
  className,
  create,
  example_io,
  set_example_io,
  name,
  constructor_args,
}) => {
  const labels = constructor_args.labels;
  const random = labels[Math.floor(Math.random() * labels.length)];
  const [choice, setChoice] = useState(random);
  // This ensures that the UI resets when the value goes back to null
  if (example_io[name] === null) {
    example_io[name] = random;
    set_example_io(example_io);
    if (choice !== random) {
      setChoice(random);
    }
  }

  const vowels = ["a", "e", "i", "o", "u"];
  const indefiniteArticle = vowels.indexOf(choice[0]) >= 0 ? "an" : "a";
  const otherLabels = labels.filter((label, _) => label !== choice);
  const otherLabelsStr =
    otherLabels.slice(0, otherLabels.length - 2).join(", ") +
    otherLabels.slice(otherLabels.length - 2, otherLabels.length).join(" or ");
  return (
    <div className="mb-1 mt-1">
      {!create ? (
        <>
          <h6 className={"spaced-header " + className}>
            {display_name ? display_name : name}:
          </h6>
          {example_io[name]}
        </>
      ) : (
        <>
          <InputGroup className="align-items-center">
            <i className="fas fa-flag-checkered mr-1"></i>
            Your goal: enter {indefiniteArticle}
            <DropdownButton variant="light" className="p-1" title={choice}>
              {labels
                .filter((label, _) => label !== choice)
                .map((label, index) => (
                  <Dropdown.Item
                    key={index}
                    onClick={() => {
                      setChoice(label);
                      example_io[name] = label;
                      set_example_io(example_io);
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
  display_name,
  className,
  create,
  example_io,
  set_example_io,
  name,
  constructor_args,
}) => {
  return (
    <div className="mb-1 mt-1">
      {!create ? (
        <>
          <h6 className={"spaced-header " + className}>
            {display_name ? display_name : name}:
          </h6>
          {example_io[name]}
        </>
      ) : (
        <>
          <FormControl
            className={"rounded-1 thick-border p-3 " + className}
            placeholder={constructor_args.placeholder}
            value={example_io[name] ? example_io[name] : ""}
            onChange={(event) => {
              example_io[name] = event.target.value;
              set_example_io(example_io);
            }}
            required={true}
          />
        </>
      )}
    </div>
  );
};

const ContextStringSelectionIO = ({
  display_name,
  className,
  create,
  example_io,
  set_example_io,
  name,
  constructor_args,
}) => {
  const [selection_info, setSelectionInfo] = useState("");
  // This ensures that the UI resets when the value goes back to null
  if (example_io[name] === null && selection_info !== "") {
    setSelectionInfo("");
  }
  return (
    <div className="mb-1 mt-1">
      {!create ? (
        <>
          <h6 className={"spaced-header " + className}>
            {display_name ? display_name : name}:
          </h6>
          {example_io[name]}
        </>
      ) : (
        <>
          <Badge variant="primary">
            {" "}
            Select {display_name ? display_name : name} in{" "}
            {constructor_args.reference_key}
          </Badge>
          <br />
          <TokenAnnotator
            className="mb-1 p-3 light-gray-bg qa-context"
            tokens={example_io[constructor_args.reference_key].split(/\b/)}
            value={selection_info}
            onChange={(value) => {
              if (value.length > 0) {
                setSelectionInfo([value[value.length - 1]]);
                example_io[name] = value[value.length - 1].tokens.join("");
                set_example_io(example_io);
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
  example_io,
  set_example_io,
  name,
  constructor_args,
}) => {
  if (example_io[name]) {
    const labels = Object.keys(example_io[name]);
    const probs = labels.map((key, _) => example_io[name][key]);
    return <PieRechart data={probs} labels={labels} />;
  }
  return null;
};

const ConfIO = ({
  create,
  example_io,
  set_example_io,
  name,
  constructor_args,
}) => {
  if (example_io[name]) {
    const labels = ["confidence", "uncertianty"];
    const probs = [example_io[name], 1 - example_io[name]];
    return <PieRechart data={probs} labels={labels} />;
  }
  return null;
};

const ImageUrlIO = ({
  display_name,
  className,
  create,
  example_io,
  set_example_io,
  name,
  constructor_args,
}) => {
  return (
    <div className="mb-1 mt-1">
      <h6 className={"spaced-header " + className}>
        {display_name ? display_name : name}:
      </h6>
      <AtomicImage src={example_io[name]} />
    </div>
  );
};

const IO = ({
  display_name,
  className,
  create,
  example_io,
  set_example_io,
  name,
  type,
  constructor_args,
}) => {
  switch (type) {
    case "image_url":
      return (
        <ImageUrlIO
          display_name={display_name}
          className={className}
          create={create}
          name={name}
          example_io={example_io}
          set_example_io={set_example_io}
          constructor_args={constructor_args}
        />
      );
    case "string":
      return (
        <StringIO
          display_name={display_name}
          className={className}
          create={create}
          name={name}
          example_io={example_io}
          set_example_io={set_example_io}
          constructor_args={constructor_args}
        />
      );
    case "multiple_choice":
      return (
        <MultipleChoiceIO
          display_name={display_name}
          className={className}
          create={create}
          name={name}
          example_io={example_io}
          set_example_io={set_example_io}
          constructor_args={constructor_args}
        />
      );
    case "goal_message_multiple_choice":
      return (
        <GoalMessageMultipleChoiceIO
          display_name={display_name}
          className={className}
          create={create}
          name={name}
          example_io={example_io}
          set_example_io={set_example_io}
          constructor_args={constructor_args}
        />
      );
    case "context_string_selection":
      return (
        <ContextStringSelectionIO
          display_name={display_name}
          className={className}
          create={create}
          name={name}
          example_io={example_io}
          set_example_io={set_example_io}
          constructor_args={constructor_args}
        />
      );
    case "multiple_choice_probs":
      return (
        <MultipleChoiceProbsIO
          create={create}
          name={name}
          example_io={example_io}
          set_example_io={set_example_io}
          constructor_args={constructor_args}
        />
      );
    case "conf":
      return (
        <ConfIO
          create={create}
          name={name}
          example_io={example_io}
          set_example_io={set_example_io}
          constructor_args={constructor_args}
        />
      );
    default:
      return null;
  }
};

export default IO;
