/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
    Container,
    Col,
} from "react-bootstrap";
import { AnnotatorInterface } from "./AnnotatorInterface.js";
import UserContext from "./UserContext";
import { OverlayProvider, BadgeOverlay, } from "./Overlay";

class VerifyInterface extends React.Component {
    static contextType = UserContext;
    constructor(props) {
        super(props);
        this.taskId = props.match.params.taskId;
        this.state = {
            showBadges: "",
        };
    }
    componentDidMount() {
        if (!this.context.api.loggedIn()) {
            this.props.history.push(
                "/login?msg=" +
                    encodeURIComponent(
                        "Please log in or sign up so that you can get credit for your generated examples."
                    ) +
                    "&src=" +
                    encodeURIComponent("/tasks/" + this.taskId + "/create")
            );
        }
    }

    render() {
        return (
            <OverlayProvider initiallyHide={true}>
                <BadgeOverlay
                    badgeTypes={this.state.showBadges}
                    show={!!this.state.showBadges}
                    onHide={() => this.setState({ showBadges: "" })}
                ></BadgeOverlay>
                <Container className="mb-5 pb-5">
                    <Col className="m-auto" lg={12}>
                        <AnnotatorInterface
                            api={this.context.api}
                            user={this.context.user}
                            taskId={this.taskId}
                            setBadges={(badges) => this.setState({ showBadges: badges })}
                            interfaceMode="web"
                        />
                    </Col>
                </Container>
            </OverlayProvider>
        );
    }
}

export default VerifyInterface;
