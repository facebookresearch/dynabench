/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  Card,
  Col,
  Container,
  Pagination,
  Table,
  Modal,
  Button,
  Form,
  Row,
  InputGroup,
} from "react-bootstrap";
import { Formik } from "formik";

const AdminTaskProposalTable = (props) => {
  const { data, page, getPage, paginate, isEndOfPage, api } = props;

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showViewModals, setShowViewModals] = useState(
    data.map((datum) => false)
  );

  const [showChangesModal, setShowChangesModal] = useState(false);

  if (data.length !== showViewModals.length) {
    setShowViewModals(data.map((datum) => false));
  }

  const toggleShowViewModal = (index) => {
    setShowViewModals(
      showViewModals.map((obj, obj_index) => (index === obj_index ? !obj : obj))
    );
  };

  return (
    <Col className="m-auto" lg={12}>
      <Card className="profile-card">
        <Card.Body className="overflow-auto">
          <Table hover className="mb-0">
            <thead className="blue-color border-bottom">
              <tr>
                <td>
                  <b>Name</b>
                </td>
                <td>
                  <b>Code</b>
                </td>
                <td>
                  <b>TLDR</b>
                </td>
                <td>
                  <b>Description</b>
                </td>
              </tr>
            </thead>
            <tbody>
              {!data.length ? (
                <tr>
                  <td colSpan="4">
                    <div className="text-center">No data found</div>
                  </td>
                </tr>
              ) : null}
              {data.map((datum, index) => {
                return (
                  <tr key={index}>
                    <Modal
                      size="lg"
                      show={showViewModals[index]}
                      onHide={() => toggleShowViewModal(index)}
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>View Proposal</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Container>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              <b>Name</b>
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control disabled value={datum.name} />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              <b>Task Code</b>
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control disabled value={datum.task_code} />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              <b>Short Description</b>
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control disabled value={datum.desc} />
                            </Col>
                          </Form.Group>
                          <Form.Group as={Row} className="py-3 my-0">
                            <Form.Label column>
                              <b>Long Description</b>
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control
                                disabled
                                rows={12}
                                as="textarea"
                                value={datum.longdesc}
                              />
                            </Col>
                          </Form.Group>
                          <Row
                            className="float-right"
                            style={{ paddingRight: 15 }}
                          >
                            <Button
                              style={{ marginRight: 10 }}
                              onClick={() => {
                                toggleShowViewModal(index);
                                api
                                  .processTaskProposal(datum.id, true, null)
                                  .then((result) => getPage());
                              }}
                            >
                              Accept
                            </Button>{" "}
                            <Button
                              variant="danger"
                              onClick={() => {
                                toggleShowViewModal(index);
                                setShowChangesModal(true);
                              }}
                            >
                              Reject
                            </Button>
                          </Row>
                        </Container>
                      </Modal.Body>
                    </Modal>
                    <Modal
                      show={showChangesModal}
                      size="lg"
                      onHide={() => setShowChangesModal(false)}
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>Request Changes</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Formik
                          initialValues={{
                            changes: "",
                          }}
                          onSubmit={(values) => {
                            console.log(values);
                          }}
                        >
                          {({
                            values,
                            errors,
                            handleChange,
                            handleSubmit,
                            isSubmitting,
                            dirty,
                          }) => (
                            <form className="px-4" onSubmit={handleSubmit}>
                              <Container>
                                <Form.Group
                                  as={Row}
                                  controlId="changes"
                                  className="py-3 my-0"
                                >
                                  <Form.Label column>
                                    <b>Changes</b>
                                  </Form.Label>
                                  <Col sm="8">
                                    <Form.Control
                                      rows={12}
                                      as="textarea"
                                      onChange={handleChange}
                                      defaultValue={values.changes}
                                    />
                                  </Col>
                                </Form.Group>
                                <Row
                                  className="float-right"
                                  style={{ paddingRight: 15 }}
                                >
                                  <Button
                                    style={{ marginRight: 10 }}
                                    variant="secondary"
                                    onClick={() => {
                                      setShowChangesModal(false);
                                      toggleShowViewModal(index);
                                    }}
                                  >
                                    Close
                                  </Button>
                                  <Button variant="primary" type="submit">
                                    Request Changes
                                  </Button>
                                </Row>
                              </Container>
                            </form>
                          )}
                        </Formik>
                      </Modal.Body>
                    </Modal>
                    <td className="text-truncate long-text">
                      <span
                        className="btn-link dataset-link"
                        onClick={() => toggleShowViewModal(index)}
                      >
                        {datum.name}
                      </span>
                    </td>
                    <td>{datum.task_code}</td>
                    <td className="text-truncate long-text">
                      <span>{datum.desc}</span>
                    </td>
                    <td className="text-truncate long-text">
                      <span>{datum.longdesc}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
        <Card.Footer className="text-center">
          <Pagination className="mb-0 float-right" size="sm">
            <Pagination.Item disabled={!page} onClick={() => paginate("prev")}>
              Previous
            </Pagination.Item>
            <Pagination.Item
              disabled={isEndOfPage}
              onClick={() => paginate("next")}
            >
              Next
            </Pagination.Item>
          </Pagination>
        </Card.Footer>
      </Card>
    </Col>
  );
};

const AdminTaskProposalSubPage = (props) => {
  const [userTaskProposals, setUserTaskProposals] = useState([]);
  const [taskProposalsPage, setTaskProposalsPage] = useState(0);
  const [isEndOfTaskProposalsPage, setIsEndOfTaskProposalsPage] =
    useState(true);

  const { api } = props;
  const pageLimit = 5;

  const getPage = useCallback(() => {
    api.getAllTaskProposals(taskProposalsPage, pageLimit).then(
      (result) => {
        const isEndOfPage =
          (taskProposalsPage + 1) * pageLimit >= (result.count || 0);
        setIsEndOfTaskProposalsPage(isEndOfPage);
        setUserTaskProposals(result.data || []);
      },
      (error) => {
        console.log(error);
      }
    );
  }, [api, taskProposalsPage]);

  useEffect(() => {
    getPage();
  }, [getPage]);

  const paginate = (state) => {
    const is_next = state === "next";
    const newPage = is_next ? taskProposalsPage + 1 : taskProposalsPage - 1;
    setTaskProposalsPage(newPage);
  };

  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">All Proposals</h1>
      <AdminTaskProposalTable
        api={api}
        data={userTaskProposals}
        page={taskProposalsPage}
        getPage={getPage}
        paginate={paginate}
        isEndOfPage={isEndOfTaskProposalsPage}
      />
    </Container>
  );
};

export default AdminTaskProposalSubPage;
