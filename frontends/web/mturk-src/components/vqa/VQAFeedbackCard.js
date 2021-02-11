/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {
    Col,
    Row,
    Card,
    FormControl,
    InputGroup
} from 'react-bootstrap';

class VQAFeedbackCard extends React.Component {
    constructor(props) {
        super(props);
        this.bottomAnchorFeedbackRef = React.createRef();
    }

    componentDidMount() {
        if (this.bottomAnchorFeedbackRef.current) {
            this.bottomAnchorFeedbackRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }

    render() {
        return (
            <Card className="d-flex justify-content-center" style={{ width: '100%'}}>
                <Card.Body className="p-3">
                    <Row>
                        <Col xs={12}>
                            <h3 className="text-uppercase dark-blue-color spaced-header">
                                Feedback and comments are welcome:
                            </h3>
                            <InputGroup>
                                <FormControl
                                    style={{ width: '100%', margin: 2 }}
                                    placeholder="Write your comments here..."
                                    value={this.props.comments}
                                    onChange={(e) => this.props.handleCommentsChange(e)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                </Card.Body>
                <div
                    className="bottom-anchor"
                    ref={this.bottomAnchorFeedbackRef}
                />
            </Card>
        )
    }
}

export { VQAFeedbackCard }
