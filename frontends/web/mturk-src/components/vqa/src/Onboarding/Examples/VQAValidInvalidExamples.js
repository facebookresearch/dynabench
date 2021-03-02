const getVQAValidInvalidExamples = (mode) => [
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000125542.jpg",
        question: "What is the capital of USA?",
        isValid: false,
        explanation: "This question can be answered without looking at the image. Therefore, it is not a valid question."
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000520486.jpg",
        question: "Why is the woman carrying an umbrella?",
        isValid: false,
        explanation: "Questions must be answerable. In this case there is no woman carrying an umbrella so the question does not have an answer and, as a consequence, is not a valid question."
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000395456.jpg",
        question: "What are the spots on the floor?",
        isValid: false,
        explanation: "This question is ambiguous. There is no clear and precise answer for this. Remember that your examples will be validated by other humans and they need to agree with your answers."
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000202153.jpg",
        question: "What is the name of the street sign shown in this image?",
        modelAns: "Victoria St.",
        userFeedback: ["Correct", null],
        isValid: true,
        explanation: "The question is valid because it is specific and another person is likely going to agree with the answer.",
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000081922.jpg",
        question: "How many cars are in the image?",
        isValid: false,
        explanation: "The image is not clear enough to give an answer to which most people will agree with."
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000131909.jpg",
        question: "What is the profession of the man?",
        isValid: false,
        explanation: "The question is not valid because it does not specify which man it is talking about. 'What is the profession of the man to the right?' is also invalid because there is nothing in the image that suggests what type of profession the man has."
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000576597.jpg",
        question: "What country is the flag from?",
        modelAns: "usa",
        userFeedback: ["Incorrect", "United Kingdom"],
        isValid: true,
        explanation: `This example requires two basic steps, the first one is the identification of a flag in the image and the second is the process to determine what country corresponds to that flag. In this case the ${mode === "creation" ? "AI" : "answer"} was incorrect, so you are expected to enter the correct answer.`
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000088527.jpg",
        question: "What is the pattern on the tie he is wearing?",
        modelAns: "striped",
        userFeedback: ["Correct", null],
        isValid: true,
        explanation: `In this case ${mode === "creation" ? "the AI needs to look at the image and" : "looking at the image is needed to"} identify the tie. Then it has to characterize it. Other people would likely agree with the answer.`
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000274422.jpg",
        question: "Does it appear to be winter in this photo?",
        modelAns: "no",
        userFeedback: ["Correct", null],
        isValid: true,
        explanation: `${mode === "creation" ? "Here the AI needs to have a basic understanding about seasons" : "In this case having a basic undestanding about seasons is needed to answer correctly"}. Based on the sunny weather and the fruits in the tree seen in the image a person would say that the season is not winter.`
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000209374.jpg",
        question: "How many types of veggies are in the image?",
        modelAns: "2",
        userFeedback: ["Correct", null],
        isValid: true,
        explanation: `For these types of questions the answer will be a number. For this example ${mode === "creation" ? "the AI needs to classify the objects in the image" : "classifying the objects in the image is needed to get the correct answer"}. Although the vegetables at the bottom appear blurry it is possible to identify two different types of veggies.`
    },
]


export default getVQAValidInvalidExamples
