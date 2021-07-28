import React from "react";
import { FormControl, DropdownButton, Dropdown, Badge, InputGroup } from "react-bootstrap";
import { PieRechart } from "../components/Rechart";
import { useState } from "react";
import { TokenAnnotator } from "react-text-annotate";
import AtomicImage from "./AtomicImage";

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
  // This ensures that the UI resets when the value goes back to null
  if (example_io[io_key] === null && choice !== "Select Choice") {
    setChoice("Select Choice");
  }
  return (
    <div>
      {location === "context" || !create ? (
        <><strong>{io_key}:</strong><br/>{example_io[io_key]}</>
      ) : (
        <>
        <Badge variant="primary"> {io_key} </Badge>
        <br />
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
        </>
      )}
    </div>
  );
};

const GoalMessageMultipleChoiceIO = ({
  create,
  example_io,
  set_example_io,
  hide_by_key,
  set_hide_by_key,
  io_key,
  location,
  constructor_args,
}) => {
  const labels = constructor_args["labels"];
  const random = labels[Math.floor(Math.random() * labels.length)]
  const [choice, setChoice] = useState(random);
  // This ensures that the UI resets when the value goes back to null
  if (example_io[io_key] === null) {
    example_io[io_key] = random;
    set_example_io(example_io);
    if (choice !== random) {
      setChoice(random);
    }
  }

  const vowels = ["a", "e", "i", "o", "u"];
  const indefiniteArticle = vowels.indexOf(choice[0]) >= 0 ? "an" : "a";
  const otherLabels = labels.filter((label, _) => label !== choice);
  const otherLabelsStr = otherLabels.slice(0,otherLabels.length-2).join(", ") + otherLabels.slice(otherLabels.length-2, otherLabels.length).join(" or ");
  return (
    <div>
      {location === "context" || !create ? (
        <><strong>{io_key}:</strong><br/>{example_io[io_key]}</>
      ) : (
        <>
        <Badge variant="primary"> {io_key} </Badge>
        <br />
        <InputGroup className="align-items-center">
          <i className="fas fa-flag-checkered mr-1"></i>
          Your goal: enter {indefiniteArticle}
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
          example that fools the model into predicting {otherLabelsStr}.
        </InputGroup>
        </>
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
      {location === "context" || !create ? (
        <><strong>{io_key}:</strong><br/>{example_io[io_key]}</>
      ) : (
        <>
        <Badge variant="primary"> {io_key} </Badge>
        <br />
        <FormControl
          className="rounded-1 thick-border light-gray-bg"
          placeholder={"Enter..."}
          value={example_io[io_key] ? example_io[io_key] : ""}
          onChange={(event) => {
            example_io[io_key] = event.target.value;
            set_example_io(example_io);
          }}
          required={true}
          as="textarea"
        />
        </>
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
  const [selection_info, setSelectionInfo] = useState("");
  // This ensures that the UI resets when the value goes back to null
  if (example_io[io_key] === null && selection_info !== "") {
    setSelectionInfo("");
  }
  return (
    <div>
      {location === "context" || !create ? (
        <><strong>{io_key} :</strong><br/>example_io[io_key]</>
      ) : (
        <>
        <Badge variant="primary">
          {" "}
          Select {io_key} in {constructor_args["reference_key"]}
        </Badge>
        <br />
        <TokenAnnotator
          className="mb-1 p-3 light-gray-bg qa-context"
          tokens={example_io[constructor_args["reference_key"]].split(/\b/)}
          value={selection_info}
          onChange={(value) => {
            if (value.length > 0) {
              setSelectionInfo([value[value.length - 1]]);
              example_io[io_key] = value[value.length - 1].tokens.join("");
              set_example_io(example_io);
            }
          }}
          getSpan={(span) => ({
            ...span,
            tag: io_key,
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

const ImageUrlIO = ({
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
      <AtomicImage src={example_io[io_key]} />
    </div>
  );
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
    case "image_url":
      return (
        <ImageUrlIO
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
    case "goal_message_multiple_choice":
      return (
        <GoalMessageMultipleChoiceIO
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
