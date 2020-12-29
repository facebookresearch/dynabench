import React from "react";
import { Button, Container, Col } from "react-bootstrap";

const EducationPage = () => (
  <Container className="mb-5 pb-5">
    <Col className="m-auto" lg={9}>
      <div className="mb-5 text-center">
        <h1 className="my-4 pt-3">Education</h1>
        <h2 className="task-page-header d-block m-0 text-reset">
          Dynabench education is a free, online course, designed to advance AI research and learning.
          Natural language processing (NLP) models are known to be vulnerable to adversarial examples.
          Studying adversarial texts is an essential step to improve the robustness of NLP models.
        </h2>
        <br/><br/>
        <h2>
        Dynabench eLessons aim to make learning AI fun and easy by having games to fool the Model.
        Topics covered include the importance of dynamic adversarial benchmarking and benchmark datasets.
        In the practical session you get to enter adversarial examples to fool the NLP models.
        The model gets confused or misled into making wrong predictions based on the wording used.
        You get a badge as a reward for fooling the AI model. So dig in and learn NLP benchmarking today!
        </h2>
      </div>
     <div>
       <h3>Please click on this link to download slides:</h3>
     <a href="/slides.zip" download>Slides</a>
     <br/><br/>
     <h3>Please click on this link to download the lecture video:</h3>
     <a href="/lecture.zip" download>Lecture</a>
     <br/><br/>
     <h3>Please click on this link to download the practicals:</h3>
     <a href="/practicals.zip" download>Practicals</a>
     <br/><br/>
     </div>
    </Col>
  </Container>
);

export default EducationPage;
