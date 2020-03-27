import React from 'react';
import {
  Container,
  Row,
  Card,
  CardGroup
} from 'react-bootstrap';
import { Link } from 'react-router-dom';

import UserContext from './UserContext';

class AboutPage extends React.Component {
  render() {
    return (
      <Container>
        <Row>
          <h2>About</h2>
        </Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
            <Card>
              <Card.Body>
                <Card.Text>
                  DynaBench is a platform for dynamic adversarial data collection. It was intially developed at Facebook AI Research (FAIR) and is meant to provide state-of-the-art dynamic adversarial benchmarking tools to the community.
                </Card.Text>
              </Card.Body>
            </Card>
          </CardGroup>
        </Row>
        <Row>
          <h2>Frequently Asked Questions</h2>
        </Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
            <Card>
              <Card.Body>
                <Card.Text>
                  <strong>Where can I read more?</strong><br/>
                  <span>Please see our paper on <a href="https://arxiv.org/abs/1910.14599" className="btn-link">Adversarial NLI: A New Benchmark for Natural Language Understanding</a>.</span><br/><br/>
                  <strong>Why these tasks?</strong><br/>
                  <span>For now, we decided to focus on these tasks because we think they cover a representative set of problems for NLP. The idea is to open this up to any task that the community is interested in.</span><br/><br/>
                </Card.Text>
              </Card.Body>
              <Card.Footer>
                <small className="text-muted">Have another question? <Link to="/contact" className="btn-link">Reach out to us</Link></small>
              </Card.Footer>
            </Card>
          </CardGroup>
        </Row>
      </Container>
    );
  }
}

export default AboutPage;
