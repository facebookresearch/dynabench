import React from "react";
import { FormControl, DropdownButton, Dropdown, Badge } from "react-bootstrap";
import { PieRechart } from "../components/Rechart";
import { useState } from "react";
import { TokenAnnotator } from "react-text-annotate";

const MultipleChoiceIO = ({
  create,
  example_io,
  set_example_io,
  hide_by_key,
  set_hide_by_key,
  io_key,
  location,
  constructor_args,
}) => {
  const [choice, setChoice] = useState("Select Choice");
  const labels = constructor_args["labels"];
  return (
    <div>
      <Badge variant="primary"> {io_key} </Badge>
      <br />
      {location === "context" || !create ? (
        example_io[io_key]
      ) : (
        <DropdownButton variant="light" className="p-1" title={choice}>
          {labels
            .filter((label, _) => label !== choice)
            .map((label, index) => (
              <Dropdown.Item
                onClick={() => {
                  setChoice(label);
                  example_io[io_key] = label;
                  set_example_io(example_io);
                }}
                io_key={index}
                index={index}
              >
                {label}
              </Dropdown.Item>
            ))}
        </DropdownButton>
      )}
    </div>
  );
};

const StringIO = ({
  create,
  example_io,
  set_example_io,
  hide_by_key,
  set_hide_by_key,
  io_key,
  location,
  constructor_args,
}) => {
  return (
    <div>
      <Badge variant="primary"> {io_key} </Badge>
      <br />
      {location === "context" || !create ? (
        example_io[io_key]
      ) : (
        <FormControl
          className="m-3 p-3 rounded-1 thick-border light-gray-bg"
          placeholder={"Enter..."}
          value={example_io[io_key]}
          onChange={(event) => {
            example_io[io_key] = event.target.value;
            set_example_io(example_io);
          }}
          required={true}
          as="textarea"
        />
      )}
    </div>
  );
};

const StringSelectionIO = ({
  create,
  example_io,
  set_example_io,
  hide_by_key,
  set_hide_by_key,
  io_key,
  location,
  constructor_args,
}) => {
  if (!hide_by_key.has(constructor_args["reference_key"]) && create) {
    hide_by_key.add(constructor_args["reference_key"]);
    set_hide_by_key(hide_by_key);
  }
  return (
    <div>
      <Badge variant="primary">
        {" "}
        Select {io_key} in {constructor_args["reference_key"]}
      </Badge>
      <br />
      {location === "context" || !create ? (
        example_io[io_key]
      ) : (
        <TokenAnnotator
          className="mb-1 p-3 light-gray-bg qa-context"
          tokens={example_io[constructor_args["reference_key"]].split(/\b/)}
          value={example_io[io_key] ? example_io[io_key] : ""}
          onChange={(value) => {
            example_io[io_key] = [value[value.length - 1]];
            set_example_io(example_io);
          }}
          getSpan={(span) => ({
            ...span,
            tag: io_key,
          })}
        />
      )}
    </div>
  );
};

const MultipleChoiceProbsIO = ({
  create,
  example_io,
  set_example_io,
  hide_by_key,
  set_hide_by_key,
  io_key,
  location,
  constructor_args,
}) => {
  if (example_io[io_key]) {
    const labels = Object.keys(example_io[io_key]);
    const probs = labels.map((key, _) => example_io[io_key][key]);
    return <PieRechart data={probs} labels={labels} />;
  }
  console.log(example_io);
  console.log(io_key);
  console.log(example_io[io_key]);
  console.log("WHYYYY");
  return null;
};

const ConfIO = ({
  create,
  example_io,
  set_example_io,
  hide_by_key,
  set_hide_by_key,
  io_key,
  location,
  constructor_args,
}) => {
  if (example_io[io_key]) {
    const labels = ["confidence", "uncertianty"];
    const probs = [example_io[io_key], 1 - example_io[io_key]];
    return <PieRechart data={probs} labels={labels} />;
  }
  return null;
};

const IO = ({
  create,
  example_io,
  set_example_io,
  hide_by_key,
  set_hide_by_key,
  io_key,
  type,
  location,
  constructor_args,
}) => {
  switch (type) {
    case "string":
      return (
        <StringIO
          create={create}
          io_key={io_key}
          example_io={example_io}
          set_example_io={set_example_io}
          hide_by_key={hide_by_key}
          set_hide_by_key={set_hide_by_key}
          location={location}
          constructor_args={constructor_args}
        />
      );
    case "multiple_choice":
      return (
        <MultipleChoiceIO
          create={create}
          io_key={io_key}
          example_io={example_io}
          set_example_io={set_example_io}
          hide_by_key={hide_by_key}
          set_hide_by_key={set_hide_by_key}
          location={location}
          constructor_args={constructor_args}
        />
      );
    case "string_selection":
      return (
        <StringSelectionIO
          create={create}
          io_key={io_key}
          example_io={example_io}
          set_example_io={set_example_io}
          hide_by_key={hide_by_key}
          set_hide_by_key={set_hide_by_key}
          location={location}
          constructor_args={constructor_args}
        />
      );
    case "multiple_choice_probs":
      return (
        <MultipleChoiceProbsIO
          create={create}
          io_key={io_key}
          example_io={example_io}
          set_example_io={set_example_io}
          hide_by_key={hide_by_key}
          set_hide_by_key={set_hide_by_key}
          location={location}
          constructor_args={constructor_args}
        />
      );
    case "conf":
      return (
        <ConfIO
          create={create}
          io_key={io_key}
          example_io={example_io}
          set_example_io={set_example_io}
          hide_by_key={hide_by_key}
          set_hide_by_key={set_hide_by_key}
          location={location}
          constructor_args={constructor_args}
        />
      );
    default:
      return null;
  }
};

export default IO;
