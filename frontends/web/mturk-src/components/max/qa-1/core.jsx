/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Row, Container, Button, InputGroup } from "react-bootstrap";

import { CreateInterface } from "./CreateInterface.js";
import {
  CreateInterfaceOnboardingAns,
  CreateInterfaceOnboardingQues,
} from "./CreateInterfaceOnboarding.js";

import "./CreateInterface.css";

class MaxQATaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
        <h1>Ask Questions and Select Answers for Reading Comprehension</h1>
        <p>
          In this task, you will be tasked with asking questions about a passage
          and selecting the correct answer from the passage for a Reading
          Comprehension task.
        </p>
      </>
    );
  }
}

class MaxQATaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
    this.completeOnboarding = this.completeOnboarding.bind(this);
    this.state = {
      showOnboardingSubmit: false,
      onboardingStep: 0,
      showNext: true,
      showPrevious: false,
    };
    this.nextOnboarding = this.nextOnboarding.bind(this);
    this.showOnboardingSubmit = this.showOnboardingSubmit.bind(this);
    this.showOnboardingPrevious = this.showOnboardingPrevious.bind(this);
    this.previousOnboarding = this.previousOnboarding.bind(this);
  }
  nextOnboarding() {
    this.setState({ onboardingStep: this.state.onboardingStep + 1 });
    this.showOnboardingPrevious();
    if (this.state.onboardingStep == 9) {
      this.showOnboardingSubmit();
    }
  }
  previousOnboarding() {
    this.setState({
      onboardingStep: this.state.onboardingStep - 1,
      showOnboardingSubmit: false,
      showNext: true,
    });
  }
  completeOnboarding() {
    this.props.onSubmit({ success: true }); // if they failed, set to false
  }
  showOnboardingSubmit() {
    this.setState({ showOnboardingSubmit: true, showNext: false });
  }
  showOnboardingPrevious() {
    this.setState({ showPrevious: true });
  }

  render() {
    return (
      <>
        <Container>
          <Row>
            <h1>Onboarding</h1>
          </Row>
          {this.state.onboardingStep == 0 && (
            <Row>
              {" "}
              <TaskOnboardingInstructions />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 1 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingAns
                api={this.api}
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 2 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingAns
                api={this.api}
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 3 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingAns
                api={this.api}
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 4 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingAns
                api={this.api}
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 5 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingAns
                api={this.api}
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 6 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingQues
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 7 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingQues
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 8 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingQues
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 9 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingQues
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {/* {this.state.onboardingStep==10 && <Row> <CreateInterfaceOnboardingStep10 /> </Row>} */}
          {this.state.showOnboardingSubmit && (
            <Row>
              {" "}
              <TaskOnboardingCompletedInstructions />{" "}
            </Row>
          )}
          <Row>
            <InputGroup>
              {this.state.onboardingStep > 0 && (
                <>
                  <Button
                    className="btn btn-secondary mt-3"
                    onClick={this.previousOnboarding}
                  >
                    Back
                  </Button>{" "}
                  &nbsp; &nbsp;{" "}
                </>
              )}
              {this.state.showNext && (
                <Button
                  className="btn btn-primary mt-3"
                  onClick={this.nextOnboarding}
                >
                  Next
                </Button>
              )}
              {this.state.showOnboardingSubmit && (
                <Button
                  className="btn btn-primary btn-success mt-3"
                  onClick={this.completeOnboarding}
                >
                  Complete Onboarding
                </Button>
              )}
            </InputGroup>
          </Row>
        </Container>
      </>
    );
  }
}

class TaskOnboardingInstructions extends React.Component {
  render() {
    return (
      <>
        <br />
        <small>
          In this HIT, you will be given a passage from Wikipedia. Your task is 
          to ask questions about the passage and select the correct answer.
          <br />
          <br />
          <strong>Onboarding:</strong> During the onboarding phase, you will be
          able to familiarize yourself with the annotation platform.
          <br />
          <br />
          (1) <strong>First,</strong> we will show you a passage and five
          questions and ask you to highlight the right answer, which is a span of text
          from within the passage.
          <br />
          <br />
          (2) <strong>Following that,</strong> you will be presented with a
          passage and four answers and you will be required to write one
          question for each highlighted answer.
          <br />
          <br />
          (3) <strong>In the last step,</strong> you will be provided with a
          passage and you will be required to:
          <ul>
            <li key="1">
              <strong>write a question</strong> — whose answer is contained in
              the passage.
            </li>
            <li key="2">
              <strong>highlight the answer</strong> — a span of text from the
              passage.
            </li>
          </ul>
          Additionally, when selecting an answer, please ensure that the
          selected answer is unambiguous — a reader shown the same question and
          passage should select the same (or highly overlapping) answer.
          <br />
          <br />
          <i>
            Submissions will be audited so do not try to cheat by writing
            incoherent questions or choosing incorrect answers.
          </i>
          <br />
          <br />
          <strong>
            Workers who successfully complete onboarding will be presented with
            the main task.
          </strong>{" "}
          This platform is <b>not compatible</b> with tablets or mobile phones.
        </small>
      </>
    );
  }
}

class TaskOnboardingCompletedInstructions extends React.Component {
  render() {
    return (
      <>
        <br />
        <p>
          <strong>Congratulations on completing onboarding!</strong> We hope you
          are now familiar with the platform. Before you click on Complete
          Onboarding, here is some general housekeeping:
        </p>
        <ul>
          <li key="1">
            <strong>
              The instructions for the downstream task are different than the
              onboarding. Please read them carefully!
            </strong>
          </li>
          <li key="2">
            Please email us at{" "}
            <a href="mailto:NoahTurkProject.1032@gmail.com" target="_blank">
              NoahTurkProject.1032@gmail.com
            </a>{" "}
            if you do not understand any parts of the instructions or if there
            is anything else that we can help with. We will try to respond as
            quickly as possible.
          </li>
          <li key="3">
            If, upon clicking "Complete Onboarding", the interface does not
            re-route you to the main task, please refresh your page.
          </li>
        </ul>
        <p>
          We appreciate your work and are eagerly looking forward to reviewing
          it!
        </p>
      </>
    );
  }
}

class TaskModelInstructions extends React.Component {
  constructor(props) {
    super(props);
    this.experiment_mode = props.experiment_mode;
  }
  render() {
    return (
      <>
        <div
          className="card-body"
          style={{ backgroundColor: "#f5f5f5", borderRadius: "0 0 4px 4px" }}
        >
          <div className="text-left" style={{ marginBottom: "16px" }}>
            <h4>Ask Questions and select the Answer from the Passage</h4>
            <p>
              You will be given a <em>passage</em> from Wikipedia. You will need
              to ask <em>questions</em> and highlight the correct{" "}
              <em>answers</em> from the passage.
            </p>
            {this.experiment_mode["adversary"] === "none" ? null : (
              <p>
                An AI will then try to answer your question. If it answers
                correctly, the AI wins, you lose - and you have to try again. If
                it gets the answer wrong, you've <strong>beaten the AI</strong>{" "}
                and will receive a bonus for each question that the AI{" "}
                <strong>
                  fails to answer correctly and another human validator manages
                  to answer correctly
                </strong>
              </p>
            )}

            <strong>You MUST ensure that:</strong>
            <ol>
              <li key="1">
                Questions are <b>well formed</b> and <b>spelt correctly</b>
              </li>
              <li key="2">
                Questions can be correctly answered from a span in the passage
                and{" "}
                <b>
                  DO NOT require a <em>Yes</em> or <em>No</em> answer
                </b>
              </li>
              <li key="3">
                Answers are <b>correct</b> and{" "}
                <b>the shortest span which answers the question is selected</b>
              </li>
              <li key="4">
                <b>DO NOT</b> ask questions about passage structure such as
                "What is the title?"
              </li>
              <li key="5">
                <b>DO NOT</b> use the same answer for more than two questions.
              </li>
            </ol>
          </div>

          <strong>Example:</strong>
          <div className="context-text">
            Tesla gained experience in telephony and electrical engineering
            before emigrating to the United States in 1884 to work for{" "}
            <span className="answer-phrase">Thomas Edison</span> in New York
            City. He soon struck out on his own with financial backers, setting
            up laboratories and companies to develop a range of electrical
            devices. His patented AC induction motor and transformer were
            licensed by George Westinghouse, who also hired Tesla for a short
            time as a consultant. His work in the formative years of electric
            power development was involved in a corporate alternating
            current/direct current "War of Currents" as well as various patent
            battles.
          </div>
          <p>
            <b>Question:</b> Who did Tesla join upon moving to the US?
            <br />
            <b>Answer:</b>{" "}
            <em>
              [select the answer from the passage as shown above] = Thomas
              Edison
            </em>
            {this.experiment_mode["adversary"] === "none" ? null : (
              <>
                <b>AI Answer:</b> <em>George Westinghouse</em>
                <br />
                <b>Outcome:</b> <em>YOU WIN!</em>
              </>
            )}
            <br />
          </p>

          <p className="block-text">
            Select the answer from the passage by highlighting{" "}
            <b>the shortest span of the passage that answers the question.</b>
          </p>
          <hr />

          <strong>
            Examples of <span className="ans-good">Good</span> and{" "}
            <span className="ans-bad">Bad</span> Answers
          </strong>
          <p className="block-text">
            <b>Q:</b> Who did Tesla join upon moving to the US?
            <br />
            <b>A:</b>{" "}
            <em>
              <span className="ans-good">Thomas Edison</span> |{" "}
              <span className="ans-bad">Edison</span> (not specific enough) |{" "}
              <span className="ans-bad">to work for Thomas Edison</span> (not
              the shortest span which correctly answers the question)
            </em>
            <br />
            <b>Q:</b> Who did Tesla gain experience in before working for
            Edison?
            <br />
            <b>A:</b>{" "}
            <em>
              <span className="ans-good">
                telephony and electrical engineering
              </span>{" "}
              | <span className="ans-bad">telephony</span> (not specific enough)
              | <span className="ans-bad">electrical engineering</span> (not
              specific enough) |{" "}
              <span className="ans-bad">
                gained experience in telephony and electrical engineering
              </span>{" "}
              (not the shortest span which correctly answers the question)
            </em>
            <br />
            <b>Q:</b> In which years of electric power development was his work
            involved in the "War of Currents"?
            <br />
            <b>A:</b>{" "}
            <em>
              <span className="ans-good">formative</span> |{" "}
              <span className="ans-bad">formative years</span> (do not include
              the units of measure (years) if they are mentioned in the question
            </em>
            <br />
            <b>Q:</b> In which period of electric power development was his work
            involved in the "War of Currents"?
            <br />
            <b>A:</b>{" "}
            <em>
              <span className="ans-good">formative years</span> |{" "}
              <span className="ans-bad">formative</span> (DO include the units
              of measure (years) if they are NOT mentioned in the question
            </em>
            <br />
          </p>

          <strong>
            Examples of <span className="ans-bad">Bad</span> Questions
          </strong>
          <p className="block-text">
            <b>Q:</b>{" "}
            <span className="ans-bad">
              What is something that Tesla patented?
            </span>
            <br />
            <b>Reason:</b>{" "}
            <em>
              Question has multiple valid answers. Only ask questions which can
              have one correct answer.
            </em>
            <br />
            <b>Q:</b>{" "}
            <span className="ans-bad">
              What is a place where experiments are carried out called?
            </span>
            <br />
            <b>Reason:</b>{" "}
            <em>
              Question relies solely on external knowledge which cannot be
              inferred from the passage.
            </em>
            <br />
            <b>Q:</b>{" "}
            <span className="ans-bad">Was Tesla experienced in telephony?</span>
            <br />
            <b>Reason:</b> <em>Question requires a Yes or No answer.</em>
            <br />
          </p>

          <hr />

          <small>
            <p className="block-text">
              By answering the following questions, you are participating in a
              research study. If you have any questions or require further
              clarification of the instructions, please contact us at{" "}
              <a href="mailto:NoahTurkProject.1032@gmail.com" target="_blank">
                NoahTurkProject.1032@gmail.com
              </a>
              . You must be at least 18 years old to participate. Your
              participation in this research is voluntary. You may decline to
              answer any or all of the following questions. You may decline
              further participation, at any time, without adverse consequences.
              Your anonymity is assured; the researchers who have requested your
              participation will not receive any personal information about you.
            </p>
          </small>
        </div>
      </>
    );
  }
}

class ExperimentInstructions extends React.Component {
  constructor(props) {
    super(props);
    this.experiment_mode = props.experiment_mode;
    this.state = { showInstructions: false };
    this.showInstructions = this.showInstructions.bind(this);

    if (this.experiment_mode["answerSelect"] === "none") {
      if (this.experiment_mode["adversary"] === "none") {
        this.task_instructions = (
          <>
            Read the passage below carefully, then ask a question and select the
            correct answer from within the passage by highlighting it, then
            click the <i>"Submit Question"</i> button.
          </>
        );
      } else {
        if (this.experiment_mode["generator"] === "none") {
          this.task_instructions = (
            <>
              Read the passage below carefully, then ask a question and select
              the correct answer from within the passage by highlighting it.
              When you click the <i>"Submit Question"</i> button, an AI will try
              to answer your question. Your challenge is to try to ask questions
              that the AI fails to answer correctly, but another human would
              answer correctly.
            </>
          );
        } else {
          this.task_instructions = (
            <>
              Read the passage below carefully, then select a span of text from
              the passage that you think could be a good answer, and click the{" "}
              <b>
                <i>"Generate Question"</i>
              </b>{" "}
              button. A{" "}
              <b>generative AI assistant will write a question to help you</b>.
              The task is to modify the question and/or answer to ensure that
              they are correct. You can also modify the question to make it more
              difficult for the AI to answer. If you don't like the generated
              example, just click <i>"Generate Question"</i> again to get a new
              suggestion. When you click the <i>"Submit Question"</i> button,
              the question-answering AI will provide an answer. Your challenge
              is to generate questions that this AI fails to answer correctly,
              but that another human would answer correctly.
            </>
          );
        }
      }
    } else {
      this.task_instructions = (
        <>
          You will be provided with a passage, and a question and answer about
          the passage. The task is to modify the question and/or answer to
          ensure that they are correct. You can also modify the question to make
          it more difficult for the AI to answer. When you click <i>"Submit
          Question"</i>, the question-answering AI will provide an answer. Your
          challenge is to generate questions that this AI fails to answer
          correctly, but that another human would answer correctly.
        </>
      );
    }
  }
  showInstructions() {
    this.setState({ showInstructions: !this.state.showInstructions });
  }
  render() {
    return (
      <Container>
        <Row>
          <div
            className="card-header text-white py-2"
            style={{
              backgroundColor: "#007bff",
              borderColor: "#007bff",
              width: "100%",
              borderRadius: "0 0 4px 4px",
              cursor: "pointer",
            }}
            onClick={this.showInstructions}
          >
            <span style={{ fontWeight: "bold" }}>Instructions</span>&nbsp;
            (Click to expand)
          </div>
        </Row>
        {this.state.showInstructions && (
          <Row>
            <TaskModelInstructions experiment_mode={this.experiment_mode} />
          </Row>
        )}
        <Row>
          <h4 className="mt-3">
            {this.experiment_mode["adversary"] === "none" ? (
              <>Ask Questions and select the Answer from the Passage</>
            ) : (
              <>
                Can you ask Questions that fool the AI into giving the wrong
                answer?
              </>
            )}
          </h4>

          <p>
            {this.task_instructions} Kindly refer to{" "}
            <a href="#" onClick={this.showInstructions}>
              the instructions
            </a>
            .
          </p>

          {this.experiment_mode["adversary"] === "none" ? null : (
            <small className="mb-3">
              <b>Note:</b> you will earn an <b>additional $0.50 BONUS*</b> for
              every question that <b>beats the AI</b>, abides by the
              requirements specified in the instructions above, and is
              successfully validated by other human annotators. This means that
              you could potentially earn <b>an additional $2.50 per HIT!</b>
            </small>
          )}
        </Row>
      </Container>
    );
  }
}

class MaxQATaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.model_names = ["none", "electra-synqa"];
    this.model_urls = [
      "https://obws766r82.execute-api.us-west-1.amazonaws.com/predict?model=ts1626399549-electra-synqa",
      "https://obws766r82.execute-api.us-west-1.amazonaws.com/predict?model=ts1626399549-electra-synqa",
    ];
    this.generator_names = [
      "qgen_dcombined",
      "qgen_squad1",
      "qgen_dcombined_plus_squad_10k",
    ];
    this.generator_urls = [
      "https://obws766r82.execute-api.us-west-1.amazonaws.com/predict?model=qagen-r3-1",
      "https://obws766r82.execute-api.us-west-1.amazonaws.com/predict?model=qagen-r3-2",
      "https://obws766r82.execute-api.us-west-1.amazonaws.com/predict?model=qagen-r3-3",
      // "http://0.0.0.0:8097/cce63f4d8238fc8061a2e3a268afe1c14c0e2135580bc1680aec62dc20f68e81",
    ];
    this.experiment_modes = [
      // ==========
      // Standard SQuAD
      // 0: no adversary and no generator
      {
        id: 0,
        adversary: "none",
        generator: "none",
        filterMode: "",
        answerSelect: "none",
      },
      // ==========
      // Investigating generative-assistance in a non-adversarial setting
      // 1: : no adversary, squad generator + no filter
      {
        id: 1,
        adversary: "none",
        generator: "qgen_squad1",
        filterMode: "",
        answerSelect: "none",
      },
      // 2: no adversary, squad generator + adversarial sampler
      {
        id: 2,
        adversary: "none",
        generator: "qgen_squad1",
        filterMode: "adversarial",
        answerSelect: "none",
      },
      // 3: no adversary, squad generator + uncertainty sampler
      {
        id: 3,
        adversary: "none",
        generator: "qgen_squad1",
        filterMode: "uncertain",
        answerSelect: "none",
      },
      // ==========
      // 4: no generator (standard adversarial annoation)
      {
        id: 4,
        adversary: "electra-synqa",
        generator: "none",
        filterMode: "",
        answerSelect: "none",
      },      
      // 5: squad generator + no filter
      {
        id: 5,
        adversary: "electra-synqa",
        generator: "qgen_squad1",
        filterMode: "",
        answerSelect: "none",
      },
      // 6: adversarial generator + no filter
      {
        id: 6,
        adversary: "electra-synqa",
        generator: "qgen_dcombined",
        filterMode: "",
        answerSelect: "none",
      },
      // 7: combined generator + no filter
      {
        id: 7,
        adversary: "electra-synqa",
        generator: "qgen_dcombined_plus_squad_10k",
        filterMode: "",
        answerSelect: "none",
      },
      // 8: squad generator + adversarial sampler
      {
        id: 8,
        adversary: "electra-synqa",
        generator: "qgen_squad1",
        filterMode: "adversarial",
        answerSelect: "none",
      },
      // 9: adversarial generator + adversarial sampler
      {
        id: 9,
        adversary: "electra-synqa",
        generator: "qgen_dcombined",
        filterMode: "adversarial",
        answerSelect: "none",
      },
      // 10: combined generator + adversarial sampler
      {
        id: 10,
        adversary: "electra-synqa",
        generator: "qgen_dcombined_plus_squad_10k",
        filterMode: "adversarial",
        answerSelect: "none",
      },
      // 11: squad generator + uncertainty sampler
      {
        id: 11,
        adversary: "electra-synqa",
        generator: "qgen_squad1",
        filterMode: "uncertain",
        answerSelect: "none",
      },
      // 12: adversarial generator + uncertainty sampler
      {
        id: 12,
        adversary: "electra-synqa",
        generator: "qgen_dcombined",
        filterMode: "uncertain",
        answerSelect: "none",
      },
      // 13: combined generator + uncertainty sampler
      {
        id: 13,
        adversary: "electra-synqa",
        generator: "qgen_dcombined_plus_squad_10k",
        filterMode: "uncertain",
        answerSelect: "none",
      },
      // ==========
      // 14: validation only (generate answer and question): combined generator
      {
        id: 14,
        adversary: "electra-synqa",
        generator: "qgen_dcombined_plus_squad_10k",
        filterMode: "",
        answerSelect: "enabled",
      },
      // 15: validation only: adversarial generator
      {
        id: 15,
        adversary: "electra-synqa",
        generator: "qgen_dcombined",
        filterMode: "",
        answerSelect: "enabled",
      },

      // 16: validation only: combined generator + adversarial sampler
      {
        id: 16,
        adversary: "electra-synqa",
        generator: "qgen_dcombined_plus_squad_10k",
        filterMode: "adversarial",
        answerSelect: "enabled",
      },
      // 17: validation only: adversarial generator + adversarial sampler
      {
        id: 17,
        adversary: "electra-synqa",
        generator: "qgen_dcombined",
        filterMode: "adversarial",
        answerSelect: "enabled",
      },

      // 18: validation only: combined generator + uncertain sampler
      {
        id: 18,
        adversary: "electra-synqa",
        generator: "qgen_dcombined_plus_squad_10k",
        filterMode: "uncertain",
        answerSelect: "enabled",
      },
      // 19: validation only: adversarial generator + uncertain sampler
      {
        id: 19,
        adversary: "electra-synqa",
        generator: "qgen_dcombined",
        filterMode: "uncertain",
        answerSelect: "enabled",
      },
    ];
  }

  render() {
    // console.log(this.props);
    var mephistoIdCode = this.props.mephistoWorkerId
      .toString()
      .split("")
      .map((x) => x.charCodeAt(0))
      .reduce((a, b) => a + b);


    // Check validity of all experiment modes
    this.experiment_modes.forEach((tmp_mode) => {
      if (!(tmp_mode.hasOwnProperty('id') && tmp_mode.hasOwnProperty('adversary') && tmp_mode.hasOwnProperty('generator') && tmp_mode.hasOwnProperty('filterMode') && tmp_mode.hasOwnProperty('answerSelect'))) {
        throw 'INVALID EXPERIMENT MODE ' + tmp_mode["id"].toString();
      }
    });

    var num_experiments = this.experiment_modes.length; // 20
    var experiment_mode_id = mephistoIdCode % num_experiments;
    // ======================================================================================
    // var experiment_mode_id = 14; // TODO: DISABLE BEFORE LAUNCH
    // ======================================================================================

    var experiment_mode = this.experiment_modes[experiment_mode_id];

    console.log(
      "You are running experiment mode ID: " +
        experiment_mode_id +
        ". There are " +
        num_experiments + 
        " experiments."
    );
    console.log(experiment_mode);

    var model_name = experiment_mode["adversary"];
    var model_id = this.model_names.indexOf(model_name);
    if (model_id >= 0) {
      var model_url = this.model_urls[model_id];
    } else {
      var model_url = "";
    }
    console.log(
      "QA model: " + model_name + " (" + model_id + ") at URL " + model_url
    );

    var generator_name = experiment_mode["generator"];
    var generator_id = this.generator_names.indexOf(generator_name);
    if (generator_id >= 0) {
      var generator_url = this.generator_urls[generator_id];
    } else {
      var generator_url = "";
    }
    console.log(
      "Generator: " +
        generator_name +
        " (" +
        generator_id +
        ") at URL " +
        generator_url
    );

    return (
      <>
        <ExperimentInstructions experiment_mode={experiment_mode} />
        <CreateInterface
          api={this.api}
          model_name={model_name}
          model_url={model_url}
          generator_name={generator_name}
          generator_url={generator_url}
          experiment_mode={experiment_mode}
          {...this.props}
        />
      </>
    );
  }
}

export { MaxQATaskPreview, MaxQATaskOnboarder, MaxQATaskMain };
