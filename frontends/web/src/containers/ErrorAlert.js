import React from "react";
import { Alert } from "react-bootstrap";

class ErrorAlert extends React.Component {
    render() {
        return (
            <Alert variant={"danger"} className="px-2 mx-0" style={{ width: '100%'}}>
                There is a problem with the platform.
                Please contact <Alert.Link href="mailto:dynabench@fb.com">dynabench@fb.com</Alert.Link>.
            </Alert>
        )
    }
}

export default ErrorAlert;
