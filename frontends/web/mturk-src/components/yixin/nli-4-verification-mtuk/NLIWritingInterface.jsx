import React from 'react';
import {Button, Container,} from 'react-bootstrap';

import {ExampleGoodCards} from "./GoodExampleCards.jsx";


class NLIWritingInterface extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.modelURLs = [
        "https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model=nli-r4-1",
        "https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model=nli-r4-2",
        "https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model=nli-r4-3",
        "https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model=nli-r4-4",
        "https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model=nli-r4-5",
    ];
    // set the api to production mode
    // https://api.dynabench.org

    this.api.domain = "https://api.dynabench.org"

    this.meta_save = {
      debug_flag: false,
      experiment_flag: this.props.taskConfig.experiment_flag,
    }

    this.state = {
      // here comes the new state,

      // the data from the requester.
      // reqData: {
      //   dataId: "",
      //   passage: "",
      //   targetLabel: 2,  //0, 1, 2
      //   context_response: {}, // the response from api service
      // },

      // the data of the responser/annotator.
      // resData: {
      //   statement: "",
      //   labelExplanation: "",
      //   modelExplanation: "",
      // },
      // request data:

      passage: "",
      statement: "",
      targetLabel: 0,

      selectedLabel: -1,
      firstlabel: -1,
      additionalSelectedLabel: -1,
      example: null,

      isReading: false,
      isConfirmed: false,
      isSecondlyConfirmed: false,
      isAdditionalConfirmed: false,

      showPreview: false,
      submittedOnce: false,
      submitDisabled: true,
      modelFooled: false,
      modelCalculating: false,

      // here we can save some meta data.
      session_id: "", // passage, mturk, target label is a session.
      number_of_tried_for_current_session: 0,
      session_start_date: null,
      last_submit_date: null,

      // other states
      answer: [],
      taskId: props.taskConfig.task_id,
      task: {},
      context: null,
      target: 0,
      modelPredIdx: null,
      modelPredStr: '',
      hypothesis: "",

      startDateTime: null,
      endDateTime: null,
      endSecondDateTime: null,

      content: [],

      refreshDisabled: true,
      mapKeyToExampleId: {},
      tries: 0,
      total_tries: 10, // NOTE: Set this to your preferred value
      taskCompleted: false
    };

    // this.getNewContext = this.getNewContext.bind(this);
    this.handleTaskSubmit = this.handleTaskSubmit.bind(this);
    // this.handleResponse = this.handleResponse.bind(this);
    // this.handleResponseChange = this.handleResponseChange.bind(this);
    // this.retractExample = this.retractExample.bind(this);
    // this.updateAnswer = this.updateAnswer.bind(this);
    console.log("Log from Writing Interface! State:", this.state);
    console.log("Log from Writing Interface! API:", this.props.api);
  }

  explainExample = (id, uid, LabelExp, ModelExp) => {
    const obj = {
      example_explanation: LabelExp,
      model_explanation: ModelExp,
      uid: uid
    };

    return this.api.fetch(`${this.api.domain}/examples/${id}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    });
  }

  hashCode(str) {
  return str.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
  }

  mod(n, m) {
    return ((n % m) + m) % m;
  }

  create_UUID() {
    let dt = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  InitNewContext() {
    this.setState({submitDisabled: true, refreshDisabled: true, submittedOnce:false, modelFooled:false,
      number_of_tried_for_current_session: 0, session_start_date: new Date(), last_submit_date: new Date(),
      resData: {statement: "", labelExplanation: "", modelExplanation: ""}, modelData: {prob: [], predLabel: null, model_response: {}}}, function () {
      this.api.getRandomContext(this.state.taskId, this.state.task.cur_round)
      .then(result => {
        const randomID = Math.floor(Math.random() * 100);
        const randomTarget = Math.floor(Math.random() * 3);
        // this.setState({target: randomTarget, context: result, content: [{cls: 'context', text: result.context}], submitDisabled: false, refreshDisabled: false});
        console.log("Init Context...")
        // console.log(result)
        const newReqData = {
          dataId: result.id,
          passage: result.context,
          targetLabel: randomTarget,  //0, 1, 2
          context_response: result,
        }
        // console.log(newReqData)
        this.setState({resData: {statement: "", labelExplanation: "", modelExplanation: ""}, reqData:newReqData, submitDisabled: false, refreshDisabled: false, session_id: this.create_UUID()}, function () {
          console.log("Context init finished (State):", this.state)
        });
      }, error => {
        console.log(error);
      });
    });
  }

  InitNewExample() {
    this.api
      .getRandomExample(this.state.taskId, this.state.task.cur_round, this.props.taskConfig.dyna_tags)
      .then((result) => {
        if (this.state.task.type !== 'extract') {
          result.target = this.state.task.targets[parseInt(result.target_pred)];
        }
        this.setState({
          example: result,
          passage: result.context.context,
          statement: result.text
        });
        console.log("After get example:", this.state)
      }, (error) => {
        console.log(error);
        this.setState({
          example: false
        });
      });
  }

  handleTaskSubmit() {
    this.props.onSubmit(this.state.content);
  }

  handleResponse() {
    this.setState({submitDisabled: true, refreshDisabled: true}, function () {
      if (this.state.hypothesis.length == 0) {
        this.setState({submitDisabled: false, refreshDisabled: false});
        return;
      }
      if (this.state.task.type == 'extract' && this.state.answer.length == 0) {
        this.setState({submitDisabled: false, refreshDisabled: false});
        return;
      }
      if (this.state.task.type == "extract") {
        var answer_text = "";
        if (this.state.answer.length > 0) {
          var last_answer = this.state.answer[this.state.answer.length - 1];
          var answer_text = last_answer.tokens.join(" "); // NOTE: no spaces required as tokenising by word boundaries
          // Update the target with the answer text since this is defined by the annotator in QA (unlike NLI)
          this.setState({ target: answer_text });
        }
      } else {
        var answer_text = null;
      }
      let modelInputs = {
        context: this.state.context.context,
        hypothesis: this.state.hypothesis,
        answer: answer_text,
        insight: false,
      };
      this.api.getModelResponse(this.state.task.round.url, modelInputs)
        .then(result => {
          if (this.state.task.type != 'extract') {
            var modelPredIdx = result.prob.indexOf(Math.max(...result.prob));
            var modelPredStr = this.state.task.targets[modelPredIdx];
            var modelFooled = result.prob.indexOf(Math.max(...result.prob)) !== this.state.target;
          } else {
            var modelPredIdx = null;
            var modelPredStr = result.text;
            var modelFooled = !result.model_is_correct;
            // TODO: Handle this more elegantly:
            result.prob = [result.prob, 1 - result.prob];
            this.state.task.targets = ['confidence', 'uncertainty'];
          }
        this.setState({
          content: [...this.state.content, {
            cls: 'hypothesis',
            modelPredIdx: modelPredIdx,
            modelPredStr: modelPredStr,
            fooled: modelFooled,
            text: this.state.hypothesis,
            retracted: false,
            response: result}
          ]}, function() {
          var last_answer = this.state.answer[this.state.answer.length - 1];
          var answer_text = last_answer.tokens.join(" ");
          const metadata = {
            'annotator_id': this.props.providerWorkerId,
            'mephisto_id': this.props.mephistoWorkerId,
            'model': 'model-name-unknown',
            'agentId': this.props.agentId,
            'assignmentId': this.props.assignmentId,
            'fullresponse': this.state.task.type == 'extract' ? JSON.stringify(this.state.answer) : this.state.target
          };
          this.api.storeExample(
            this.state.task.id,
            this.state.task.cur_round,
            'turk',
            this.state.context.id,
            this.state.hypothesis,
            this.state.task.type == 'extract' ? answer_text : this.state.target,
            result,
            metadata
          ).then(result => {
            var key = this.state.content.length-1;
            this.state.tries += 1;
            this.setState({hypothesis: "", submitDisabled: false, refreshDisabled: false, mapKeyToExampleId: {...this.state.mapKeyToExampleId, [key]: result.id}},
              function () {
                if (this.state.content[this.state.content.length-1].fooled || this.state.tries >= this.state.total_tries) {
                  console.log('Success! You can submit HIT');
                  this.setState({taskCompleted: true});
                }
              });
          }, error => {
            console.log(error);
          });
        });
      }, error => {
        console.log(error);
      });
    });
  }

  handleResponseChange(e) {
    this.setState({hypothesis: e.target.value});
  }

  isStatementSubmittable = () => {
    return this.state.resData.statement.trim().length > 25;
  }

  isExampleSubmittable = () => {
    if (this.isStatementSubmittable() === false) {
      return false
    } else if (this.state.resData.labelExplanation.trim().length <= 25) {
      return false
    } else if (this.state.resData.modelExplanation.trim().length <= 25) {
      return false
    }
    return true
  }

  handleStatementChange = (e) => {
    e.persist();
    this.setState(prevState => ({
        resData: {
            ...prevState.resData,
            statement: e.target.value
        }
    }))
  }

  handleLabelExpChange = (e) => {
    e.persist();
    this.setState(prevState => ({
        resData: {
            ...prevState.resData,
            labelExplanation: e.target.value
        }
    }))
  }

  handleModelExpChange = (e) => {
    e.persist();
    this.setState(prevState => ({
        resData: {
            ...prevState.resData,
            modelExplanation: e.target.value
        }
    }))
  }

  componentDidMount() {
    this.api.getTask(this.state.taskId)
    .then(result => {
      result.targets = result.targets.split('|'); // split targets
      this.setState({task: result}, function() {
        // this.getNewContext();
        // this.InitNewContext();
        this.InitNewExample();
        console.log("After mount:", this.state);
      });
    }, error => {
      console.log(error);
    });
  }

  retractExample = () => {
    this.api.retractExample(
      this.state.last_sumbitted_example_id,
      this.props.providerWorkerId
    )
    .then(result => {
      this.InitNewContext()
      console.log("Example Retracted:", result)
    })
    .catch(error => {
      console.log(error);
    });
  }

  finishExample = () => {
    this.explainExample(
        this.state.last_sumbitted_example_id,
        this.props.providerWorkerId,
        this.state.resData.labelExplanation,
        this.state.resData.modelExplanation,
    ).then(result => {
      console.log("One Example Updated:", result, "State:", this.state)
      this.props.onSubmit({});
    }, error => {
      console.log(error);
    });

    // some thing to submit the HIT and clean it up.
  }

  submitStatementFake = () => {
    this.setState({modelCalculating: true, submittedOnce: true, submitDisabled: true}, function () {

      const modelInputs = {
        context: this.state.reqData.passage,
        hypothesis: this.state.resData.statement,
        answer: null,
        insight: false,
      };

      const randomStrValueForModelURL = this.state.reqData.passage + this.props.providerWorkerId
      const cur_modelURLIndex = this.mod(this.hashCode(randomStrValueForModelURL), 5)
      const cur_modelURL = this.modelURLs[cur_modelURLIndex]
      console.log("Model URL from submitStatementFake:", cur_modelURL)

      // this.api.getModelResponse(this.state.task.round.url, modelInputs)

      // const randomArray = [Math.random(), Math.random(), Math.random()]
      // let sum = randomArray.reduce(function(a, b){
      //     return a + b;
      // }, 0);
      // const modelProb = randomArray.map((a) => {
      //   return (a / sum)
      // });

      this.api.getModelResponse(cur_modelURL, modelInputs)
          .then(results => {
            const modelProb = results.prob
            const modelPredLabel = modelProb.indexOf(Math.max(...modelProb));
            // var modelPredIdx = result.prob.indexOf(Math.max(...result.prob));
            // var modelPredStr = this.state.task.targets[modelPredIdx];
            // var modelFooled = result.prob.indexOf(Math.max(...result.prob)) !== this.state.target;
            const newModelData = {
              prob: modelProb,            //E, N, C
              predLabel: modelPredLabel,  //0, 1, 2
              model_response: results
            }

            const number_of_tried = this.state.number_of_tried_for_current_session + 1
            this.setState({modelData: newModelData, submittedOnce: true, modelCalculating: false, submitDisabled: false,
              number_of_tried_for_current_session: number_of_tried}, function () {
              this.checkModelFeedback()
              console.log("Check State after submit we get model response (State):", this.state)

              const metadata = {
                session_id: this.state.session_id,
                model_url: cur_modelURL,
                annotator_id: this.props.providerWorkerId,
                mephisto_id: this.props.mephistoWorkerId,
                agentId: this.props.agentId,
                assignmentId: this.props.assignmentId,
                session_start_date: this.state.session_start_date,
                last_submit_date: this.state.last_submit_date,
                current_date: new Date(),
                number_of_tried_for_current_session: this.state.number_of_tried_for_current_session,
                ...this.meta_save
              }

              this.api.storeExample(
                this.state.task.id,
                this.state.task.cur_round,
                'turk',
                this.state.reqData.dataId,
                this.state.resData.statement,
                this.state.reqData.targetLabel,
                results,
                metadata
              ).then(result => {
                this.setState({last_submit_date: new Date(), last_sumbitted_example_id: result['id']}, function () {
                  this.explainExample(
                      this.state.last_sumbitted_example_id,
                      this.props.providerWorkerId,
                      this.state.resData.labelExplanation,
                      this.state.resData.modelExplanation,
                  ).then(result => {
                    console.log("One Example Updated:", result, "State:", this.state)
                  }, error => {
                    console.log(error);
                  });
                  console.log("One Example Stored:", result, "State:", this.state)
                })
              }, error => {
                console.log(error);
              });
            })
          })
    })
  }

  checkModelFeedback = () => {
    if (this.state.modelData.predLabel !== this.state.reqData.targetLabel) {
      this.setState({modelFooled: true})
    }
  }

  switchContext = () => {
    if (this.state.chanceToSwitch > 0) {
      this.setState({chanceToSwitch: this.state.chanceToSwitch - 1}, function () {
        this.InitNewContext();
      })
    }
  }

  clickSelection(selection_id, e) {
    // e.preventDefault();
    // console.log(e.currentTarget);
    // console.log(typeof e.currentTarget);
    // data-eid
    if (!this.state.isConfirmed || !this.state.isSecondlyConfirmed) {
      const remap = {
        0: 0,
        1: 2,
        2: 1,
        3: 3,
      }

      // console.log(e.currentTarget.getAttribute['dataeid'])
      // console.log(eid)
      // console.log(selection_id)

      // let updatedSelection = this.state.selections
      // updatedSelection[eid] = remap[selection_id]
      // updatedSelection[parseInt(e.currentTarget.getAttribute['data-eid'])] = parseInt(remap[parseInt(e.currentTarget.getAttribute['data-key'])]);
      // console.log(updatedSelection)

      this.setState({'selectedLabel': remap[selection_id]}, () => {
        console.log("After Click Selection:", this.state)
      })
    }
  }

  clickAdSelection(selection_id, e) {
    // e.preventDefault();
    // console.log(e.currentTarget);
    // console.log(typeof e.currentTarget);
    // data-eid
    if (!this.state.isAdditionalConfirmed) {
      const remap = {
        0: 0,
        1: 1,
        2: 2,
      }

      // console.log(e.currentTarget.getAttribute['dataeid'])
      // console.log(eid)
      // console.log(selection_id)

      // let updatedSelection = this.state.selections
      // updatedSelection[eid] = remap[selection_id]
      // updatedSelection[parseInt(e.currentTarget.getAttribute['data-eid'])] = parseInt(remap[parseInt(e.currentTarget.getAttribute['data-key'])]);
      // console.log(updatedSelection)
      this.setState({additionalSelectedLabel: remap[selection_id]}, () => {
        console.log("After Click Ad Selection:", this.state)
      })
    }
  }

  SubmitAnswer = () => {


    let action = "incorrect"
    if (this.state.selectedLabel === parseInt(this.state.example.target_pred)) {
        action = "correct"
    } else if (this.state.selectedLabel === 3) {
        action = "flagged"
    }

    const save_metadata = {
        firstselection: this.state.firstlabel,
        selection: this.state.selectedLabel,
        certainty: this.state.additionalSelectedLabel,
        startDate: this.state.startDateTime,
        endFirstDate: this.state.endDateTime,
        endSecondDate: this.state.endSecondDateTime
    }

    console.log("Submit metadata:", save_metadata)

    this.api
        .validateExample(this.state.example.id, action, "user",
            save_metadata, this.props.providerWorkerId)
            .then(result => {
            console.log("OnSubmit:", result)
		    this.props.onSubmit({});
	    }), (error) => {
		    console.log(error);
		    this.props.onSubmit({});
	    }
  }

  ConfirmBtn = () => {
    if (!this.state.isConfirmed) {
      this.setState({isReading: false, isConfirmed: true, endDateTime: new Date(), firstlabel: this.state.selectedLabel},
        () => {console.log("After First Confirm:", this.state)})
    } else {
      this.setState({isReading: false, isSecondlyConfirmed: true, endSecondDateTime: new Date()},
        () => {console.log("After Second Confirm:", this.state)})
    }
  }

  render() {

    let selection_list = [false, false, false, false];
        // console.log(this.props);
    if (this.state.selectedLabel !== -1) {

        if (this.state.selectedLabel === 0) {
            selection_list[0] = true
        } else if (this.state.selectedLabel === 1) {
            selection_list[2] = true
        } else if (this.state.selectedLabel === 2) {
            selection_list[1] = true
        } else if (this.state.selectedLabel === 3) {
            selection_list[3] = true
        }
    }

    const selection_text = {
        0: "Definitely Correct",
        1: "Definitely Incorrect",
        2: "Neither Definitely Correct nor Definitely Incorrect",
        3: "Please select this if you think the statement is totally broken and can not be understood.",
    }

    const selection_items = selection_list.map((is_selected, key) => {
        const curClassName = is_selected ? "list-group-item active" : "list-group-item";
        return <li key={key}
                   type="button" className={curClassName}
                    onClick={(e) => this.clickSelection(key, e)}>{selection_text[key]}</li>
    });


    const startReadingPanel = (this.state.isReading || this.state.isConfirmed) ? <div></div> : <div>
      Now click on the "Start" button to start reading and make your choice.<br />
      <Button className="btn btn-info" onClick={() => {this.setState({isReading: true, startDateTime: new Date()})}}>Start</Button>
    </div>

    const labelDescMapping = {
      0: 'definitely correct',
      1: 'neither correct nor incorrect',
      2: 'definitely incorrect',
    }

    let writerFeedbackDiv = <></>;
    if (this.state.isConfirmed) {
      const targetLabelDesc = `${labelDescMapping[parseInt(this.state.example.target_pred)]}`

      writerFeedbackDiv = <div style={{backgroundColor: '#EFDFD7', color: '#B52D0B'}}>
        <br />
        Thank you for your answer.<br />
        We would like you to know that another person thinks that the given statement is <strong>{targetLabelDesc}</strong>. <br />
        The reason (by that person) is <strong>"{this.state.example.example_explanation}"</strong>. <br />
        Notice that its opinion might not be correct and sometimes even make no sense. <br />
        <em>But please read its opinion and if you do find that its opinion is more accurate. Please edit your answer.</em>
        <br />
        <br />
      </div>
    }

    const collectionPanel = (this.state.isReading || this.state.isConfirmed) ? <div className="card">
        <div className="card-body">
        <h5 className="card-title">Question</h5>
        <p className="card-text">
        <strong>Passage:</strong> {this.state.passage}<br />
        <strong>Statement:</strong> {this.state.statement}
        </p>
        <div className="card-text">
        <em>Given the passage, the statement is (choose one of the answers listed below):</em>
        <ul className="list-group">
            {selection_items}
        </ul>
          {writerFeedbackDiv}
        </div>

        <div>
        Now click on the "Confirm" button once you have <strong>finished</strong> and <strong>verified</strong> your answer.<br />
        We would kindly ask you to read the text <strong>word by word carefully</strong> because some examples can be very tricky. <br />

        <Button className="btn btn-info" disabled={this.state.isSecondlyConfirmed || (this.state.selectedLabel === -1)} onClick={this.ConfirmBtn}>Confirm</Button>
        </div>
        </div>
      </div> : <></>


    // additional collection panel.

    let ad_selection_list = [false, false, false];
        // console.log(this.props);
    if (this.state.additionalSelectedLabel !== -1) {

        if (this.state.additionalSelectedLabel === 0) {
            ad_selection_list[0] = true
        } else if (this.state.additionalSelectedLabel === 1) {
            ad_selection_list[1] = true
        } else if (this.state.additionalSelectedLabel === 2) {
            ad_selection_list[2] = true
        }
    }

    const ad_selection_text = {
        0: "You are confident that your answer is right.",
        1: "You are uncertain whether your answer is right but you are fairly confident that others will pick the same one as the best answer.",
        2: "You are uncertain whether your answer is right and whether others will pick the same one but you have tried your best effort."
    }

    const ad_selection_items = ad_selection_list.map((is_selected, key) => {
        const curClassName = is_selected ? "list-group-item active" : "list-group-item";
        return <li key={key}
                   type="button" className={curClassName}
                    onClick={(e) => this.clickAdSelection(key, e)}>{ad_selection_text[key]}</li>
    });

    const additionalCollectionPanel = this.state.isSecondlyConfirmed ?
        <div className="card">
        <div className="card-body">
        <h5 className="card-title">Additional Question</h5>
        <div className="card-text">
        <em>We would like you to tell us how confident you are regarding your answer:</em>
        <ul className="list-group">
            {ad_selection_items}
        </ul>
        </div>

        <div>
        Now click on the "Confirm" button once you finished.<br />
        <Button className="btn btn-info" disabled={this.state.isAdditionalConfirmed || (this.state.additionalSelectedLabel === -1)} onClick={() => {this.setState({isAdditionalConfirmed: true}, () => {this.SubmitAnswer(); console.log("After Additional Confirm:", this.state)})}}>Confirm</Button>
        </div>
        </div></div> : <></>

    const topInstruction = <>
        <h1>Read, Reason, and Then Choose.</h1>
      </>

    let taskPreviewButton = <></>;
    if (this.state.showPreview) {
      taskPreviewButton = <Button className="btn btn-info" onClick={() => {this.setState({showPreview: false})}}>Hide Task Preview</Button>
    } else {
      taskPreviewButton = <Button className="btn btn-info" onClick={() => {this.setState({showPreview: true})}}>Show Task Preview</Button>
    }

    const taskPreview = this.state.showPreview ? <>
        {/*<h1>Read, Reason, and Then Choose.</h1>*/}
        <br />
        <p></p>
        Given a <strong>passage</strong>, a <strong>statement</strong> can be:<br />
        <ul>
          <li>Definitely correct; or</li>
          <li>Definitely incorrect; or</li>
          <li>Neither.</li>
        </ul>

        <p>In the task, you see a passage and a statement. We would like you to pick the correct category after reading and fully understand the text.</p>

        <p>We would kindly ask you to read the text word by word carefully because some examples can be very tricky. Additionally, after submitting your answer, we would also like you to tell us how hard it is to pick the answer.</p>

        <p>
        <strong style={{color: "red"}}>Warning:</strong> Please do not spam the HITs, if other humans tend to disagree with your answer, you might be flagged or even blocked.
        </p>

        <hr />
        </> : <></>

    // let finishing_panel = <div>
    //     Thank you for your input.
    //     Congratulations! You have passed the Onboarding. Click the button below to continue.<br />
    //     <Button className="btn btn-primary btn-success" onClick={this.completeOnboarding}>Finish Onboarding Test</Button>
    // </div>

    const bottomInstruction = <>
      <br />
        <p>
        <strong style={{color: "red"}}>Warning:</strong> Please do not spam the HITs, if other humans tend to disagree with your inputs, you might be flagged and even blocked.
        </p>
        <hr />
      </>

    return (
      <Container>
        {topInstruction}
        {taskPreviewButton}
        {taskPreview}
        <hr />
        <ExampleGoodCards />
        <hr />
        {startReadingPanel}
        {collectionPanel}
        {additionalCollectionPanel}
        {bottomInstruction}
      </Container>
    );
  }
}

export { NLIWritingInterface };
