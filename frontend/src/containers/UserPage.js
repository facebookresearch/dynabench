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

import C3Chart from 'react-c3js';
import 'c3/c3.css';

class UserPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      userId: null,
      user: {}
    };
  }
  componentDidMount() {
    const { match: { params } } = this.props;
    this.setState(params, function() {
      this.context.api.getUser(this.state.userId)
      .then(result => {
        this.setState({user: result});
      })
      .catch(error => {
        console.log(error);
      });
    });
  }
  render() {
    console.log(this.state);
    return (
      <Container>
        <Row>
          <h2>User Overview</h2><br/>
        </Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
            {this.state.user.id ?
            <Card>
              <Card.Header>
                {this.state.user.username}
                <span style={{float: 'right'}}>
                  <Button className="btn btn-secondary" aria-label="Back" style={{ margin: 0, padding: 0, paddingLeft: 6, paddingRight: 6 }} onClick={this.props.history.goBack}>
                    <svg className="octicon octicon-chevron-left" viewBox="0 0 8 16" version="1.1" width="8" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M5.5 3L7 4.5 3.25 8 7 11.5 5.5 13l-5-5 5-5z"></path></svg>
                  </Button>
                </span>
              </Card.Header>
              <Card.Body>
                {
                  (this.state.user.id == this.context.user.id) ?
                  <small style={{float: 'right'}}><Link className="btn-link" to="/profile">Looking for your profile?</Link></small>
                  :
                  ''
                }
                <Card.Text>Affiliation: {this.state.user.affiliation}</Card.Text>
                <Card.Text>
                  Badges: Rockstar
                </Card.Text>
              </Card.Body>
            </Card>
              :
            <Card>
              <Card.Body>
                <Card.Text>User unknown</Card.Text>
              </Card.Body>
            </Card>
            }
          </CardGroup>
        </Row>
      </Container>
    );
  }
}

export default UserPage;
