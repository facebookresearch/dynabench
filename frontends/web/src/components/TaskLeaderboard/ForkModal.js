import React, { useEffect } from "react";
import { useContext, useState } from "react";
import UserContext from "../../containers/UserContext";
import {
  Button,
  Form,
  FormControl,
  InputGroup,
  Modal,
  Table,
} from "react-bootstrap";

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
  const [forkFormValidationMessage, setForkFormValidationMessage] = useState(
    emptyNameValidationMsg
  );
  const [forkCreatedSuccessfully, setForkCreatedSuccessfully] = useState(null);
  const [copySuccess, setCopySuccess] = useState("");
  const [forkUrl, setForkUrl] = useState("");

  const createLeaderboardConfiguration = () => {
    const uriEncodedLeaderboardName = encodeURIComponent(
      leaderboardName.trim()
    );
    const configuration_json = JSON.stringify({
      metricWeights: metricWeights,
      datasetWeights: datasetWeights,
    });

    context.api
      .createLeaderboardConfiguration(
        taskId,
        uriEncodedLeaderboardName,
        configuration_json
      )
      .then(
        () => {
          const forkUrl = new URL(window.location.href);
          forkUrl.pathname = `/tasks/${taskCode}/f/${uriEncodedLeaderboardName}`;
          setLeaderboardName("");
          setForkCreatedSuccessfully(true);
          setForkUrl(forkUrl.toString());
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
    setForkFormValidationMessage(emptyNameValidationMsg);
    setForkCreatedSuccessfully(null);
    setCopySuccess("");
    setForkUrl("");
  }, [showForkModal]);

  const copyToClipboard = () => {
    const from = document.getElementById("forkUrl");
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
            Save the weights for metrics and datasets and share this saved
            configuration with anyone using a link. Results shown in a forked
            table will not be frozen. They would be derived based on the latest
            models, datasets and metrics.
          </p>

          <p>Below are the weights you have chosen:</p>
          <Table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {metricWeights &&
                metricWeights.map((metricWeightDatum) => (
                  <tr key={metricWeightDatum.label}>
                    <td>Metric</td>
                    <td>{metricWeightDatum.label}</td>
                    <td>{metricWeightDatum.weight}</td>
                  </tr>
                ))}
              <tr>
                <td />
              </tr>
              {datasetWeights &&
                datasetWeights.map((datasetWeightDatum) => (
                  <tr key={datasetWeightDatum.name}>
                    <td>Dataset</td>
                    <td>{datasetWeightDatum.name}</td>
                    <td>{datasetWeightDatum.weight}</td>
                  </tr>
                ))}
            </tbody>
          </Table>

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
                const updatedName = e.target.value;
                setLeaderboardName(updatedName);
                if (updatedName.length === 0) {
                  setForkFormValidationMessage("Fork name cannot be empty.");
                } else {
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
        </Modal.Body>
      ) : (
        <Modal.Body>
          {forkCreatedSuccessfully ? (
            <div>
              <p>{`Your fork is ready. Permanent link to your fork is:`}</p>
              <p className="text-break" id="forkUrl">
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
              {`There was an error in creating your fork. Please contact support or try again later.`}
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
