/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const creation_examples = [
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000125542.jpg",
    question: "What is the capital of USA?",
    isValid: false,
    explanation:
      "This question can be answered without looking at the image. Therefore, it is not a valid question.",
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000520486.jpg",
    question: "Why is the woman carrying an umbrella?",
    isValid: false,
    explanation:
      "Questions must be answerable. In this case there is no woman carrying an umbrella so the question does not have an answer and, as a consequence, is not a valid question.",
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000395456.jpg",
    question: "What are the spots on the floor?",
    isValid: false,
    explanation:
      "This question is ambiguous. There is no clear and precise answer for this. Remember that your examples will be validated by other humans and they need to agree with your answers.",
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000202153.jpg",
    question: "What is the name of the street sign shown in this image?",
    modelAns: "Victoria St.",
    userFeedback: ["Correct", null],
    isValid: true,
    explanation:
      "The question is valid because it is specific and another person is likely going to agree with the answer.",
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000081922.jpg",
    question: "How many cars are in the image?",
    isValid: false,
    explanation:
      "The image is not clear enough to give an answer to which most people will agree with.",
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000131909.jpg",
    question: "What is the profession of the man?",
    isValid: false,
    explanation:
      "The question is not valid because it does not specify which man it is talking about. 'What is the profession of the man to the right?' is also invalid because there is nothing in the image that suggests what type of profession the man has.",
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000576597.jpg",
    question: "What country is the flag from?",
    modelAns: "usa",
    userFeedback: ["Incorrect", "United Kingdom"],
    isValid: true,
    explanation: `This example requires two basic steps, the first one is the identification of a flag in the image and the second is the process to determine what country corresponds to that flag. In this case the AI was incorrect, so you are expected to enter the correct answer.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000088527.jpg",
    question: "What is the pattern on the tie he is wearing?",
    modelAns: "striped",
    userFeedback: ["Correct", null],
    isValid: true,
    explanation: `In this case the AI needs to look at the image and identify the tie. Then it has to characterize it. Other people would likely agree with the answer.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000317606.jpg",
    question: "How is this coffee served?",
    modelAns: "on plate",
    userFeedback: ["Correct", null],
    isValid: true,
    explanation: `The question could make sense for both 'on plate' and 'black' to be the answer. Here the answer is technically correct. So even though you might not be expecting it, when the model's answer is sensible to the image you should consider the model as correct.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000209374.jpg",
    question: "How many types of veggies are in the image?",
    modelAns: "2",
    userFeedback: ["Correct", null],
    isValid: true,
    explanation: `For these types of questions the answer will be a number. For this example the AI needs to classify the objects in the image. Although the vegetables at the bottom appear blurry it is possible to identify two different types of veggies.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000274422.jpg",
    question: "Does it appear to be winter in this photo?",
    modelAns: "no",
    userFeedback: ["Correct", null],
    isValid: true,
    explanation: `Here the AI needs to have a basic understanding about seasons. Based on the sunny weather and the fruits in the tree seen in the image a person would say that the season is not winter.`,
  },
];

const validation_examples = [
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000125542.jpg",
    question: "What is the capital of USA?",
    isValid: false,
    explanation:
      "This question can be answered without looking at the image. Therefore, it is not a valid question.",
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000375306.jpg",
    question: "What is the woman people at?",
    isValid: false,
    explanation: `This question seems to not make sense in English. If you think most people will be confused by the question, then it is invalid.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000081922.jpg",
    question: "How many cars are in the image?",
    isValid: false,
    explanation:
      "The image is not clear enough to give an answer to which most people will agree with.",
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000274422.jpg",
    question: "Does it appear to be winter in this photo?",
    modelAns: "no",
    userFeedback: ["Correct", null],
    isValid: true,
    explanation: `In this case having a basic undestanding about seasons is needed to answer correctly. Based on the sunny weather and the fruits in the tree seen in the image a person would say that the season is not winter.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000576597.jpg",
    question: "What country is the flag from?",
    modelAns: "usa",
    userFeedback: ["Incorrect", "United Kingdom"],
    isValid: true,
    explanation: `This example requires two basic steps, the first one is the identification of a flag in the image and the second is the process to determine what country corresponds to that flag. In this case the answer was incorrect, so you are expected to enter the correct answer.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000088527.jpg",
    question: "What is the pattern on the tie he is wearing?",
    modelAns: "striped",
    userFeedback: ["Correct", null],
    isValid: true,
    explanation: `In this case looking at the image is needed to identify the tie. Then it has to characterize it. Other people would likely agree with the answer.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000209374.jpg",
    question: "How many types of veggies are in the image?",
    modelAns: "2",
    userFeedback: ["Correct", null],
    isValid: true,
    explanation: `For this example classifying the objects in the image is needed to get the correct answer. Although the vegetables at the bottom appear blurry it is possible to identify two different types of veggies.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000203697.jpg",
    question: "How many watches are in the picture?",
    modelAns: "2",
    userFeedback: ["Incorrect", null],
    isValid: true,
    explanation: `You should always aim to give the questions the benefit of the doubt. After all, they are rated by people who are just like you. We encourage that you spend some time assuming that there is some people wearing a watch somewhere on the image, you can choose to use the magnifier feature by simply hover over the image to see a zoomed in version. We only see one person wearing a watch (please try to find it!), so the answer is incorrect.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000345888.jpg",
    question: "What type of connection is needed to use the mouse?",
    modelAns: "plastic",
    userFeedback: ["Incorrect", null],
    isValid: true,
    explanation: `In this case, you can imagine the person asking this question is trying to get the answer 'USB'. However, the answer 'plastic' here is not the type of the connection, but the type of material. So the answer is incorrect.`,
  },
  {
    imageUrl:
      "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000078067.jpg",
    question:
      "What is the word embossed in the clamp closest to the Broadway street sign?",
    modelAns: "broadway",
    userFeedback: ["Incorrect", null],
    isValid: true,
    explanation: `This question is a bit tricky. (You will find most questions are tricky.) It does take a person a while to figure out the answer. So please do spend some time on each image and make sure you give them justice by investigating them with the image magnifier (just hover over the image)! Here the correct answer to the question is: bottom. (see if you can find it!)`,
  },
];

const getVQAValidInvalidExamples = (mode) => {
  if (mode === "creation") {
    return creation_examples;
  } else if (mode === "validation") {
    return validation_examples;
  }
};

export default getVQAValidInvalidExamples;
