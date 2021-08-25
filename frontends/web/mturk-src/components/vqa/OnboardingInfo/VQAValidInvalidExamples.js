/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const VQAValidInvalidExamples = {
  validExamples: [
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000283809.jpg",
      question: "Which remote is the biggest?",
      modelAns: "middle",
      userFeedback: ["Incorrect", "third from left to right"],
      explanation:
        "This example because requires multiple steps to get to the right answer. AI needs to identify which of the objects are remotes. Then it needs to select the biggest of them and find a way to refer to that specifc remote. The answer provided by the AI is not precise. You are expected to give a more specific answer.",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000088527.jpg",
      question: "What type of tie is he wearing?",
      modelAns: "striped",
      userFeedback: ["Correct", null],
      explanation:
        "In this case the AI needs to identify the tie. Then it has to analyze it and based on its characteristics it will assigned it inside a classification. The question is also clear in the sense that any other person would agree with the answer.",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000274422.jpg",
      question: "Does it appear to be winter in this photo?",
      modelAns: "no",
      userFeedback: ["Correct", null],
      explanation:
        "Here the AI needs to have a basic understandig about seasons. Based on the sunny weather and the fruits in the tree a person would say that the season is not winter.",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000209374.jpg",
      question: "How many types of veggies are in the image?",
      modelAns: "2",
      userFeedback: ["Correct", null],
      explanation:
        "For these types of questions the answer will be a number. For this example the AI needs to classify the objects in the image. Although the vegetables at the bottom appear blurry it is possible to identify two different typesof veggies.",
    },
  ],
  invalidExamples: [
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000520486.jpg",
      question: "Why is the woman carrying an umbrella?",
      explanation:
        "Questions must be answerable. In this case there is no woman carrying an umbrella so the  does not have an answer and, as a consequence, is not a valid question.",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000395456.jpg",
      question: "What are the spots on the floor?",
      explanation:
        "This question ambiguous. There is no clear and precise answer for this. Remember that your examples will be validated by other humans and they need to agree with your answers.",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000333848.jpg",
      question: "What breed is the dog?",
      explanation:
        "This question is not abiguous but it is likely that not a lot of people know the answer. Try to avoid very specific questions that require some specilized knowledge on the topic.",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000370583.jpg",
      question: "How many people are visible?",
      explanation:
        "The question is hard to answer because what it is shown in the image is not enough to get a consistent result. Ask questions whose answers could be derived from the image.",
    },
  ],
};

export { VQAValidInvalidExamples };
