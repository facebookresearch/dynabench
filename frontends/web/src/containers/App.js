/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import "./App.css";
import { Navbar, Nav, NavDropdown, Row, Container } from "react-bootstrap";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import RegisterPage from "./RegisterPage";
import ProfilePage from "./ProfilePage";
import AboutPage from "./AboutPage";
import TaskPage from "./TaskPage";
import FloresTaskPage from "./FloresTaskPage";
import FloresTop5Page from "./FloresTop5Page";
import ContactPage from "./ContactPage";
import TermsPage from "./TermsPage";
import DataPolicyPage from "./DataPolicyPage";
import UserContext from "./UserContext";
import TasksContext from "./TasksContext";
import UserPage from "./UserPage";
import ModelPage from "./ModelPage";
import ApiService from "../common/ApiService";
import ScrollToTop from "./ScrollToTop.js";
import CreateInterface from "./CreateInterface.js";
import VerifyInterface from "./VerifyInterface.js";
import UpdateModelInfoInterface from "./UpdateModelInfoInterface.js";
import GenerateAPITokenPage from "./GenerateAPITokenPage.js";
import { Avatar } from "../components/Avatar/Avatar";
import ReactGA from "react-ga";
import SubmitInterface from "./SubmitInterface.js";

import qs from "qs";

class RouterMonitor extends React.Component {
  constructor(props) {
    super(props);
    this.api = this.props.api;
  }
  render() {
    if (process.env.REACT_APP_GA_ID) {
      ReactGA.set({ page: this.props.location.pathname });
      ReactGA.pageview(this.props.location.pathname);
    }

    if (process.env.REACT_APP_BETA_LOGIN_REQUIRED) {
      if (
        !this.api.loggedIn() &&
        this.props.location.pathname !== "/login" &&
        this.props.location.pathname !== "/register" &&
        this.props.location.pathname !== "/termsofuse" &&
        this.props.location.pathname !== "/datapolicy" &&
        this.props.location.pathname !== "/forgot-password" &&
        (!this.props.location.pathname.startsWith("/reset-password/") ||
          this.props.location.pathname.length <= "/reset-password/".length)
      ) {
        this.props.history.push(
          "/login?msg=" +
            encodeURIComponent("You need to be logged in to access this beta.")
        );
      }
    }
    return null;
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      tasks: [],
    };
    this.updateState = this.updateState.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.api = new ApiService(process.env.REACT_APP_API_HOST);
    if (process.env.REACT_APP_GA_ID) {
      ReactGA.initialize(process.env.REACT_APP_GA_ID);
    }
  }
  updateState(value) {
    this.setState(value);
  }
  refreshData() {
    if (this.api.loggedIn()) {
      const userCredentials = this.api.getCredentials();
      this.setState({ user: userCredentials }, () => {
        this.api.getUser(userCredentials.id).then(
          (result) => {
            this.setState({ user: result });
          },
          (error) => {
            console.log(error);
          }
        );
      });
    }
    this.api.getTasks().then(
      (result) => {
        this.setState({ tasks: result });
      },
      (error) => {
        console.log(error);
      }
    );
  }
  componentDidMount() {
    this.refreshData();
  }

  render() {
    //href={`/tasks/${task.id}`}
    var query = qs.parse(window.location.search, {
      ignoreQueryPrefix: true,
    });
    const showContentOnly = query.content_only === "true";
    const NavItems = this.state.tasks.map((task, index) => (
      <NavDropdown.Item
        key={task.id}
        as={Link}
        to={`/tasks/${task.id}`}
        className="py-3"
      >
        {task.name}
      </NavDropdown.Item>
    ));
    return (
      <UserContext.Provider
        value={{
          user: this.state.user,
          updateState: this.updateState,
          api: this.api,
        }}
      >
        <TasksContext.Provider
          value={{
            tasks: this.state.tasks,
          }}
        >
          <BrowserRouter>
            <ScrollToTop />
            <Route
              render={(props) => <RouterMonitor {...props} api={this.api} />}
            />
            {!showContentOnly && (
              <Navbar
                expand="lg"
                variant="dark"
                className="shadow blue-bg justify-content-start"
              >
                <Navbar.Toggle
                  aria-controls="basic-navbar-nav"
                  className="border-0 mr-2"
                />
                <Navbar.Brand as={Link} to="/">
                  <img
                    src="/logo_w.png"
                    style={{ width: 80, marginLeft: 5, marginRight: 20 }}
                    alt="Dynabench"
                  />
                </Navbar.Brand>
                <Navbar.Collapse>
                  <Nav className="mr-auto">
                    <Nav.Item>
                      <Nav.Link as={Link} to="/about">
                        About
                      </Nav.Link>
                    </Nav.Item>
                    <NavDropdown title="Tasks" id="basic-nav-dropdown">
                      {NavItems}
                      <div className="dropdown-divider my-0"></div>
                      <NavDropdown.Item
                        key={"FLoRes"}
                        as={Link}
                        to={"/flores"}
                        className="py-3"
                      >
                        Flores
                      </NavDropdown.Item>
                    </NavDropdown>
                  </Nav>
                  <Nav className="justify-content-end">
                    {this.state.user.id ? (
                      <>
                        <NavDropdown
                          onToggle={this.refreshData}
                          alignRight
                          className="no-chevron"
                          title={
                            <Avatar
                              avatar_url={this.state.user.avatar_url}
                              username={this.state.user.username}
                              isThumbnail={true}
                              theme="light"
                            />
                          }
                          id="collasible-nav-dropdown"
                        >
                          <NavDropdown.Item as={Link} to="/account#profile">
                            Profile
                          </NavDropdown.Item>
                          <NavDropdown.Divider />
                          <NavDropdown.Item
                            as={Link}
                            to="/account#notifications"
                          >
                            Notifications{" "}
                            {this.state.user &&
                            this.state.user.unseen_notifications
                              ? "(" +
                                this.state.user?.unseen_notifications +
                                ")"
                              : ""}
                          </NavDropdown.Item>
                          <NavDropdown.Item as={Link} to="/account#stats">
                            Stats &amp; Badges
                          </NavDropdown.Item>
                          <NavDropdown.Item as={Link} to="/account#models">
                            Models
                          </NavDropdown.Item>
                          <NavDropdown.Divider />
                          <NavDropdown.Item as={Link} to="/logout">
                            Logout
                          </NavDropdown.Item>
                        </NavDropdown>
                      </>
                    ) : (
                      <>
                        <Nav.Item>
                          <Nav.Link as={Link} to="/login">
                            Login
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link
                            as={Link}
                            to="/register"
                            className="signup-nav-link"
                          >
                            Sign up
                          </Nav.Link>
                        </Nav.Item>
                      </>
                    )}
                  </Nav>
                </Navbar.Collapse>
              </Navbar>
            )}
            <div id={showContentOnly ? "" : "content"}>
              <Switch>
                <Route path="/about" component={AboutPage} />
                <Route path="/contact" component={ContactPage} />
                <Route path="/termsofuse" component={TermsPage} />
                <Route path="/datapolicy" component={DataPolicyPage} />
                <Route
                  path="/tasks/:taskId/create"
                  component={CreateInterface}
                />
                <Route
                  path="/tasks/:taskId/validate"
                  component={VerifyInterface}
                />
                <Route
                  path="/tasks/:taskId/models/:modelId/updateModelInfo"
                  component={UpdateModelInfoInterface}
                />
                <Route
                  path="/tasks/:taskId/submit"
                  component={SubmitInterface}
                />
                <Route
                  path="/tasks/:taskId/models/:modelId"
                  component={ModelPage}
                />
                <Route
                  path="/tasks/:taskId/round/:roundId"
                  component={TaskPage}
                />
                <Route
                  path="/tasks/:taskId/leaderboard_configuration/:leaderboardName"
                  component={TaskPage}
                />
                <Route path="/tasks/:taskId" component={TaskPage} />
                <Route
                  path="/flores/top5/:taskShortName"
                  component={FloresTop5Page}
                />
                <Route
                  path="/flores/:taskShortName?"
                  component={FloresTaskPage}
                />
                <Route path="/login" component={LoginPage} />
                <Route
                  path="/generate_api_token"
                  component={GenerateAPITokenPage}
                />
                <Route path="/forgot-password" component={ForgotPassword} />
                <Route
                  path="/reset-password/:token"
                  component={ResetPassword}
                />
                <Route path="/logout" component={Logout} />
                <Route path="/account" component={ProfilePage} />
                <Route path="/register" component={RegisterPage} />
                <Route path="/users/:userId" component={UserPage} />
                <Route path="/models/:modelId" component={ModelPage} />
                <Route path="/" component={HomePage} />
              </Switch>
            </div>
            {!showContentOnly && (
              <footer className="footer text-white">
                <Container fluid>
                  <Row>
                    <div className="footer-nav-link">
                      Copyright © 2020 Facebook, Inc.
                    </div>
                    <div className="footer-nav-link">
                      <Link to="/contact" className="text-reset">
                        Contact
                      </Link>
                    </div>
                    <div className="footer-nav-link">
                      <Link to="/termsofuse" className="text-reset">
                        Terms of Use
                      </Link>
                    </div>
                    <div className="footer-nav-link">
                      <Link to="/datapolicy" className="text-reset">
                        Data Policy
                      </Link>
                    </div>
                  </Row>
                </Container>
              </footer>
            )}
          </BrowserRouter>
        </TasksContext.Provider>
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
