import React from 'react';
import {
  Button,
  Container,
  Col,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';

const AboutPage = () => (
  <Container className="mb-5 pb-5">
    <Col className="m-auto" lg={9}>
      <div className="mb-5 text-center">
        <h1 className="my-4 pt-3 text-uppercase">About</h1>
        <h2 className="task-page-header d-block font-weight-normal m-0 text-reset">
          DynaBench is a platform for dynamic adversarial data collection. It was intially developed at Facebook AI Research (FAIR) and is meant to provide state-of-the-art dynamic adversarial benchmarking tools to the community.
        </h2>
      </div>
      <hr />
      <div className="mt-5 text-center">
        <h2 className="home-cardgroup-header d-block font-weight-light text-uppercase text-reset">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="mb-5">
        <h2 className="task-page-header d-block ml-0 mt-4 text-reset">Where can I read more?</h2>
        <p>
          Please see our paper on <a href="https://arxiv.org/abs/1910.14599">Adversarial NLI: A New Benchmark for Natural Language Understanding</a>.
        </p>
      </div>
      <hr />
      <div className="mt-5">
        <h2 className="task-page-header d-block ml-0 mt-0 text-reset">Why these tasks?</h2>
        <p>
          For now, we decided to focus on these tasks because we think they cover a representative set of problems for NLP. The idea is to open this up to any task that the community is interested in.
        </p>
      </div>
      <div className="text-center">
        <h2 className="home-cardgroup-header d-block font-weight-light mb-4 text-uppercase text-reset">
          Have a question?
        </h2>
        <Button to="/contact" as={Link} className="button-ellipse blue-bg home-readmore-btn border-0">
          Reach out to us
        </Button>
      </div>
    </Col>
  </Container>
);

export default AboutPage;
