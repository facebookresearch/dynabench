import React from "react";

class InvalidQuestionCharacteristics extends React.Component {
    render() {
        return (
            <>
                <p>A question is considered <b>invalid</b> if any of the following conditions is met:</p>
                <ul className="mx-3" style={{ listStyleType: "disc" }}>
                    <li><b>The question does not require the image to answer.</b>
                        <ul><li>ie., What is the capital of the USA?</li></ul>
                    </li>
                    <li><b>The answer is not commonly known to other people.</b>
                        <ul><li>
                            ie., "What is the name of this plant?" when very few people would be able to recognize the plant and know the name.
                        </li></ul>
                    </li>
                    <li><b>The question is not based on the scene depicted in the image or the answer could not be provided correctly based on the image.</b>
                        <ul>
                            <li>
                                ie., "What is the brand of the soap?" when the brand name of the soap is only partially visible from the image.
                            </li>
                            <li>
                                ie., "What is the woman doing?" when there is no woman in the image.
                            </li>
                        </ul>
                    </li>
                </ul>
            </>
        )
    }
}

class ValidQuestionCharacteristics extends React.Component {
    render() {
        return (
            <>
                <ul className="mx-3" style={{ listStyleType: "disc" }}>
                    <li>The question is based on the scene depicted in the image.</li>
                    <li>Another person is likely to provide the same answer to the question.</li>
                    <li>The question makes sense for the image. An answer <b>can</b> be provided.</li>
                </ul>
            </>
        )
    }
}


export { InvalidQuestionCharacteristics, ValidQuestionCharacteristics }
