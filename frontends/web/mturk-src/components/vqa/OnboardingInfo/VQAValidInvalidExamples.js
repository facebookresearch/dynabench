const VQAValidInvalidExamples = [
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000125542.jpg",
        question: "Do elephants live in the savannah?",
        isValid: false,
        explanation: "This question can be answered without looking at the image. Therefore, it is not a valid question."
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000370583.jpg",
        question: "How many people are visible?",
        isValid: false,
        explanation: "The question is hard to answer because what it is shown in the image is not enough to get a consistent result. Ask questions whose answers could be derived from the image."
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
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000333848.jpg",
        question: "What breed is the dog?",
        isValid: false,
        explanation: "This question is not ambiguous but it is likely that not a lot of people know the answer. Try to avoid very specific questions that require some specialized knowledge on the topic."
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000576597.jpg",
        question: "What country is the flag from?",
        modelAns: "usa",
        userFeedback: ["Incorrect", "England"],
        isValid: true,
        explanation: "This example requires two basic steps, the first one is the identification of a flag in the image and the second is the process to determine what country corresponds to that flag. In this case the AI was incorrect, so you are expected to enter the correct answer."
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000088527.jpg",
        question: "What type of tie is he wearing?",
        modelAns: "striped",
        userFeedback: ["Correct", null],
        isValid: true,
        explanation: "In this case the AI needs to look at the image and identify the tie. Then it has to characterize it. Other people would likely agree with the answer."
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000274422.jpg",
        question: "Does it appear to be winter in this photo?",
        modelAns: "no",
        userFeedback: ["Correct", null],
        isValid: true,
        explanation: "Here the AI needs to have a basic understanding about seasons. Based on the sunny weather and the fruits in the tree seen in the image a person would say that the season is not winter."
    },
    {
        imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000209374.jpg",
        question: "How many types of veggies are in the image?",
        modelAns: "2",
        userFeedback: ["Correct", null],
        isValid: true,
        explanation: "For these types of questions the answer will be a number. For this example the AI needs to classify the objects in the image. Although the vegetables at the bottom appear blurry it is possible to identify two different types of veggies."
    },
]

export { VQAValidInvalidExamples }
