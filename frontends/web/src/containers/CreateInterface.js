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
import { Link } from 'react-router-dom';
import UserContext from './UserContext';
import { TokenAnnotator, TextAnnotator } from 'react-text-annotate'

import C3Chart from 'react-c3js';
//import 'c3/c3.css';

const PieChart = ({ size, data, labels }) =>
  <C3Chart size={{ width: 100, height: 100 }} data={{ json: data, type: 'pie', names: labels }} legend={{ show: false}} tooltip={{
  position: function (data, width, height, element) {
    return {top: 80, left: 20};
  }
}} />;

class Explainer extends React.Component {
  render() {
    return (
      <Row>
        <h2 className="text-uppercase">Find examples that fool the model - {this.props.taskName}</h2> <small style={{marginTop: 40, marginLeft: 20, fontSize: 10}}>(<a href="#" className="btn-link">Need an explainer?</a>)</small>
      </Row>
    );
  }
}

class ContextInfo extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
        this.props.taskType == 'QA' ?
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
            <small>Your goal: enter a question and select an answer in the context, such that the model is fooled.</small>
          </>
        :
          <><div className='context'>{this.props.text}</div><small>Your goal: enter a <strong>{this.props.targets[this.props.curTarget]}</strong> statement that fools the model.</small></>
    );
  }
}

class ResponseInfo extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.retractExample = this.retractExample.bind(this);
  }
  retractExample(e) {
    e.preventDefault();
    var idx = e.target.getAttribute("data-index");
    this.context.api.retractExample(this.props.mapKeyToExampleId[idx])
    .then(result => {
      const newContent = this.props.content.slice();
      newContent[idx].cls = 'retracted';
      newContent[idx].retracted = true;
      this.setState({content: newContent});
    })
    .catch(error => {
      console.log(error);
    });
  }
  render() {
    return (<div className={this.props.obj.cls + ' rounded border ' + (this.props.obj.retracted ? 'border-warning' : (this.props.obj.fooled ? 'border-success' : 'border-danger'))}  style={{ minHeight: 120 }}>
      <Row>
        <div className="col-sm-9">
          <div>{this.props.obj.text}</div>
          <small>{
            this.props.obj.retracted ?
            <>
            <span><strong>Example retracted</strong> - thanks. The model predicted <strong>{this.props.obj.modelPredStr}</strong>. Please try again!</span>
            </>
            :
            (this.props.obj.fooled ?
            <>
            <span><strong>Well done!</strong> You fooled the model. The model predicted <strong>{this.props.obj.modelPredStr}</strong> instead. </span><br/>
            <span>Made a mistake? You can still <a href="#" data-index={this.props.index} onClick={this.retractExample} className="btn-link">retract this example</a>. Otherwise, we will have it verified.</span>
            </>
            :
            <>
            <span><strong>Bad luck!</strong> The model correctly predicted <strong>{this.props.obj.modelPredStr}</strong>. Try again.</span>
            <span>We will still store this as an example that the model got right. You can <a href="#" data-index={this.props.index} onClick={this.retractExample} className="btn-link">retract this example</a> if you don't want it saved.</span>
            </>
            )
          }</small>
        </div>
        <div className="col-sm-3" style={{textAlign: 'right'}}>
          <PieChart data={this.props.obj.response.prob} labels={this.props.targets} />
        </div>
      </Row>
    </div>);
  }
}

class CreateInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      answer: [],
      taskId: null,
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
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
    this.updateAnswer = this.updateAnswer.bind(this);
  }
  getNewContext() {
    this.setState({submitDisabled: true, refreshDisabled: true}, function () {
      this.context.api.getRandomContext(this.state.taskId, this.state.task.cur_round)
      .then(result => {
        var randomTarget = Math.floor(Math.random() * this.state.task.targets.length);
        this.setState({target: randomTarget, context: result, content: [{cls: 'context', text: result.context}], submitDisabled: false, refreshDisabled: false});
      })
      .catch(error => {
        console.log(error);
      });
    });
  }
  handleResponse() {
    this.setState({submitDisabled: true, refreshDisabled: true}, function () {
      if (this.state.hypothesis.length == 0) {
        this.setState({submitDisabled: false, refreshDisabled: false});
        return;
      }
      if (this.state.task.shortname == 'QA' && this.state.answer.length == 0) {
        this.setState({submitDisabled: false, refreshDisabled: false});
        return;
      }
      let modelInputs = {
        context: this.state.context.context,
        hypothesis: this.state.hypothesis,
        answer: this.state.task.shortname == 'QA' ? this.state.answer : null
      };
      this.context.api.getModelResponse(this.state.task.round.url, modelInputs)
      .then(result => {
        if (this.state.task.shortname != 'QA') {
          var modelPredIdx = result.prob.indexOf(Math.max(...result.prob));
          var modelPredStr = this.state.task.targets[modelPredIdx];
          var modelFooled = result.prob.indexOf(Math.max(...result.prob)) !== this.state.target;
        } else {
          var modelPredIdx = null;
          var modelPredStr = result.text;
          var modelFooled = (this.state.answer !== result.text);
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
          this.context.api.storeExample(this.state.task.id, this.state.task.cur_round, this.context.user.id, this.state.context.id, this.state.hypothesis, this.state.target, result)
          .then(result => {
            var key = this.state.content.length-1;
            this.setState({hypothesis: "", submitDisabled: false, refreshDisabled: false, mapKeyToExampleId: {...this.state.mapKeyToExampleId, [key]: result.id}});
          })
          .catch(error => {
            console.log(error);
          });
        });
      })
      .catch(error => {
        console.log(error);
      });
    });
  }
  handleResponseChange(e) {
    this.setState({hypothesis: e.target.value});
  }
  componentDidMount() {
    const { match: { params } } = this.props;
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" + encodeURIComponent('Please log in or sign up so that you can get credit for your generated examples.') +
        '&src=' + encodeURIComponent("/tasks/" + params.taskId + "/create")
      );
    }

    this.setState({taskId: params.taskId}, function() {
      this.context.api.getTask(this.state.taskId)
      .then(result => {
        result.targets = result.targets.split('|'); // split targets
        this.setState({task: result}, function() {
          this.getNewContext();
        });
      })
      .catch(error => {
        console.log(error);
      });
    });
  }
  updateAnswer(value) {
    this.setState({answer: value});
  }
  render() {
    const content = this.state.content.map((item, index) =>
      item.cls == 'context' ?
        <ContextInfo
          key={index}
          index={index}
          text={item.text}
          targets={this.state.task.targets}
          curTarget={this.state.target}
          taskType={this.state.task.shortname}
          answer={this.state.answer}
          updateAnswer={this.updateAnswer}
        />
        :
        <ResponseInfo
          key={index}
          index={index}
          targets={this.state.task.targets}
          obj={item}
          mapKeyToExampleId={this.state.mapKeyToExampleId}
          content={this.state.content}
        />
    );
    return (
      <Container>
        <Explainer taskName={this.state.task.name} />
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
              style={{width: '100%', margin: 2}}
              placeholder={this.state.task.shortname == 'QA' ? 'Enter question..' : 'Enter hypothesis..'}
              value={this.state.hypothesis}
              onChange={this.handleResponseChange}
            />
          </InputGroup>
          <InputGroup>
            <small className="form-text text-muted">Please enter your input. Remember, the goal is to find an example that the model gets wrong but that another person would get right. Load time may be slow; please be patient.</small>
          </InputGroup>
          <InputGroup>
            <Button className="btn btn-primary" style={{marginRight: 2}} onClick={this.handleResponse} disabled={this.state.submitDisabled}>Submit <i className={this.state.submitDisabled ? "fa fa-cog fa-spin" : ""} /></Button> <Button className="btn btn-secondary" onClick={this.getNewContext} disabled={this.state.refreshDisabled}>Switch to next context</Button>
          </InputGroup>
        </Row>
      </Container>
    );
  }
}

export default CreateInterface;
