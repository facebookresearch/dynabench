import React from "react";
import "./App.css";
import {
  Navbar,
  Nav,
  NavDropdown,
  Card,
  CardGroup,
  Row,
  Col,
  Container,
} from "react-bootstrap";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ProfilePage from "./ProfilePage";
import AboutPage from "./AboutPage";
import TaskPage from "./TaskPage";
import TasksPage from "./TasksPage";
import ContactPage from "./ContactPage";
import TermsPage from "./TermsPage";
import PrivacyPage from "./PrivacyPage";
import UserContext from "./UserContext";
import UserPage from "./UserPage";
import ModelPage from "./ModelPage";
import ApiService from "./ApiService";
import ScrollToTop from "./ScrollToTop.js";
import CreateInterface from "./CreateInterface.js";
import VerifyInterface from "./VerifyInterface.js";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
    };
    this.updateState = this.updateState.bind(this);
    this.api = new ApiService();
  }
  updateState(value) {
    this.setState(value);
  }
  componentDidMount() {
    if (this.api.loggedIn()) {
      this.setState({ user: this.api.getCredentials() });
    }
    // else {
    //  var token = this.api.getToken();
    //  if (token) {
    //    console.log('we have an expired token, we should refresh!');
    //  }
    //}
  }
  render() {
    return (
      <UserContext.Provider value={ {user: this.state.user, updateState: this.updateState, api: this.api } }>
      <Router>
        <ScrollToTop />
          <Navbar
            expand="lg"
            variant="dark"
            className="shadow navbar-fixed-top blue-bg justify-content-start"
          >
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Brand as={Link} to="/">
              <img
                src="/logo_w.png"
                style={{ width: 80, marginLeft: 5, marginRight: 20 }}
                alt="DynaBench"
              />
            </Navbar.Brand>
          <Navbar.Collapse>
          <Nav className="mr-auto">
            <Nav.Item>
                <Nav.Link as={Link} to="/about">
                  About
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <NavDropdown title="Tasks" id="basic-nav-dropdown">
                <NavDropdown.Item href="/tasks/1">
                  Natural Language Institute
                </NavDropdown.Item>
                <NavDropdown.Item href="/tasks/2">
                  Questions & Answers
                </NavDropdown.Item>
                <NavDropdown.Item href="/tasks/3">
                  Sentiment
                </NavDropdown.Item>
                <NavDropdown.Item href="/tasks/4">
                  Hate Speech
                </NavDropdown.Item>
              </NavDropdown>
            </Nav.Item>
          </Nav>
          <Nav className="justify-content-end">
              {this.state.user.id ? (
                <>
                <Nav.Item>
                    <Nav.Link as={Link} to={"/profile"}>
                      {this.state.user.username}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link as={Link} to={"/logout"}>
                      Logout
                    </Nav.Link>
                </Nav.Item>
                </>
              ) : (
                <>
                <Nav.Item>
                    <Nav.Link as={Link} to="/login">
                      Login
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link as={Link} to="/register" className="signup-nav-link">
                      Sign up
                    </Nav.Link>
                </Nav.Item>
                </>
              )}
          </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div id="content">
        <Switch>
          <Route path="/about" component={AboutPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/tasks/:taskId/create" component={CreateInterface} />
          <Route path="/tasks/:taskId/verify" component={VerifyInterface} />
          <Route path="/tasks/:taskId" component={TaskPage} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/logout" component={Logout} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/users/:userId" component={UserPage} />
          <Route path="/models/:modelId" component={ModelPage} />
          <Route path="/" component={HomePage} />
        </Switch>
        </div>
        <footer className="footer">
            <Container fluid>
            <Row>
                <div className="footer-nav-link">
                  Copyright © 2020 Facebook, Inc.
                </div>
                <div className="footer-nav-link">
                  <Link to="/contact" className="btn-link">
                    Contact
                  </Link>
                </div>
                <div className="footer-nav-link">
                  <Link to="/terms" className="btn-link">
                    Terms and conditions
                  </Link>
                </div>
                <div className="footer-nav-link">
                  <Link to="/privacy" className="btn-link">
                    Privacy policy
                  </Link>
                </div>
            </Row>
          </Container>
        </footer>
      </Router>
      </UserContext.Provider>
    );
  }
}
class Logout extends React.Component {
  static contextType = UserContext;
  componentDidMount() {
    this.context.api.logout();
    this.context.updateState({ user: {} });
    this.props.history.push("/");
  }
  render() {
    return <></>;
  }
}

export default App;
