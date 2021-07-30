import React, { useEffect } from "react";
import { useContext, useState } from "react";
import UserContext from "../../containers/UserContext";
import { Button, Modal, Row } from "react-bootstrap";
import { getOrderedWeights } from "./TaskModelLeaderboardCardWrapper";

const SnapshotModal = (props) => {
  const context = useContext(UserContext);
  const {
    sort,
    total,
    metricWeights,
    datasetWeights,
    taskId,
    taskCode,
    showModal,
    setShowModal,
  } = props;

  const [createdSuccessfully, setCreatedSuccessfully] = useState(null);
  const [copySuccess, setCopySuccess] = useState("");
  const [snapshotUrl, setSnapshotUrl] = useState("");

  useEffect(() => {
    setCreatedSuccessfully(null);
    setCopySuccess("");
  }, [showModal]);

  const copyToClipboard = () => {
    const from = document.getElementById("snapshotUrl");
    const range = document.createRange();
    window.getSelection().removeAllRanges();
    range.selectNode(from);
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    setCopySuccess("   Copied successfully!");
  };

  const saveSnapshot = () => {
    const { orderedMetricWeights, orderedDatasetWeights } = getOrderedWeights(
      metricWeights,
      datasetWeights
    );

    context.api
      .createLeaderboardSnapshot(
        taskId,
        sort,
        metricWeights,
        datasetWeights,
        orderedMetricWeights,
        orderedDatasetWeights,
        total
      )
      .then(
        (result) => {
          const snapshotUrl = new URL(window.location.href);
          snapshotUrl.pathname = `/tasks/${taskCode}/s/${result.name}`;
          snapshotUrl.search = "?content_only=true";
          setSnapshotUrl(snapshotUrl.toString());
          setCreatedSuccessfully(true);
        },
        (error) => {
          console.log(error);
          if (error && error.status_code === 403) {
            props.history.push(
              "/login?msg=" +
                encodeURIComponent(
                  "You need to login to snapshot a leaderboard."
                ) +
                `&src=/tasks/${taskCode}`
            );
          } else {
            setCreatedSuccessfully(false);
          }
        }
      );
  };

  return (
    <Modal show={showModal} onHide={() => setShowModal(false)} centered={true}>
      <Modal.Header closeButton>
        <Modal.Title>Snapshot</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {createdSuccessfully === null ? (
          <>
            <p>
              Save leaderboard standings along weights for metrics and datasets
              and share with anyone using a link. Results shown in a snapshot
              table will be frozen and will not change over time.
            </p>
            <Row className="justify-content-center">
              <Button variant="primary" onClick={saveSnapshot} className={""}>
                Generate
              </Button>
            </Row>
          </>
        ) : (
          <>
            {createdSuccessfully ? (
              <div>
                <p>{`Your snapshot is ready. Permanent link to your snapshot is:`}</p>
                <p className="text-break" id="snapshotUrl">
                  {snapshotUrl}
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
                {`There was an error in creating your snapshot. Please contact support
              or try again later.`}
              </p>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default SnapshotModal;
