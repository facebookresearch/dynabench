import React from 'react';
import {
  Container,
  Col,
} from 'react-bootstrap';

const ContactPage = () => (
  <Container>
    <Col className="m-auto" lg={9}>
      <h1 className="my-4 pt-3 text-uppercase">Contact</h1>
      <p>Please contact <a href="mailto:dynabench@fb.com">dynabench@fb.com</a>.</p>
    </Col>
  </Container>
);

export default ContactPage;
