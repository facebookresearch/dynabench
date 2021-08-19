import React, { useEffect } from "react";
import { useContext, useState } from "react";
import UserContext from "../../containers/UserContext";
import { Button, Form, FormControl, InputGroup, Modal } from "react-bootstrap";

const ForkModal = (props) => {
  const context = useContext(UserContext);
  const {
    metricWeights,
    datasetWeights,
    taskId,
    taskCode,
    showForkModal,
    setShowForkModal,
  } = props;

  const emptyNameValidationMsg = "Fork name cannot be empty.";

  const [leaderboardName, setLeaderboardName] = useState("");
  const [forkFormValidationMessage, setForkFormValidationMessage] =
    useState("");
  const [forkCreatedSuccessfully, setForkCreatedSuccessfully] = useState(null);
  const [copySuccess, setCopySuccess] = useState("");
  const [forkUrl, setForkUrl] = useState("");
  const [description, setDescription] = useState("");

  const createLeaderboardConfiguration = () => {
    const trimmedLeaderboardName = leaderboardName.trim();
    if (trimmedLeaderboardName.length === 0) {
      setForkFormValidationMessage(emptyNameValidationMsg);
      return;
    }

    // We do this to ensure uniqueness between snapshot id (integer) and fork name (string).
    if (trimmedLeaderboardName.match(/^[0-9]+$/) != null) {
      setForkFormValidationMessage("Fork name cannot contain digits only.");
      return;
    }

    // We do this to avoid collision between existing page - tasks/<task_code>/create, tasks/<task_code>/verify, etc
    if (
      ["create", "validate", "models", "round"].indexOf(
        trimmedLeaderboardName
      ) !== -1
    ) {
      setForkFormValidationMessage(
        "You cannot use this name. Please try a different one."
      );
      return;
    }

    const uriEncodedLeaderboardName = encodeURIComponent(
      trimmedLeaderboardName
    );
    const configuration_json = JSON.stringify({
      metricWeights: metricWeights,
      datasetWeights: datasetWeights,
    });

    context.api
      .createLeaderboardConfiguration(
        taskId,
        uriEncodedLeaderboardName,
        configuration_json,
        description
      )
      .then(
        () => {
          const forkUrl = `https://ldbd.ly/${taskCode}/${uriEncodedLeaderboardName}`;
          setLeaderboardName("");
          setForkCreatedSuccessfully(true);
          setForkUrl(forkUrl);
        },
        (error) => {
          console.log(error);
          if (error && error.status_code === 409) {
            setForkFormValidationMessage(
              "A fork with the same name already exists."
            );
          } else if (error && error.status_code === 403) {
            props.history.push(
              "/login?msg=" +
                encodeURIComponent("You need to login to fork a leaderboard.") +
                `&src=/tasks/${taskCode}`
            );
          } else {
            setForkCreatedSuccessfully(false);
          }
        }
      );
  };

  useEffect(() => {
    setLeaderboardName("");
    setForkFormValidationMessage("");
    setForkCreatedSuccessfully(null);
    setCopySuccess("");
    setForkUrl("");
    setDescription("");
  }, [showForkModal]);

  const copyToClipboard = () => {
    const from = document.getElementById("forkLink");
    const range = document.createRange();
    window.getSelection().removeAllRanges();
    range.selectNode(from);
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    setCopySuccess("   Copied successfully!");
  };

  return (
    <Modal
      show={showForkModal}
      onHide={() => setShowForkModal(false)}
      centered={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Fork</Modal.Title>
      </Modal.Header>
      {forkCreatedSuccessfully === null ? (
        <Modal.Body>
          <p>
            Save the weights for metrics and datasets such that the
            configuration can be shared with anyone using a link. This creates a
            custom "fork" of the default leaderboard configuration.
          </p>

          <p className="mt-4">
            Choose a name for your fork. The name will be URI encoded upon
            saving.
          </p>
          <InputGroup hasValidation>
            <FormControl
              className="mx-3 p-3 rounded-1 thick-border h-auto"
              placeholder={"Enter a name.."}
              value={leaderboardName}
              onChange={(e) => {
                const updatedLeaderboardName = e.target.value;
                setLeaderboardName(updatedLeaderboardName);
                if (updatedLeaderboardName.length !== 0) {
                  setForkFormValidationMessage("");
                }
              }}
              required={true}
              isInvalid={forkFormValidationMessage.length !== 0}
            />
            <Form.Control.Feedback className="px-3" type="invalid">
              {forkFormValidationMessage}
            </Form.Control.Feedback>
          </InputGroup>
          <p className="mt-4">Enter a description for your fork:</p>
          <InputGroup>
            <FormControl
              className="mx-3 p-3 rounded-1 thick-border h-auto"
              placeholder={""}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              as="textarea"
            />
          </InputGroup>
        </Modal.Body>
      ) : (
        <Modal.Body>
          {forkCreatedSuccessfully ? (
            <div>
              <p>{`Your fork is ready. The permanent link to your fork is:`}</p>
              <p className="text-break" id="forkLink">
                {forkUrl}
              </p>
              <div className="flex text-center flex-column">
                <Button variant="primary" onClick={copyToClipboard}>
                  Copy
                </Button>
                <p className="my-0">{copySuccess}</p>
              </div>
            </div>
          ) : (
            <p>
              There was an error in creating your fork. Please contact support
              or try again later.
            </p>
          )}
        </Modal.Body>
      )}
      <Modal.Footer>
        {forkCreatedSuccessfully === null && (
          <Button
            disabled={forkFormValidationMessage.length !== 0}
            variant="primary"
            onClick={createLeaderboardConfiguration}
          >
            Save
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ForkModal;
