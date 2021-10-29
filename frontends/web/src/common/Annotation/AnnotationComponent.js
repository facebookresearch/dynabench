/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  FormControl,
  DropdownButton,
  Dropdown,
  InputGroup,
  Button,
} from "react-bootstrap";
import Select from "react-select";
import { PieRechart } from "../../components/Rechart.js";
import { useState } from "react";
import { TokenAnnotator } from "react-text-annotate";
import AtomicImage from "./AtomicImage";
import "./AnnotationComponent.css";

const Multilabel = ({
  displayName,
  className,
  create,
  data,
  setData,
  name,
  constructorArgs,
  showName = true,
  inputReminder = false,
}) => {
  const labels = constructorArgs.labels;

  return (
    <>
      {!create ? (
        <>
          {showName && (
            <h6 className={"spaced-header " + className}>
              {displayName ? displayName : name}:
            </h6>
          )}
          {data[name].join(", ")}
        </>
      ) : (
        <div
          className={inputReminder ? "p-2 border rounded border-danger" : ""}
        >
          <Select
            isMulti
            name="multilabel"
            className="basic-multi-select"
            classNamePrefix="select"
            options={labels.map((obj) => ({ value: obj, label: obj }))}
            onChange={(e) => {
              data[name] = e.map((obj) => obj.value);
              setData(data);
            }}
          />
        </div>
      )}
    </>
  );
};

const Multiclass = ({
  displayName,
  className,
  create,
  data,
  setData,
  name,
  constructorArgs,
  showName = true,
  inputReminder = false,
}) => {
  const [choice, setChoice] = useState(constructorArgs.placeholder);
  const labels = constructorArgs.labels;
  // This ensures that the UI resets when the value goes back to null
  if (data[name] === null && choice !== constructorArgs.placeholder) {
    setChoice(constructorArgs.placeholder);
  }
  return (
    <>
      {!create ? (
        <>
          {showName && (
            <h6 className={"spaced-header " + className}>
              {displayName ? displayName : name}:
            </h6>
          )}
          {data[name]}
        </>
      ) : (
        <div
          className={inputReminder ? "p-2 border rounded border-danger" : ""}
        >
          <DropdownButton variant="light" className="p-1" title={choice}>
            {labels
              .filter((label) => label !== choice)
              .map((label, index) => (
                <Dropdown.Item
                  key={index}
                  onClick={() => {
                    setChoice(label);
                    data[name] = label;
                    setData(data);
                  }}
                  name={index}
                  index={index}
                >
                  {label}
                </Dropdown.Item>
              ))}
          </DropdownButton>
        </div>
      )}
    </>
  );
};

const TargetLabel = ({
  displayName,
  className,
  create,
  data,
  setData,
  name,
  constructorArgs,
  showName = true,
  inputReminder = false,
}) => {
  const labels = constructorArgs.labels;
  const [choice, setChoice] = useState(data[name]);

  // This ensures that the UI resets when the value externally changes
  if (choice !== data[name]) {
    setChoice(data[name]);
  }

  const vowels = ["a", "e", "i", "o", "u"];
  const indefiniteArticle = vowels.indexOf(choice[0]) >= 0 ? "an" : "a";
  const otherLabels = labels.filter((label) => label !== choice);
  const otherLabelsStr =
    otherLabels.slice(0, otherLabels.length - 2).join(", ") +
    otherLabels.slice(otherLabels.length - 2, otherLabels.length).join(" or ");
  return (
    <>
      {!create ? (
        <>
          {showName && (
            <h6 className={"spaced-header " + className}>
              {displayName ? displayName : name}:
            </h6>
          )}
          {data[name]}
        </>
      ) : (
        <div
          className={inputReminder ? "p-2 border rounded border-danger" : ""}
        >
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
                      data[name] = label;
                      setData(data);
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
        </div>
      )}
    </>
  );
};

const String = ({
  displayName,
  className,
  create,
  data,
  setData,
  name,
  constructorArgs,
  showName = true,
  inputReminder = false,
}) => {
  return (
    <>
      {!create ? (
        <>
          {showName && (
            <h6 className={"spaced-header " + className}>
              {displayName ? displayName : name}:
            </h6>
          )}
          {data[name]}
        </>
      ) : (
        <div
          className={inputReminder ? "p-2 border rounded border-danger" : ""}
        >
          <FormControl
            className={"rounded-1 thick-border p-3 " + className}
            placeholder={constructorArgs.placeholder}
            value={data[name] ? data[name] : ""}
            onChange={(event) => {
              data[name] = event.target.value;
              setData(data);
            }}
            required={true}
          />
        </div>
      )}
    </>
  );
};

const ContextStringSelection = ({
  displayName,
  className,
  create,
  data,
  setData,
  name,
  constructorArgs,
  showName = true,
  inputReminder = false,
}) => {
  const [selectionInfo, setSelectionInfo] = useState("");
  // This ensures that the UI resets when the value goes back to null
  if (data[name] === null && selectionInfo !== "") {
    setSelectionInfo("");
  }
  return (
    <>
      {!create ? (
        <>
          {showName && (
            <h6 className={"spaced-header " + className}>
              {displayName ? displayName : name}:
            </h6>
          )}
          {data[name]}
        </>
      ) : (
        <div
          className={inputReminder ? "p-2 border rounded border-danger" : ""}
        >
          <h6 className={"spaced-header " + className}>
            Select {displayName ? displayName : name} in{" "}
            {constructorArgs.reference_name}:
          </h6>
          <TokenAnnotator
            className="mb-1 p-3 light-gray-bg"
            tokens={data[constructorArgs.reference_name].split(/\b/)}
            value={selectionInfo}
            onChange={(value) => {
              if (value.length > 0) {
                setSelectionInfo([value[value.length - 1]]);
                data[name] = value[value.length - 1].tokens.join("");
                setData(data);
              }
            }}
            getSpan={(span) => ({
              ...span,
              tag: name,
            })}
          />
        </div>
      )}
    </>
  );
};

const MulticlassProbs = ({ create, data, setData, name, constructorArgs }) => {
  if (data[name]) {
    const labels = Object.keys(data[name]);
    const probs = labels.map((key) => data[name][key]);
    return <PieRechart data={probs} labels={labels} />;
  }
  return null;
};

const Conf = ({ create, data, setData, name, constructorArgs }) => {
  if (data[name]) {
    const labels = ["confidence", "uncertianty"];
    const probs = [data[name], 1 - data[name]];
    return <PieRechart data={probs} labels={labels} />;
  }
  return null;
};

function isImageUrl(url, successCallback) {
  const timeout = 5000;
  var timedOut = false,
    timer;
  var img = new Image();
  img.onerror = img.onabort = function () {
    if (!timedOut) {
      clearTimeout(timer);
    }
  };
  img.onload = function () {
    if (!timedOut) {
      clearTimeout(timer);
      successCallback();
    }
  };
  img.src = url;
  timer = setTimeout(function () {
    timedOut = true;
    // reset .src to invalid URL so it stops previous
    // loading, but doesn't trigger new load
    img.src = "//!!!!/test.jpg";
  }, timeout);
}

const ImageComponent = ({
  displayName,
  className,
  create,
  data,
  setData,
  name,
  constructorArgs,
  showName = true,
  inputReminder = false,
}) => {
  return (
    <>
      {!create ? (
        <>
          {showName && (
            <h6 className={"spaced-header " + className}>
              {displayName ? displayName : name}:
            </h6>
          )}
          <AtomicImage src={data[name]} />
        </>
      ) : data[name] ? (
        <>
          <Button
            onClick={(event) => {
              data[name] = null;
              setData(data);
            }}
          >
            <i class="fas fa-trash-alt"></i>
          </Button>
          <AtomicImage src={data[name]} />
        </>
      ) : (
        <div
          className={inputReminder ? "p-2 border rounded border-danger" : ""}
        >
          <FormControl
            className={"rounded-1 thick-border p-3 " + className}
            placeholder={
              "Enter link to image (we only allow pasteing of valid image urls)..."
            }
            value={data[name] ? data[name] : ""}
            onChange={(event) => {
              const url = event.target.value;
              isImageUrl(url, () => {
                data[name] = url;
                setData(data);
              });
            }}
            required={true}
          />
        </div>
      )}
    </>
  );
};

const AnnotationComponent = ({
  displayName,
  className,
  create,
  data,
  setData,
  name,
  type,
  constructorArgs,
  showName = true,
  inputReminder = false,
}) => {
  switch (type) {
    case "image":
      return (
        <ImageComponent
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          data={data}
          setData={setData}
          constructorArgs={constructorArgs}
          showName={showName}
          inputReminder={inputReminder}
        />
      );
    case "string":
      return (
        <String
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          data={data}
          setData={setData}
          constructorArgs={constructorArgs}
          showName={showName}
          inputReminder={inputReminder}
        />
      );
    case "multilabel":
      return (
        <Multilabel
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          data={data}
          setData={setData}
          constructorArgs={constructorArgs}
          showName={showName}
          inputReminder={inputReminder}
        />
      );
    case "multiclass":
      return (
        <Multiclass
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          data={data}
          setData={setData}
          constructorArgs={constructorArgs}
          showName={showName}
          inputReminder={inputReminder}
        />
      );
    case "target_label":
      return (
        <TargetLabel
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          data={data}
          setData={setData}
          constructorArgs={constructorArgs}
          showName={showName}
          inputReminder={inputReminder}
        />
      );
    case "context_string_selection":
      return (
        <ContextStringSelection
          displayName={displayName}
          className={className}
          create={create}
          name={name}
          data={data}
          setData={setData}
          constructorArgs={constructorArgs}
          showName={showName}
          inputReminder={inputReminder}
        />
      );
    case "multiclass_probs":
      return (
        <MulticlassProbs
          create={create}
          name={name}
          data={data}
          setData={setData}
          constructorArgs={constructorArgs}
          showName={showName}
          inputReminder={inputReminder}
        />
      );
    case "conf":
      return (
        <Conf
          create={create}
          name={name}
          data={data}
          setData={setData}
          constructorArgs={constructorArgs}
          showName={showName}
          inputReminder={inputReminder}
        />
      );
    default:
      return null;
  }
};

export default AnnotationComponent;
