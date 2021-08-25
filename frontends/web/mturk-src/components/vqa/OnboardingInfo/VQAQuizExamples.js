/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const VQAQuizExamples = {
  1: [
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000109816.jpg",
      question: "What is the guy in black holding in his hand?",
      modelAns: "guitar",
      isModelCorrect: true,
      hint: "HINT: The man is playing a video game called guitar hero.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000480890.jpg",
      question: "Where is the man staring?",
      modelAns: "at camera",
      isModelCorrect: true,
      hint: "HINT: You can assume that the man is aware that he is being photographed.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000462512.jpg",
      question: "Which way is the convertible turning?",
      modelAns: "left",
      isModelCorrect: true,
      hint: "HINT: The convertible is the black car.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000180098.jpg",
      question: "Is the bridge new or old?",
      modelAns: "old",
      isModelCorrect: true,
      hint: "HINT: Look at the rust on metal.",
      isAnswer: true,
    },
    {
      question: "How many sides has this triangle?",
      isModelCorrect: false,
      hint: "HINT: Does the number of sides of a triangle change?",
      isAnswer: false,
    },
    {
      question: "When did humans land on the moon?",
      isModelCorrect: false,
      hint: "HINT: Would this date change by any reason?",
      isAnswer: false,
    },
    {
      question: "Which toy is the smallest?",
      isModelCorrect: true,
      isAnswer: false,
      hint: "HINT: The question is referring to the toy in the image?",
    },
  ],
  2: [
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000131909.jpg",
      question: "How many people are in the picture?",
      modelAns: "11",
      isModelCorrect: false,
      hint: "HINT: There is a kid in front of the woman with the striped shirt.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000489369.jpg",
      question: "Is there a giraffe?",
      modelAns: "no",
      isModelCorrect: true,
      hint: "HINT: What isAnswer of animals are in the image?",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000005700.jpg",
      question: "Do you see a small red sign?",
      modelAns: "no",
      isModelCorrect: false,
      hint: "HINT: Look at the back of the train at the right.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000293793.jpg",
      question: "Is this meal being served outdoors?",
      modelAns: "no",
      isModelCorrect: true,
      hint: "HINT: Do you see something that indicates outdoors?",
      isAnswer: true,
    },
    {
      question: "What is the distance from London to Paris?",
      isModelCorrect: false,
      isAnswer: false,
      hint: "HINT: Does this distance depend on something going on in the image?",
    },
    {
      question: "What is the kid holding in her left hand?",
      isModelCorrect: true,
      isAnswer: false,
      hint: "HINT: You need to look at the image to get context.",
    },
    {
      question: "What is the mood of the person in the middle?",
      isModelCorrect: true,
      isAnswer: false,
      hint: "HINT: Look at the expressions of this person in the image.",
    },
  ],
};

export { VQAQuizExamples };
