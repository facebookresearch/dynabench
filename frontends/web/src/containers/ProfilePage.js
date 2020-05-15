import React from 'react';
import {
  Container,
  Row,
  Card,
  CardGroup
} from 'react-bootstrap';

import UserContext from './UserContext';

class UserInfoCard extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (<UserContext.Consumer>
      {props => (
        <CardGroup style={{marginTop: 20, width: '100%'}}>
        <Card>
          <Card.Header>{this.props.user.username}</Card.Header>
          <Card.Body>
            <Card.Title></Card.Title>
            <Card.Text>Email: {this.props.user.email}</Card.Text>
            <Card.Text>Real name: {this.props.user.realname}</Card.Text>
            <Card.Text>Affiliation: {this.props.user.affiliation}</Card.Text>
          </Card.Body>
          <Card.Footer>
            <small className="text-muted"></small>
          </Card.Footer>
        </Card>
        </CardGroup>
      )}
    </UserContext.Consumer>);
  }
}

class ProfilePage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      user: {}
    };
  }
  componentDidMount () {
    if (!this.context.api.loggedIn()) {
      this.props.history.push("/login?msg=" + encodeURIComponent("Please login first.") + "&src=/profile");
    } else {
      const user = this.context.api.getCredentials();
      this.context.api.getUser(user.id)
      .then(result => {
        this.setState({user: result});
      })
      .catch(error => {
        console.log(error);
      });
    }
  }
  render() {
      return (
        <Container>
          <Row>
            <h2>Your profile</h2>
          </Row>
          <Row>
            <UserInfoCard user={this.state.user} />
          </Row>
        </Container>
      );
  }
}

export default ProfilePage;
