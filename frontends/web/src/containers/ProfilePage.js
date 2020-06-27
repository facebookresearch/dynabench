import React from 'react';
import {
  Container,
  Col,
  Card,
  Table,
} from 'react-bootstrap';

import UserContext from './UserContext';

const UserInfoCard = ({ user }) => (
  <Card className="profile-card">
    <Card.Body>
      <Card.Text className="task-page-header mb-0 mx-4 mt-4">Profile</Card.Text>
      <Table className="mb-0">
        <thead />
        <tbody>
          <tr><td>Username</td><td>{user.username}</td></tr>
          <tr><td>Email</td><td>{user.email}</td></tr>
          <tr><td>Real name</td><td>{user.realname}</td></tr>
          <tr><td>Affiliation</td><td>{user.affiliation}</td></tr>
        </tbody>
      </Table>
    </Card.Body>
  </Card>
);

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
        <Container className="mb-5 pb-5">
          <h1 className="my-4 pt-3 text-uppercase text-center">
            Your Profile
          </h1>
          <Col className="m-auto" lg={8}>
            <UserInfoCard user={this.state.user} />
          </Col>
        </Container>
      );
  }
}

export default ProfilePage;
