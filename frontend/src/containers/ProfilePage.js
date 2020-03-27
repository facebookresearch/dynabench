import React from 'react';
import {
  Container,
  Row,
  Card,
  CardGroup
} from 'react-bootstrap';

import UserContext from './UserContext';

class UserInfoCard extends React.Component {
  state = {
    user: {}
  }
  static contextType = UserContext;
  componentDidMount() {
    this.context.api.getUser(this.context.user.id)
    .then(result => {
      this.setState({user: result});
    })
    .catch(error => {
      console.log(error);
    });
  }
  render() {
    return (<UserContext.Consumer>
      {props => (
        <CardGroup style={{marginTop: 20, width: '100%'}}>
        <Card>
          <Card.Header>{this.state.user.username}</Card.Header>
          <Card.Body>
            <Card.Title></Card.Title>
            <Card.Text>Email: {this.state.user.email}</Card.Text>
            <Card.Text>Real name: {this.state.user.realname}</Card.Text>
            <Card.Text>Affiliation: {this.state.user.affiliation}</Card.Text>
          </Card.Body>
          <Card.Footer>
            <small className="text-muted">Last login: X</small>
          </Card.Footer>
        </Card>
        </CardGroup>
      )}
    </UserContext.Consumer>);
  }
}

class ProfilePage extends React.Component {
  static contextType = UserContext;
  componentDidMount () {
    if (!this.context.user.id) {
      // TBD: Make this display some error at the top
      this.props.history.push("/login");
    }
  }
  render() {
      return (
        <Container>
          <Row>
            <h2>Your profile</h2>
          </Row>
          <Row>
            <UserInfoCard />
          </Row>
        </Container>
      );
  }
}

export default ProfilePage;
