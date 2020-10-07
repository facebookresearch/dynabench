/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Formik } from "formik";
import { Container, Button, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./LoginPage.css";
import UserContext from "./UserContext";

import qs from "qs";

class RegisterPage extends React.Component {
  render() {
    var query = qs.parse(this.props.location.search, {
      ignoreQueryPrefix: true,
    });
    return (
      <UserContext.Consumer>
        {(props) => (
          <Container>
            <Row>
              <div className="wrapper fade-in-down">
                <div id="form-content" className="login-form text-center">
                  <h2 className="d-block my-4 text-uppercase text-reset">
                    Register
                  </h2>
                  <p className="msg mb-0">{query.msg}</p>
                  <hr className="mb-4" />
                  <Formik
                    initialValues={{
                      email: "",
                      username: "",
                      password: "",
                      accept: false,
                    }}
                    validate={(values) => {
                      const errors = {};
                      if (!values.email) {
                        errors.email = "Required";
                      } else if (
                        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
                          values.email
                        )
                      ) {
                        errors.email = "Invalid email address";
                      }
                      if (!values.username) {
                        errors.username = "Required";
                      }
                      if (!values.password) {
                        errors.password = "Required";
                      } else if (values.password.length < 8) {
                        errors.password =
                          "Minimum password length is 8 characters";
                      }
                      if (!values.accept) {
                        errors.accept = "Required";
                      }
                      if (process.env.REACT_APP_BETA_LOGIN_REQUIRED) {
                        // NOTE: Nothing fancy, just to discourage sharing while we're in beta
                        // TODO: Handle this in backend
                        if (!values.invitecode) {
                          errors.invitecode = "Required";
                        }
                        if (values.invitecode !== "DYN4B3NCH") {
                          errors.invitecode = "Unknown invite code";
                        }
                      }
                      return errors;
                    }}
                    onSubmit={(values, { setFieldError, setSubmitting }) => {
                      props.api
                        .register(
                          values.email,
                          values.password,
                          values.username
                        )
                        .then((result) => {
                          console.log(result);
                          props.updateState({ user: result.user });
                          this.props.history.push("/");
                        }, (error) => {
                          this.setState({ error });
                          setSubmitting(false);
                          setFieldError("accept", "Registration failed (" + error.error + ")");
                        });
                    }}
                  >
                    {({
                      values,
                      errors,
                      touched,
                      handleChange,
                      handleBlur,
                      handleSubmit,
                      isSubmitting,
                      /* and other goodies */
                    }) => (
                      <>
                        <form className="px-4" onSubmit={handleSubmit}>
                          <input
                            type="email"
                            name="email"
                            className="fade-in first text-left"
                            placeholder="Email"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.email}
                          />
                          <small className="form-text text-muted">
                            {errors.email && touched.email && errors.email}
                          </small>
                          <input
                            type="text"
                            name="username"
                            className="fade-in second text-left"
                            placeholder="Username"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.username}
                          />
                          <small className="form-text text-muted">
                            {errors.username &&
                              touched.username &&
                              errors.username}
                          </small>
                          <input
                            type="password"
                            name="password"
                            className="fade-in third text-left"
                            placeholder="Password"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.password}
                          />
                          <small className="form-text text-muted">
                            {errors.password &&
                              touched.password &&
                              errors.password}
                          </small>
                          {process.env.REACT_APP_BETA_LOGIN_REQUIRED ?
                            <>
                            <input
                              type="text"
                              name="invitecode"
                              className="fade-in third text-left"
                              placeholder="Beta invitation code"
                              onChange={handleChange}
                              onBlur={handleBlur}
                              value={values.invitecode}
                            />
                            <small className="form-text text-muted">
                              {errors.invitecode &&
                                touched.invitecode &&
                                errors.invitecode}
                            </small>
                            </> : <></>
                          }
                          <div className="fade-in third mt-4">
                            <input
                              type="checkbox"
                              name="accept"
                              onChange={handleChange}
                              onBlur={handleBlur}
                              value={values.accept}
                              checked={values.accept}
                            />{" "}
                            I accept the{" "}
                            <Link className="underline-hover" to="/termsofuse">
                              Terms of Use
                            </Link>{" "}
                            and{" "}
                            <Link className="underline-hover" to="/datapolicy">
                              Data Policy
                            </Link>
                            .
                          </div>
                          <small className="form-text text-muted">
                            {errors.accept && touched.accept && errors.accept}
                          </small>
                          <Button
                            type="submit"
                            variant="primary"
                            className="fade-in third submit-btn button-ellipse text-uppercase my-4"
                            disabled={isSubmitting}
                          >
                            Register
                          </Button>
                        </form>
                        <div className="mb-5">
                          <p>
                            Already have an account?{" "}
                            <Link className="underline-hover" to="/login">
                              Login
                            </Link>
                          </p>
                        </div>
                      </>
                    )}
                  </Formik>
                </div>
              </div>
            </Row>
          </Container>
        )}
      </UserContext.Consumer>
    );
  }
}

export default RegisterPage;
