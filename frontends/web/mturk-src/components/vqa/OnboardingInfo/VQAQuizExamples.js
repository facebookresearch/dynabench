const VQAQuizExamples = {
    1:  [
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000202153.jpg",
                question: "What is the name of the street?",
                modelAns: "broadway",
                isModelCorrect: false,
                hint: "HINT: Look at the green sign in the upper right corner of the image.",
                isAnswer: true
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000480890.jpg",
                question: "Where is the man staring?",
                modelAns: "at camera",
                isModelCorrect: true,
                hint: "HINT: You can assume that the man is aware that he is being photographed.",
                isAnswer: true
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000462512.jpg",
                question: "Which way is the convertible turning?",
                modelAns: "left",
                isModelCorrect: true,
                hint: "HINT: The convertible is the black car.",
                isAnswer: true
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000037409.jpg",
                question: "Is Harley-Davidson the name of a motorcycle brand?",
                isModelCorrect: false,
                hint: "HINT: Although this can be inferred from the image there is no need to look at it to know this is true.",
                isAnswer: false
            },
            {
                question: "What is the mood of the girl?",
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000446014.jpg",
                isModelCorrect: true,
                hint: "HINT: The question is asking about the girl that appears in the image.",
                isAnswer: false
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000061181.jpg",
                question: "Is overpopulation a problem for the environment?",
                isModelCorrect: true,
                isAnswer: false,
                hint: "HINT: This question can be answered without analyzing the image."
            },
        ],
    2:
        [
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000122688.jpg",
                question: "According to the image, what time is it?",
                modelAns: "11",
                isModelCorrect: false,
                hint: "HINT: Look at the clock. It's 12:50.",
                isAnswer: true
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000489369.jpg",
                question: "Is there a giraffe?",
                modelAns: "no",
                isModelCorrect: true,
                hint: "HINT: There is no giraffe in the image.",
                isAnswer: true
            },
            {
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000384553.jpg",
                question: "Are the animals in the picure wet?",
                modelAns: "no",
                isModelCorrect: false,
                hint: "HINT: Animals are in a river.",
                isAnswer: true
            },
            {
                question: "Are vegetables a healthy food?",
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/val2014/COCO_val2014_000000328757.jpg",
                isModelCorrect: false,
                isAnswer: false,
                hint: "HINT: The answer to this question is not affected by the situation in the image.",
            },
            {
                question: "What is the man doing?",
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/test2015/COCO_test2015_000000258900.jpg",
                isModelCorrect: true,
                isAnswer: false,
                hint: "HINT: It asks about an specific action. You must look at the image to get some context."
            },
            {
                question: "How is the weather?",
                imageUrl: "https://dl.fbaipublicfiles.com/dynabench/coco/train2014/COCO_train2014_000000482780.jpg",
                isModelCorrect: true,
                isAnswer: false,
                hint: "HINT: To answer this question you need to know what specific situation the question is making reference."
            },
        ]
    }

export { VQAQuizExamples }
