import React from 'react';
import { Formik } from 'formik';
import { Container, Button, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './LoginPage.css';
import UserContext from './UserContext';

class RegisterPage extends React.Component {
  render() {
    return (
      <UserContext.Consumer>
      {props => (
          <Container>
            <Row>
              <div className="wrapper fadeInDown">
              <div id="formContent" className="loginForm text-center">
                <h2>REGISTER</h2>
                <Formik
                  initialValues={{ email: '', username: '', password: '', accept: false }}
                  validate={values => {
                    const errors = {};
                    if (!values.email) {
                      errors.email = 'Required';
                    } else if (
                      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
                    ) {
                      errors.email = 'Invalid email address';
                    }
                    if (!values.username) {
                      errors.username = 'Required';
                    }
                    if (!values.password) {
                      errors.password = 'Required';
                    } else if (values.password.length < 8) {
                      errors.password = 'Minimum password length is 8 characters';
                    }
                    if (!values.accept) {
                      errors.accept = 'Required';
                    }
                    return errors;
                  }}
                  onSubmit={(values, { setFieldError, setSubmitting }) => {
                    props.api.register(values.email, values.password, values.username)
                    .then(result => {
                      console.log(result);
                      props.updateState({user: result.user});
                      this.props.history.push("/");
                    })
                    .catch(error => {
                      console.log(error);
                      this.setState({error});
                      setSubmitting(false);
                      setFieldError('general', 'Registration failed');
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
                        type="text"
                        name="username"
                        className="fadeIn second"
                        placeholder="username / nickname"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.username}
                      />
                      <small className="form-text text-muted">{errors.username && touched.username && errors.username}</small>
                      <input
                        type="password"
                        name="password"
                        className="fadeIn third"
                        placeholder="password"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.password}
                      />
                      <small className="form-text text-muted">{errors.password && touched.password && errors.password}</small>
                      <input
                        type="checkbox"
                        name="accept"
                        className="fadeIn third"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.accept}
                        checked={values.accept}
                      /> I accept the <Link className="btn-link" to="/terms">terms and conditions</Link>.
                      <small className="form-text text-muted">{errors.accept && touched.accept && errors.accept}</small>
                      <Button type="submit" variant="primary" className="fadeIn third submitBtn" disabled={isSubmitting}>
                        Register
                      </Button>
                    </form>
                    <div id="formFooter">
                      <p>Already have an account? <Link className="underlineHover btn-link" to="/login">Login</Link></p>
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
