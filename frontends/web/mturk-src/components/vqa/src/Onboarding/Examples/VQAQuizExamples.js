const creation_examples = {
  1: [
    {
      question: "Which woman looks older?",
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000171966.jpg",
      modelAns: "right",
      isModelCorrect: true,
      hint:
        "HINT: Look at their hair and facial features. Another person is likely going to agree.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000480890.jpg",
      question: "Where is the man staring?",
      modelAns: "at camera",
      isModelCorrect: true,
      hint:
        "HINT: You can assume that the man is aware that he is being photographed.",
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
        "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000037409.jpg",
      question: "Is Harley-Davidson the name of a motorcycle brand?",
      isModelCorrect: false,
      hint:
        "HINT: Although this can be inferred from the image there is no need to look at it to know this is true.",
      isAnswer: false,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000565797.jpg",
      question: "What is the brand of this car?",
      isModelCorrect: false,
      hint:
        "HINT: It is not possible to answer the question given that the image does not show enough information.",
      isAnswer: false,
    },
    {
      question: "How is the weather?",
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000482780.jpg",
      isModelCorrect: true,
      isAnswer: false,
      hint:
        "HINT: To answer this question you need to look at the image and another person is likely going to say 'cloudy'.",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000079841.jpg",
      question: "What direction are they going?",
      isModelCorrect: true,
      isAnswer: false,
      hint:
        "HINT: An answer to this question can be provided and it is likely going to be agreed by another person.",
    },
  ],
  2: [
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000122688.jpg",
      question: "According to the image, what time is it?",
      modelAns: "11",
      isModelCorrect: false,
      hint: "HINT: Look at the clock. It's 12:50.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000489369.jpg",
      question: "Is there a giraffe?",
      modelAns: "no",
      isModelCorrect: true,
      hint: "HINT: There is no giraffe in the image.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000384553.jpg",
      question: "Are the animals in the picure wet?",
      modelAns: "no",
      isModelCorrect: false,
      hint: "HINT: Animals are in a river.",
      isAnswer: true,
    },
    {
      question: "Are vegetables a healthy food?",
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000328757.jpg",
      isModelCorrect: false,
      isAnswer: false,
      hint:
        "HINT: The answer to this question is not affected by the situation in the image.",
    },
    {
      question: "What is the man doing?",
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000258900.jpg",
      isModelCorrect: true,
      isAnswer: false,
      hint:
        "HINT: It asks about an specific action. You must look at the image to get some context. The answer is likely unique and can be agreed by another person.",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000329753.jpg",
      question: "What are the people waiting for?",
      isModelCorrect: false,
      isAnswer: false,
      hint:
        "HINT: The image does not provide enough information to give a consistent answer to this question. If there is a bus stop on the image, then the question would be valid.",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000333848.jpg",
      question: "What breed is the dog?",
      isAnswer: false,
      isModelCorrect: false,
      hint:
        "HINT: This question is not ambiguous but it is likely that not a lot of people know the answer. Try to avoid very specific questions that require some specialized knowledge on the topic. Relying on external knowledge is fine, but remember: another person should be able to answer the question.",
    },
  ],
};

const validation_examples = {
  1: [
    {
      question: "Which woman looks older?",
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000171966.jpg",
      modelAns: "right",
      isModelCorrect: true,
      hint:
        "HINT: Look at their hair and facial features. Another person is likely going to agree.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000480890.jpg",
      question: "Where is the man staring?",
      modelAns: "at camera",
      isModelCorrect: true,
      hint:
        "HINT: You can assume that the man is aware that he is being photographed.",
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
        "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000037409.jpg",
      question: "Is Harley-Davidson the name of a motorcycle brand?",
      isModelCorrect: false,
      hint:
        "HINT: Although this can be inferred from the image there is no need to look at it to know this is true.",
      isAnswer: false,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000507795.jpg",
      question:
        "What direction are the stripes of the person with pink sleeves?",
      isModelCorrect: true,
      hint:
        "HINT: Although this can be inferred from the image. You have to find the stripes first. It may take some work, you should use the magnifier on every image.",
      isAnswer: false,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000322341.jpg",
      question: "Does the man at the train station have a hat on?",
      isModelCorrect: true,
      isAnswer: false,
      hint: `HINT: This is not super obvious. You'd need to use the magnifier to see that there is actually a man at the train station and he indeed looks like he has a hat on. Remember try to spend some time on each image to give them the benefit of the doubt.`,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000565797.jpg",
      question: "What is the brand of this car?",
      isModelCorrect: false,
      hint:
        "HINT: It is not possible to answer the question given that the image does not show enough information.",
      isAnswer: false,
    },
  ],
  2: [
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000305598.jpg",
      question: "Is the man wearing glasses who is watching the little girl?",
      modelAns: "no",
      isModelCorrect: false,
      hint: "HINT: Please use magnifier by hovering the mouse over the image!",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000163776.jpg",
      question: "What style are the shoes of the woman on the left?",
      modelAns: "sandals",
      isModelCorrect: true,
      hint:
        "HINT: The woman in black is on the left, she is wearing high heels sandals.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000274835.jpg",
      question: "What is the name of the potatoes in the picture?",
      modelAns: "potatoes",
      isModelCorrect: false,
      hint:
        "HINT: It looks like those potatos is called mashed potatos. Most people are likely going to say 'mashed potatoes' as the answer.",
      isAnswer: true,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000328757.jpg",
      question: "Are vegetables a healthy food?",
      isModelCorrect: false,
      isAnswer: false,
      hint:
        "HINT: The answer to this question is not affected by the situation in the image.",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000484597.jpg",
      question: "What is the second word above Crawfords?",
      isModelCorrect: true,
      isAnswer: false,
      hint:
        "HINT: The question is valid. To determine whether or not it is correct, please use magnifier to find the right answer. Remember, try to spend some time on each image based on the questions. Most questions are tricky!",
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000035287.jpg",
      question: "How many people are skateboarding?",
      isModelCorrect: true,
      hint: "HINT: You should be able to clearly see 3 people skateboarding.",
      isAnswer: false,
    },
    {
      imageUrl:
        "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000329753.jpg",
      question: "What are the people waiting for?",
      isModelCorrect: false,
      isAnswer: false,
      hint:
        "HINT: The image does not provide enough information to give a consistent answer to this question. If there is a bus stop on the image, then the question would be valid.",
    },
  ],
};

const VQAQuizExamples = (mode) => {
  if (mode === "creation") {
    return creation_examples;
  } else if (mode === "validation") {
    return validation_examples;
  }
};

export { VQAQuizExamples };
