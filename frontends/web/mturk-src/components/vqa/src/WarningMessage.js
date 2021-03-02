import React from "react";
import { Alert } from 'react-bootstrap';

class WarningMessageLight extends React.Component {
    render() {
        return <p>
            <strong style={{ color: "red" }}>WARNING: </strong><br/>
            Every question will be checked by other humans.
            If it is detected that you are spamming the AI or consistently creating invalid questions or making
            a bad use of the interface you will be banned.
        </p>
    }
}

class WarningMessage extends React.Component {
    render() {
        return (
            <Alert variant={"danger"} className="px-2 mx-0" style={{ width: '100%'}}>
                WARNING: If you do not follow our instructions (shown above), your work will be rejected and you will be banned.
            </Alert>
        )
    }
}

export { WarningMessage, WarningMessageLight };
