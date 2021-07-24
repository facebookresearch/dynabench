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

const ForkAndSnapshotModal = (props) => {
  const context = useContext(UserContext);
  const {
    metricWeights,
    datasetWeights,
    taskId,
    showModal,
    setShowModal,
    title,
    description,
    showWeights,
    nameForTexts,
    isNameMandatory,
  } = props;

  const emptyNameValidationMsg = isNameMandatory
    ? `${nameForTexts} name cannot be empty.`
    : "";
  const nameForTextsInLowerCase = nameForTexts.toLowerCase();

  const [name, setName] = useState("");
  const [formValidationMessage, setFormValidationMessage] = useState(
    emptyNameValidationMsg
  );
  const [createdSuccessfully, setCreatedSuccessfully] = useState(null);
  const [copySuccess, setCopySuccess] = useState("");

  useEffect(() => {
    setName("");
    setFormValidationMessage(emptyNameValidationMsg);
    setCreatedSuccessfully(null);
    setCopySuccess("");
  }, [showModal]);

  const copyToClipboard = () => {
    const from = document.getElementById("forkOrSnapshotLink");
    const range = document.createRange();
    window.getSelection().removeAllRanges();
    range.selectNode(from);
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    setCopySuccess("   Copied successfully!");
  };

  return (
    <Modal show={showModal} onHide={() => setShowModal(false)} centered={true}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{description}</p>
        {createdSuccessfully === null ? (
          <>
            {showWeights && (
              <>
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
              </>
            )}
            <p className="mt-4">
              {`Choose a name for your ${nameForTextsInLowerCase}. The name will be URI encoded upon
            saving.`}
            </p>
            <InputGroup hasValidation>
              <FormControl
                className="mx-3 p-3 rounded-1 thick-border h-auto"
                placeholder={"Enter a name.."}
                value={name}
                onChange={(e) => {
                  const updatedName = e.target.value;
                  setName(updatedName);
                  if (updatedName.length === 0 && isNameMandatory) {
                    setFormValidationMessage(
                      `${nameForTexts} name cannot be empty.`
                    );
                  } else {
                    setFormValidationMessage("");
                  }
                }}
                required={true}
                isInvalid={formValidationMessage.length !== 0}
              />
              <Form.Control.Feedback className="px-3" type="invalid">
                {formValidationMessage}
              </Form.Control.Feedback>
            </InputGroup>
          </>
        ) : (
          <>
            {createdSuccessfully ? (
              <div>
                <p>{`Your ${nameForTextsInLowerCase} is ready. Permanent link to your ${nameForTextsInLowerCase} is:`}</p>
                <p className="text-break" id="forkOrSnapshotLink">
                  {name}
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
                {`There was an error in creating your ${nameForTextsInLowerCase}. Please contact support
              or try again later.`}
              </p>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          Close
        </Button>
        {createdSuccessfully === null && (
          <Button
            disabled={formValidationMessage.length !== 0}
            variant="primary"
            onClick={() =>
              props.onSave(
                name,
                taskId,
                context,
                (newPathname) => {
                  const currentUrl = new URL(window.location.href);
                  currentUrl.pathname = newPathname;
                  setName(currentUrl.toString());
                  setCreatedSuccessfully(true);
                },
                (error, alreadyExistsValidationMsg, redirectToLoginMsg) => {
                  if (error && error.status_code === 409) {
                    setFormValidationMessage(alreadyExistsValidationMsg);
                  } else if (error && error.status_code === 403) {
                    props.history.push(
                      "/login?msg=" +
                        encodeURIComponent(redirectToLoginMsg) +
                        `&src=/tasks/${taskId}`
                    );
                  } else {
                    setCreatedSuccessfully(false);
                  }
                }
              )
            }
          >
            Save
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ForkAndSnapshotModal;
