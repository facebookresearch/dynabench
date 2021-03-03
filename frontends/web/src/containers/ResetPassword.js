/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Formik } from "formik";
import { Container, Row, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./LoginPage.css";
import UserContext from "./UserContext";

class ResetPassword extends React.Component {
  static contextType = UserContext;

  handleValidation = (values) => {
    const errors = {};
    if (!values.email || values.email === "") {
      errors.email = "Required";
    }
    if (!values.password || values.password === "") {
      errors.password = "Required";
    }
    if (!values.confirmPassword || values.confirmPassword === "") {
      errors.confirmPassword = "Required";
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Make sure both passwords entered are same";
    }
    return errors;
  };

  handleSubmit = (values, { setFieldError, setSubmitting }) => {
    const {
      match: { params },
    } = this.props;
    this.context.api
      .resetPassword({
        email: values.email,
        password: values.password,
        token: params.token,
      })
      .then(
        (result) => {
          this.props.history.push(
            "/login?msg=" +
              encodeURIComponent("Password reset successful. Please login.")
          );
        },
        (error) => {
          this.setState({ error });
          setSubmitting(false);
          setFieldError("general", "Reset failed (token invalid?)");
        }
      );
  };

  render() {
    return (
      <UserContext.Consumer>
        {(props) => (
          <Container>
            <Row>
              <div className="wrapper fade-in-down">
                <div id="formContent" className="login-form text-center">
                  <h2 className="d-block my-4 text-uppercase text-reset">
                    Reset Password
                  </h2>
                  <hr className="mb-4" />
                  <Formik
                    initialValues={{
                      email: "",
                    }}
                    validate={this.handleValidation}
                    onSubmit={this.handleSubmit}
                  >
                    {({
                      values,
                      errors,
                      touched,
                      handleChange,
                      handleBlur,
                      handleSubmit,
                      isSubmitting,
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
                            type="password"
                            name="password"
                            className="fade-in first text-left"
                            placeholder="Password"
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <small className="form-text text-muted">
                            {errors.password &&
                              touched.password &&
                              errors.password}
                          </small>
                          <input
                            type="password"
                            name="confirmPassword"
                            className="fade-in first text-left"
                            placeholder="Confirm Password"
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <small className="form-text text-muted">
                            {errors.confirmPassword &&
                              touched.confirmPassword &&
                              errors.confirmPassword}
                          </small>
                          <small className="form-text text-muted">
                            {errors.general}
                          </small>
                          <Button
                            type="submit"
                            variant="primary"
                            className="fade-in third submit-btn button-ellipse text-uppercase my-4"
                            disabled={isSubmitting}
                          >
                            Reset
                          </Button>
                        </form>
                        <div className="form-footer">
                          <p>
                            Don't have an account?{" "}
                            <Link
                              className="btn-link underline-hover"
                              to="/register"
                            >
                              Sign up
                            </Link>
                          </p>
                          <p>
                            Remember your password?{" "}
                            <Link
                              className="btn-link underline-hover"
                              to="/login"
                            >
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

export default ResetPassword;
