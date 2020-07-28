import React from 'react';
import {
  Container,
  Row, Col,
  Card,
  CardGroup,
  Button,
  Nav,
  Table,
  FormControl,
  InputGroup
} from 'react-bootstrap';

import { TokenAnnotator, TextAnnotator } from 'react-text-annotate'

class ContextInfo extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      this.props.taskType == 'extract' ?
        <>
          <TokenAnnotator
            style={{
              lineHeight: 1.5,
            }}
            className='context'
            tokens={this.props.text.split(' ')}
            value={this.props.answer}
            onChange={this.props.updateAnswer}
            getSpan={span => ({
              ...span,
              tag: 'ANS',
            })}
          />
          <small>Your goal: enter a question and select an answer in the context in accordance with the instructions.</small>
        </>
        :
        <><div className='context'>{this.props.text}</div><small>Your goal: enter a <strong>{this.props.targets[this.props.curTarget]}</strong> statement in accordance with the instructions.</small></>
    );
  }
}

class CreateInterfaceNoModel extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {
      answer: [],
      taskId: props.taskConfig.task_id,
      task: {},
      context: null,
      target: 0,
      modelPredIdx: null,
      modelPredStr: '',
      hypothesis: "",
      content: [],
      submitDisabled: true,
      refreshDisabled: true,
      mapKeyToExampleId: {},
      tries: 0,
      taskCompleted: false
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleTaskSubmit = this.handleTaskSubmit.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
    this.retractExample = this.retractExample.bind(this);
    this.updateAnswer = this.updateAnswer.bind(this);
  }
  getNewContext() {
    this.setState({submitDisabled: true, refreshDisabled: true}, function () {
      this.api.getRandomContext(this.state.taskId, this.state.task.cur_round)
      .then(result => {
        var randomTarget = Math.floor(Math.random() * this.state.task.targets.length);
        this.setState({target: randomTarget, context: result, content: [{cls: 'context', text: result.context}], submitDisabled: false, refreshDisabled: false});
      })
      .catch(error => {
        console.log(error);
      });
    });
  }
  retractExample(e) {
    e.preventDefault();
    var idx = e.target.getAttribute("data-index");
    this.api.retractExample(
      this.state.mapKeyToExampleId[idx],
      'turk|' + this.props.providerWorkerId + '|' + this.props.mephistoWorkerId
    )
    .then(result => {
      const newContent = this.state.content.slice();
      newContent[idx].cls = 'retracted';
      newContent[idx].retracted = true;
      this.setState({content: newContent});
    })
    .catch(error => {
      console.log(error);
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
      let modelInputs = {
        context: this.state.context.context,
        hypothesis: this.state.hypothesis,
        answer: this.state.task.type == 'extract' ? this.state.answer : null
      };
      this.setState({
          content: [...this.state.content, {
            cls: 'hypothesis',
            text: this.state.hypothesis,
            retracted: false
          }]}, function() {
          const metadata = {
            'annotator_id': this.props.providerWorkerId,
            'mephisto_id': this.props.mephistoWorkerId,
            'model': 'no-model',
            'answer': this.state.task.type == 'extract' ? this.state.answer : null
          };
          this.api.storeExample(
            this.state.task.id,
            this.state.task.cur_round,
            'turk',
            this.state.context.id,
            this.state.hypothesis,
            this.state.task.type == 'extract' ? this.state.answer : this.state.target,
            {},
            metadata
          ).then(metadata => {
            var key = this.state.content.length-1;
            this.state.tries += 1;
            this.setState({hypothesis: "", submitDisabled: false, refreshDisabled: false},
              function () {
                  console.log('Success! You can submit HIT');
                  this.setState({taskCompleted: true});
                  this.handleTaskSubmit();
	    });
          })
          .catch(error => {
            console.log(error);
          });
      });
    });
  }
  handleResponseChange(e) {
    this.setState({hypothesis: e.target.value});
  }
  componentDidMount() {
    this.api.getTask(this.state.taskId)
    .then(result => {
      result.targets = result.targets.split('|'); // split targets
      this.setState({task: result}, function() {
        this.getNewContext();
      });
    })
    .catch(error => {
      console.log(error);
    });
  }
  updateAnswer(value) {
    // Only keep the last answer annotated
    if (value.length > 0) {
      this.setState({
        answer: [value[value.length - 1]],
        answerNotSelected: false,
      });
    } else {
      this.setState({ answer: value, answerNotSelected: false });
    }
  }
  render() {
    const content = this.state.content.map((item, index) =>
      item.cls == 'context' ?
        <ContextInfo key={index}
          index={index}
          text={item.text}
          targets={this.state.task.targets}
          curTarget={this.state.target}
          taskType={this.state.task.type}
          answer={this.state.answer}
          updateAnswer={this.updateAnswer}
        />
        :
          <div key={index} className={item.cls + ' rounded border ' + (item.retracted ? 'border-warning' : 'border-success')}  style={{ minHeight: 120 }}>
            <Row>
              <div className="col-sm-9">
                <div>{item.text}</div>
                <small>{
                  item.retracted ?
                  <>
                    <span><strong>Example retracted</strong> - thanks. Please try again!</span>
                  </>
                  :
                  <>
                  <span><strong>Thanks! We will have this example verified.</strong></span><br />
		  {/*<span>Made a mistake? You can still <a href="#" data-index={index} onClick={this.retractExample} className="btn-link">retract this example</a>. Otherwise, we will have it verified.</span>*/}
                  </>
                }</small>
              </div>
              <div className="col-sm-3" style={{textAlign: 'right'}}>
              </div>
            </Row>
          </div>
    );
    var taskTracker = <Button className="btn btn-primary btn-success" disabled={this.state.submitDisabled} onClick={this.handleResponse}>Submit HIT</Button>;
    return (
      <Container>
        <Row>
          <h2>Find examples for - {this.state.task.name}</h2>
	</Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
            <Card border='dark'>
              <Card.Body style={{height: 400, overflowY: 'scroll'}}>
                {content}
              </Card.Body>
            </Card>
          </CardGroup>
          <InputGroup>
            <FormControl
              style={{ width: '100%', margin: 2 }}
              placeholder={this.state.task.type == 'extract' ? 'Enter question..' : 'Enter hypothesis..'}
              value={this.state.hypothesis}
              onChange={this.handleResponseChange}
            />
          </InputGroup>
          <InputGroup>
            <small className="form-text text-muted">Please enter your input. Remember, the goal is to generate an example in accordance with the instructions. Load time may be slow; please be patient.</small>
          </InputGroup>
          <InputGroup>
	    {/*<Button className="btn btn-primary" style={{marginRight: 2}} onClick={this.handleResponse} disabled={this.state.submitDisabled}>Submit <i className={this.state.submitDisabled ? "fa fa-cog fa-spin" : ""} /></Button>*/}
            <Button className="btn btn-secondary" style={{marginRight: 2}} onClick={this.getNewContext} disabled={this.state.refreshDisabled}>Switch to next context</Button>
            {taskTracker}
          </InputGroup>
        </Row>
      </Container>
    );
  }
}

export { CreateInterfaceNoModel };
