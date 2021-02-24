import React from "react";
import AtomicImage from "./AtomicImage.js";
import { TokenAnnotator } from "react-text-annotate";

class ContextInfo extends React.Component {
    render() {
        const {taskType, text, needAnswer, answer, updateAnswer} = this.props;
        return taskType === "VQA" ? (
            <AtomicImage src={text} maxHeight={400} maxWidth={700} />
        ) : needAnswer ? (
            <TokenAnnotator
                className="mb-1 p-3 light-gray-bg qa-context"
                tokens={text.split(/\b/)}
                value={answer}
                onChange={updateAnswer}
                getSpan={(span) => ({
                    ...span,
                    tag: "ANS",
                })}
            />
        ) : (
            <div className="mb-1 p-3 light-gray-bg">
                {text.replace("<br>", "\n")}
            </div>
        );
    }
}

export default ContextInfo;
