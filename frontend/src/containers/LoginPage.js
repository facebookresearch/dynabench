import React from 'react';
import { Formik } from 'formik';
import { Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './LoginPage.css';
import UserContext from './UserContext';

class LoginPage extends React.Component {
  construct() {
  }
  render() {
    return (
      <UserContext.Consumer>
      {props => (
          <Container>
            <Row>
              <div className="wrapper fadeInDown">
              <div id="formContent" className="loginForm">
                <h2>Login</h2>
                <Formik
                  initialValues={{ email: '', password: '' }}
                  validate={values => {
                    const errors = {};
                    if (!values.email) {
                      errors.email = 'Required';
                    }
                    return errors;
                  }}
                  onSubmit={(values, { setFieldError, setSubmitting }) => {
                    props.api.login(values.email, values.password)
                    .then(result => {
                      console.log(result);
                      props.updateState({user: result.user});
                      this.props.history.push("/");
                    })
                    .catch(error => {
                      console.log(error);
                      this.setState({error});
                      setSubmitting(false);
                      setFieldError('general', 'Authentication failed');
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
                  }) => (
                    <>
                    <form onSubmit={handleSubmit}>
                      <input
                        type="email"
                        name="email"
                        className="fadeIn first"
                        placeholder="email"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.email}
                      />
                      <small className="form-text text-muted">{errors.email && touched.email && errors.email}</small>
                      <input
                        type="password"
                        name="password"
                        className="fadeIn second"
                        placeholder="password"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.password}
                      />
                      <small className="form-text text-muted">{errors.password && touched.password && errors.password}</small>
                      <small className="form-text text-muted">{errors.general}</small>
                      <button type="submit" className="btn btn-primary fadeIn third submitBtn" disabled={isSubmitting}>
                        Submit
                      </button>
                    </form>
                    <div id="formFooter">
                      <p>Don't have an account? <Link className="btn-link underlineHover" to="/register">Sign up</Link></p>
                      <p><Link className="btn-link underlineHover" to="/forgot">Forgot Password?</Link></p>
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

export default LoginPage;
