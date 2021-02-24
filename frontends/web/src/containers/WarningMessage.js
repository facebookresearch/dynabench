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

class WarningOwnerMode extends React.Component {
    render() {
        return (
            <div className="p-2">
                <p style={{ color: "red" }}>
                    WARNING: You are in "Task owner mode." You
                    can verify examples as correct or incorrect
                    without input from anyone else!
                </p>
            </div>
        )
    }
}

class WarningHateSpeech extends React.Component {
    render() {
        return (
            <p className="mt-3 p-3 light-red-bg rounded white-color">
                <strong>WARNING</strong>: This is sensitive content! If
                you do not want to see any hateful examples, please
                switch to another task.
            </p>
        )
    }
}

export { WarningMessage, WarningMessageLight, WarningOwnerMode, WarningHateSpeech };
