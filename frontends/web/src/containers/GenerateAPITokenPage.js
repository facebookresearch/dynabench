/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import UserContext from "./UserContext";
import { Link } from "react-router-dom";
import { Container, Col, Button } from "react-bootstrap";


class GenerateAPITokenPage extends React.Component {
    static contextType = UserContext
    state = {
        apiToken: null,
        copySuccess: "",
        errorState: false
    }

    fetchData() {
        const user = this.context.api.getCredentials();
        this.context.api
            .getAPIToken()
            .then(
                (result) => {
                    this.setState({apiToken: result.api_token})
                },
                (error) => {
                    console.log(error);
                    this.setState({errorState: true})
                }
            );
    }

    componentDidMount() {
        if (!this.context.api.loggedIn()) {
            this.props.history.push(
                "/login?msg=" +
                encodeURIComponent("Please login first.") +
                "&src=/generate_api_token"
            );
        } else {
            this.fetchData()
        }
    }

    copyToClipboard = () => {
        const textField = document.createElement("textarea");
        textField.innerText = this.state.apiToken;
        document.body.appendChild(textField);
        textField.select();
        document.execCommand("copy");
        textField.remove();
        this.setState({copySuccess: "Success!"})
    }

    render() {
        if (this.state.errorState) {
            return (
                <Container className="mb-5 pb-5">
                    <h2/>
                    <Col className="m-auto" lg={9}>
                        <div className="mb-5 text-center">
                        Some error happened! Please <Link to="/contact">contact us</Link>.
                        </div>
                    </Col>
                </Container>
            )
        } else {

            return (
                <Container className="mb-5 pb-5">
                    <h2/>
                    <Col className="m-auto" lg={9}>
                        <div className="mb-5 text-center">
                            Your API token is {this.state.apiToken}
                        </div>
                        {
                            document.queryCommandSupported("copy") &&
                            <div className="mb-5 text-center">
                                <Button variant="primary" onClick={this.copyToClipboard}>Copy</Button>
                                &nbsp;{this.state.copySuccess}
                            </div>
                        }
                    </Col>
                </Container>
            )
        }
    }
}


export default GenerateAPITokenPage;
