import React from "react";
import { Alert } from 'react-bootstrap';

class WarningMessage extends React.Component {
    render() {
        return (
            <Alert variant={"danger"} className="px-2 mx-0" style={{ width: '100%'}}>
                WARNING: If you do not follow our instructions, your work will be rejected and you will be banned.
            </Alert>
        )
    }
}

export default WarningMessage;
