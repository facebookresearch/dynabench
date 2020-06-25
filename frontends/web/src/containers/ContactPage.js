import React from 'react';
import {
  Container,
  Row,
  Card,
  CardGroup
} from 'react-bootstrap';
import { Link } from 'react-router-dom';

import UserContext from './UserContext';

class ContactPage extends React.Component {
  render() {
    return (
      <Container>
        <Row>
          <h2 className="text-uppercase">Contact</h2>
        </Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
            <Card>
              <Card.Body>
                <Card.Text>
                  TBD
                </Card.Text>
              </Card.Body>
            </Card>
          </CardGroup>
        </Row>
      </Container>
    );
  }
}

export default ContactPage;
