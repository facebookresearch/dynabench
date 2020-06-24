import React from 'react';
import {
  Container,
  Row, Col,
  Card,
  CardGroup,
  Button,
  Nav,
  Table
} from 'react-bootstrap';
import { Link } from 'react-router-dom';

import UserContext from './UserContext';

class ModelPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modelId: null,
      model: {
        name: 'RoBERTa',
        user: {
          username: 'douwe',
        }
      },
      scores: {
      }
    };
  }
  componentDidMount() {
    const { match: { params } } = this.props;
    this.setState(params);
  }
  render() {
    return (
      <Container>
        <Row>
          <h2 className="text-uppercase">Model Overview</h2><br/>
        </Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
            <Card>
              <Card.Header>
                <span>
                {this.state.model.name}
                </span>
                <span style={{float: 'right'}}>
                  <Button className="btn btn-secondary" aria-label="Back" style={{ margin: 0, padding: 0, paddingLeft: 6, paddingRight: 6 }} onClick={this.props.history.goBack}>
                    <svg className="octicon octicon-chevron-left" viewBox="0 0 8 16" version="1.1" width="8" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M5.5 3L7 4.5 3.25 8 7 11.5 5.5 13l-5-5 5-5z"></path></svg>
                  </Button>
                </span>
              </Card.Header>
              <Card.Body>
                <Card.Text>
                  Owner: {this.state.model.user.username}
                </Card.Text>
                <Card.Text>
                  Badges: Rockstar
                </Card.Text>
              </Card.Body>
            </Card>
          </CardGroup>
        </Row>
      </Container>
    );
  }
}

export default ModelPage;
