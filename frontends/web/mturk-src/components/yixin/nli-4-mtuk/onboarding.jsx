import React from "react";
import { Button, Card } from "react-bootstrap";
import { ExampleGoodCards } from "./GoodExampleCards.jsx";

class ExampleCard extends React.Component {
  constructor(props) {
    super(props);
  }

  clickSelection(selection_id, e) {
    this.props.clickSelection(selection_id, e);
  }

  render() {
    const tip_alert = this.props.show_tip ? (
      <div className="alert alert-warning">Tip: {this.props.tip}</div>
    ) : (
      <div></div>
    );
    const warning_alert = this.props.show_warn ? (
      <div className="alert alert-warning">
        Please make your choice for this question.
      </div>
    ) : (
      <div></div>
    );

    let selection_list = [false, false, false];
    // console.log(this.props);

    if (this.props.selection !== -1) {
      if (this.props.selection === 0) {
        selection_list[0] = true;
      } else if (this.props.selection === 1) {
        selection_list[2] = true;
      } else if (this.props.selection === 2) {
        selection_list[1] = true;
      }
    }

    // console.log(this.props);
    // console.log(selection_list);

    const selection_text = {
      0: "Definitely Correct",
      1: "Definitely Incorrect",
      2: "Neither Definitely Correct nor Definitely Incorrect",
    };

    const selection_items = selection_list.map((is_selected, key) => {
      const curClassName = is_selected
        ? "list-group-item active"
        : "list-group-item";
      return (
        <li
          key={key}
          type="button"
          className={curClassName}
          onClick={(e) => this.clickSelection(key, e)}
        >
          {selection_text[key]}
        </li>
      );
    });

    return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Question {this.props.eid + 1}</h5>
          <p className="card-text">
            <strong>Passage:</strong> {this.props.passage}
            <br />
            <strong>Statement:</strong> {this.props.hypothesis}
          </p>
          <div className="card-text">
            <em>
              Given the passage, the statement is (choose one of the answers
              listed below):
            </em>
            <ul className="list-group">{selection_items}</ul>
          </div>
          {tip_alert}
          {warning_alert}
        </div>
      </div>
    );
  }
}

class Phase2QuestionCard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      label_explanation: "",
      model_explanation: "",
      show_expert_annotation: false,
    };
  }

  handleChangeModel = (e) => {
    this.setState({ model_explanation: e.target.value });
  };

  handleChangeLabel = (e) => {
    this.setState({ label_explanation: e.target.value });
  };

  render() {
    const true_label_text = {
      0: "definitely correct",
      1: "neither definitely correct nor definitely incorrect",
      2: "definitely incorrect",
    };

    // const label_explanation_question_text =

    const expertLabelExplanation = this.props.showExpert ? (
      <div className="alert alert-success" role="alert">
        Expert explanation: {this.props.expertLabelExplanation}
      </div>
    ) : (
      <div></div>
    );
    const expertModelExplanation = this.props.showExpert ? (
      <div className="alert alert-success" role="alert">
        Expert explanation: {this.props.expertModelExplanation}
      </div>
    ) : (
      <div></div>
    );

    const main_panel = (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Question {this.props.eid + 1}</h5>
          <p className="card-text">
            <strong>Passage:</strong> {this.props.passage}
            <br />
            <strong>Statement:</strong> {this.props.hypothesis}
            <br />
            <strong>The AI thinks that the statement is:</strong>
            <ul>
              <li>
                Definitely Correct:{" "}
                {(this.props.modelPrediction[0] * 100).toFixed(2)} %
              </li>
              <li>
                Definitely Incorrect:{" "}
                {(this.props.modelPrediction[2] * 100).toFixed(2)} %
              </li>
              <li>
                Neither: {(this.props.modelPrediction[1] * 100).toFixed(2)} %
              </li>
            </ul>
          </p>
          <div className="card-text">
            <em>
              We can see that the AI made a mistake because the{" "}
              <strong>
                statement should be {true_label_text[this.props.true_label]}
              </strong>
              .
            </em>
          </div>
          <label>Now, we would like you to explain:</label>
          <div className="card">
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <strong>
                  Why do you think the statement is{" "}
                  <em>{true_label_text[this.props.true_label]}</em>?
                </strong>
                <br />
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Why do you think the statement is ${
                    true_label_text[this.props.true_label]
                  }?`}
                  onChange={this.handleChangeLabel}
                />
                {expertLabelExplanation}
              </li>

              <li className="list-group-item">
                <strong>Why do you think the AI might get it wrong?</strong>
                <br />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Why do you think the AI might get it wrong? ..."
                  onChange={this.handleChangeModel}
                />
                {expertModelExplanation}
              </li>
            </ul>
          </div>
        </div>
      </div>
    );

    return <>{main_panel}</>;
  }
}

class NLIR4TaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
    // label: entailment: 0, neutral: 1, contradiction: 2.
    this.data = [
      {
        eid: 1, //  example id
        passage:
          "A melee weapon is any weapon used in direct hand-to-hand combat; by contrast with ranged weapons which act at a distance.",
        hypothesis: "Melee weapons are good for ranged combat at a distance.",
        true_answer: 2,
        tip: "A melee weapon is used in direct hand-to-hand combat, not range combat.",
      },
      {
        eid: 2, //  example id
        passage:
          "Kota Ramakrishna Karanth was an Indian lawyer and politician. He was the elder brother of noted Kannada novelist K. Shivarama Karanth.",
        hypothesis:
          "Kota Ramakrishna Karanth has a brother who was both a novelist and a politician.",
        true_answer: 1,
        tip: "Kota Ramakrishna Karanth has a brother who was a novelist. But we’re not sure whether he is a politician or not.",
      },
      {
        eid: 3, //  example id
        passage:
          "Bernardo Provenzano was a member of the Sicilian Mafia and was suspected of having been the head of the Corleonesi, a Mafia faction that originated in the town of Corleone.",
        hypothesis:
          "It was never confirmed that Bernardo Provenzano was the leader of the Corleonesi.",
        true_answer: 0,
        tip: "Bernardo Provenzano was suspected of being the head of Corleonesi.",
      },
      {
        eid: 4, //  example id
        passage:
          '"We had to make a decision between making payroll or paying the debt," The company said on Monday. "If we are unable to make payroll Oct. 19, we will definitely be able to make it next week Oct. 26.',
        hypothesis:
          "The company will not be able to make payroll on October 19th and will instead dispense it on October 26th.",
        true_answer: 1,
        tip: "The company said \"if\" they can't make it on the 19th they will do it on the 26th, they didn't definitely say they won't make it on the 19th.",
      },
      {
        eid: 5, //  example id
        passage:
          "Eduard Schulte was one of the first to warn the Allies and tell the world of the Holocaust and systematic exterminations of Jews in Nazi Germany occupied Europe.",
        hypothesis:
          "Eduard Schulte is the only person to warn the Allies of the atrocities of the Nazis.",
        true_answer: 2,
        tip: "Eduard Schulte is one of the first to warn the Allies. There are others who also warn the Allies.",
      },
    ];

    this.phase_2_data = [
      {
        eid: 0, //  example id
        passage:
          "Kota Ramakrishna Karanth was an Indian lawyer and politician. " +
          "He was the elder brother of noted Kannada novelist K. Shivarama Karanth.",
        hypothesis:
          "Kota Ramakrishna Karanth has a brother who was both a novelist and a politician.",
        true_answer: 1,
        model_pred: [0.9947, 0.004884, 0.0004061],
        expert_label_explanation:
          "Kota Ramakrishna Karanth is a politician and has a brother who was a novelist. But we’re not sure whether the brother is a politician or not. Therefore, the statement is neither correct nor incorrect.",
        expert_model_explanation:
          "The passage states that Kota Ramakrishna Karanth is a politician and his brother is a novelist. " +
          'The AI might not be able to understand the grammar and mistakenly thinks that since the passage contains both "politician" and "novelist" then the statement is correct.',
      },

      {
        eid: 1, //  example id
        passage:
          "I found out my cat is pregnant. " +
          "I had no idea why she was making all these funny noises. She would hide a lot under my bed. " +
          "A friend told me this behavior was of a pregnant animal. I cannot wait to see the kittens.",
        hypothesis: "The woman is pregnant and has a cat.",
        true_answer: 1,
        model_pred: [0.982749, 0.0169381, 0.00031238],
        expert_label_explanation:
          "First of all, there is no woman in the passage. " +
          "We cannot assume that the person is a woman. Secondly, the person does have a cat, but it is not known whether the person is pregnant or not. " +
          "The passage only states that the cat might be pregnant.",
        expert_model_explanation:
          "The passage and statement have a lot of word overlap. " +
          'This might make the AI believe that the statement is "definitely correct".',
      },
    ];

    const startDate = new Date();

    this.state = {
      is_correct: [null, null, null, null, null], // null means not answered.
      // show_tips: [false, false, false, false, false],
      selections: [-1, -1, -1, -1, -1],
      phase_1_submitted_but_failed: false,
      phase_1_missing_selections: false,

      remaining_trial_count: 5,
      phase_1_finished: false,
      start_time: startDate,
      phase_1_finished_time: null,
      phase_2_finished_time: null,
      // phase_2_selections: [[-1, -1], [-1, -1]],
      // phase_2_submitted_once: false,
      // phase_2_remaining_trial_count: 3,
      phase_2_started: false,
      phase_2_finished: false,
    };

    this.completeOnboarding = this.completeOnboarding.bind(this);
  }

  completeOnboarding() {
    // Backend API. Do something here to log relevant information.
    this.props.onSubmit({ success: true }); // if they failed, set to false
  }

  submitPhase1 = () => {
    // check phase 1 correctness.
    let cur_is_correct = this.state.is_correct;
    // console.log(this)
    let example_data = this.data;
    this.state.selections.forEach(function (value, i) {
      if (value === -1) {
        // if not selected, we don't do anything.
      } else {
        cur_is_correct[i] = example_data[i].true_answer === value;
      }
    });

    this.setState({ is_correct: cur_is_correct });

    const is_finished = cur_is_correct.every((v) => !(v === null));
    const all_correct = cur_is_correct.every((v) => v);

    if (is_finished && all_correct) {
      const curDate = new Date();
      this.setState({
        phase_1_finished: true,
        phase_1_finished_time: curDate,
      });
    } else if (!is_finished) {
      this.setState({
        phase_1_missing_selections: true,
      });
    } else if (!all_correct) {
      this.setState({
        phase_1_missing_selections: false,
        remaining_trial_count: this.state.remaining_trial_count - 1,
        phase_1_submitted_but_failed: true,
      });
    }

    // if we failed...
    if (this.state.remaining_trial_count === 0) {
      // Backend API. Do something here to log relevant information.
      const curDate = new Date();
      // remember to also set phase_2_finished_time here.

      // this.props.onSubmit({ success: false });
    }
  };

  // isPhase2Submittable = () => {
  //
  // }

  submitPhase2 = () => {
    const curDate = new Date();
    this.setState({ phase_2_finished: true, phase_2_finished_time: curDate });
    // console.log(this.state)
  };

  // this.submitPhase1 = this.submitPhase1.bind(this);

  clickSelection(eid, selection_id, e) {
    e.preventDefault();
    // console.log(e.currentTarget);
    // console.log(typeof e.currentTarget);
    // data-eid
    const remap = {
      0: 0,
      1: 2,
      2: 1,
    };

    // console.log(e.currentTarget.getAttribute['dataeid'])
    // console.log(eid)
    // console.log(selection_id)

    let updatedSelection = this.state.selections;
    updatedSelection[eid] = remap[selection_id];
    // updatedSelection[parseInt(e.currentTarget.getAttribute['data-eid'])] = parseInt(remap[parseInt(e.currentTarget.getAttribute['data-key'])]);
    // console.log(updatedSelection)
    this.setState({ selection: updatedSelection });
  }

  phase_1_to_2_button = () => {
    this.setState({ phase_2_started: true });
  };

  render() {
    // let is_finished = true
    // for (const cur_c in this.state.is_correct) {
    //     if (cur_c === null) {
    //         is_finished = false
    //         break
    //     }
    // }
    //
    // let phase_1_all_correct = true
    // for (const cur_c in this.state.is_correct) {
    //     if (cur_c === false || cur_c === null) {
    //         phase_1_all_correct = false
    //         break
    //     }
    // }

    let phase_1_warning = <div></div>;
    if (this.state.phase_1_missing_selections) {
      phase_1_warning = (
        <div className="alert alert-warning">
          It looks like you haven't made selections for some questions. Please
          made your selection for all the questions.
        </div>
      );
    } else if (
      this.state.phase_1_submitted_but_failed &&
      !this.state.phase_1_finished
    ) {
      phase_1_warning = (
        <div className="alert alert-warning">
          Some of your selections are incorrect. Please read the tip and modify
          your selections. You have{" "}
          <strong>{this.state.remaining_trial_count}</strong> trials remaining.
        </div>
      );
    }

    const questions = this.data.map((currentExample, eid) => {
      const show_tip =
        this.state.phase_1_submitted_but_failed &&
        this.state.is_correct[eid] === false;
      const show_warn =
        this.state.phase_1_missing_selections &&
        this.state.is_correct[eid] === null;

      return (
        <ExampleCard
          key={eid}
          eid={eid}
          passage={currentExample.passage}
          hypothesis={currentExample.hypothesis}
          tip={currentExample.tip}
          show_tip={show_tip}
          show_warn={show_warn}
          selection={this.state.selections[eid]}
          clickSelection={this.clickSelection.bind(this, eid)}
        />
      );
    });

    let phase_1_panel = (
      <div className="card">
        <div className="card-body">
          <h3 className="card-title">Phase One - (5 Questions)</h3>
          <h4 className="card-subtitle">
            The goal of this phase is to help you understand and differentiate
            the relation between a passage and a statement.
          </h4>
          <hr />
          <div className="card-text">
            <strong>Instruction:</strong>
            <br />
            Given a passage, a statement can be either:
            <ul>
              <li>
                <strong>Definitely correct; or</strong>
              </li>
              <li>
                <strong>Definitely incorrect; or</strong>
              </li>
              <li>
                <strong>Neither.</strong>
              </li>
            </ul>
            <p>
              <em>
                In each of 5 following questions, you will be given a passage,
                and a statement. Please choose the correct category for each
                statement.
              </em>
            </p>
            <strong>Questions:</strong>
            {questions}
            <Button
              className="btn btn-primary btn-success"
              onClick={this.submitPhase1}
            >
              Complete Phase One
            </Button>
            {phase_1_warning}
          </div>
        </div>
      </div>
    );

    const phase2questions = this.phase_2_data.map((currentExample, eid) => {
      return (
        <Phase2QuestionCard
          key={eid}
          eid={eid}
          passage={currentExample.passage}
          hypothesis={currentExample.hypothesis}
          true_label={currentExample.true_answer}
          modelPrediction={currentExample.model_pred}
          expertLabelExplanation={currentExample.expert_label_explanation}
          expertModelExplanation={currentExample.expert_model_explanation}
          selection={this.state.selections[eid]}
          showExpert={this.state.phase_2_finished}
        />
      );
    });

    let phase_2_panel = (
      <div className="card">
        <div className="card-body">
          <h3 className="card-title">Phase Two - (2 Questions)</h3>
          <h4 className="card-subtitle">
            The goal of this phase is to help you write the explanations.
          </h4>
          <hr />
          <div className="card-text">
            <strong>Instruction:</strong>
            <br />
            <p>In the main task, you will be asked to give explanations for:</p>
            <ul>
              <li>
                Why do you think the statement is definitely correct, definitely
                incorrect, or neither?
              </li>
              <li>Why do you think the AI might get it wrong?</li>
            </ul>
            <p>
              <em>Please write the explanations for the following examples.</em>
            </p>

            <strong>Questions:</strong>
            {phase2questions}
            <Button
              className="btn btn-primary btn-success"
              onClick={this.submitPhase2}
            >
              Complete Phase Two
            </Button>
          </div>
        </div>
      </div>
    );

    let phase_1_to_2_panel = (
      <div>
        Congratulations! You have passed the Phase One of the Onboarding.
        <br />
        Now, click the button below to continue to Phase Two.
        <br />
        <Button
          className="btn btn-primary btn-success"
          onClick={this.phase_1_to_2_button}
        >
          Continue
        </Button>
      </div>
    );

    let finishing_panel = (
      <div>
        Thank you for your input. We provide the explanations from experts for
        the questions above.
        <br />
        Please read them and try to write accordingly in the main task.
        <br />
        More examples will be provided in the main task and we recommend you to
        read the examples before you write your statement and explanations.
        Congratulations! You have passed the Onboarding. Click the button below
        to continue.
        <br />
        <Button
          className="btn btn-primary btn-success"
          onClick={this.completeOnboarding}
        >
          Finish Onboarding Test
        </Button>
      </div>
    );

    if (!this.state.phase_1_finished) {
      phase_1_to_2_panel = <></>;
      phase_2_panel = <></>;
      finishing_panel = <></>;
    } else if (this.state.phase_1_finished && !this.state.phase_2_started) {
      phase_1_panel = <></>;
      phase_2_panel = <></>;
      finishing_panel = <></>;
    } else if (this.state.phase_1_finished && this.state.phase_2_started) {
      phase_1_panel = <></>;
      phase_1_to_2_panel = <></>;
      finishing_panel = <></>;
    }

    if (this.state.phase_1_finished && this.state.phase_2_finished) {
      phase_1_panel = <></>;
      phase_1_to_2_panel = <></>;
      finishing_panel = (
        <div>
          <br />
          Thank you for your input. We provide the explanations from experts for
          the questions above.
          <br />
          <strong>
            Please read them and try to write accordingly in the main task.
          </strong>
          <br />
          More examples will be provided in the main task and we recommend you
          to read the examples before you write your statement and explanations.
          Congratulations! You have passed the Onboarding. Click the button
          below to continue.
          <br />
          <Button
            className="btn btn-primary btn-success"
            onClick={this.completeOnboarding}
          >
            Finish Onboarding Test
          </Button>
        </div>
      );
    }

    return (
      <React.Fragment>
        <h1>Onboarding Test - Write sentences and fool the AI!</h1>
        <p>
          Welcome! This is your first time working on this task. We would like
          you to take a quick qualification test. The qualification test will
          have <strong>two phases</strong>.<br />
          Please read the instructions and take the test carefully. <br />
          <span style={{ color: "red" }}>
            <b> Warning:</b>
          </span>
          You have only <strong>one</strong> chance to take the test and failure
          to pass the test will <strong>disqualify</strong> you from working on
          these HITs.
        </p>
        {phase_1_panel}
        {phase_1_to_2_panel}
        {phase_2_panel}
        <p>{finishing_panel}</p>
      </React.Fragment>
    );
  }
}

export { NLIR4TaskOnboarder };
