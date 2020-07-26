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

// import UserContext from './UserContext';
import { TokenAnnotator, TextAnnotator } from 'react-text-annotate'

class Explainer extends React.Component {
  render() {
    return (
      <Row>
        <h2 className="text-uppercase">Find examples that fool the model - {this.props.taskName}</h2> <small style={{ marginTop: 40, marginLeft: 20, fontSize: 10 }}>(<a href="#" className="btn-link">Need an explainer?</a>)</small>
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
          <small>Your goal: enter a question and select an answer in the context, such that the model is fooled.</small>
        </>
        :
        <><div className='context'>{this.props.text}</div><small>Your goal: enter a <strong>{this.props.targets[this.props.curTarget]}</strong> statement that fools the model.</small></>
    );
  }
}

class CreateInterface extends React.Component {
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
      total_tries: 10, // NOTE: Set this to your preferred value
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
      this.props.providerWorkerId
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
      this.api.getModelResponse(this.state.task.round.url, modelInputs)
        .then(result => {
          if (this.state.task.type != 'extract') {
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
          console.log(this.props)
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
          const metadata = {
            'annotator_id': this.props.providerWorkerId,
            'mephisto_id': this.props.mephistoWorkerId,
            'model': 'model-name-unknown'
          };
          this.api.storeExample(
            this.state.task.id,
            this.state.task.cur_round,
            'turk',
            this.state.context.id,
            this.state.hypothesis,
            this.state.target,
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
          <div key={index} className={item.cls + ' rounded border ' + (item.retracted ? 'border-warning' : (item.fooled ? 'border-success' : 'border-danger'))}  style={{ minHeight: 120 }}>
            <Row>
              <div className="col-sm-9">
                <div>{item.text}</div>
                <small>{
                  item.retracted ?
                  <>
                    <span><strong>Example retracted</strong> - thanks. The model predicted <strong>{this.state.task.targets[item.modelPredStr]}</strong>. Please try again!</span>
                  </>
                  :
                  (item.fooled ?
                    <>
                      <span><strong>Well done!</strong> You fooled the model. The model predicted <strong>{this.state.task.targets[item.modelPredStr]}</strong> instead. </span><br />
                      <span>Made a mistake? You can still <a href="#" data-index={index} onClick={this.retractExample} className="btn-link">retract this example</a>. Otherwise, we will have it verified.</span>
                    </>
                    :
                    <>
                      <span><strong>Bad luck!</strong> The model correctly predicted <strong>{this.state.task.targets[item.modelPredStr]}</strong>. Try again.</span>
                      <span>We will still store this as an example that the model got right. You can <a href="#" data-index={index} onClick={this.retractExample} className="btn-link">retract this example</a> if you don't want it saved.</span>
                    </>
                  )
                }</small>
              </div>
              <div className="col-sm-3" style={{textAlign: 'right'}}>
              </div>
            </Row>
          </div>
    );
    if (this.state.taskCompleted) {
      var taskTracker = <Button className="btn btn-primary btn-success" onClick={this.handleTaskSubmit}>Submit HIT</Button>;
    } else {
      var taskTracker = <small style={{padding: 7}}>Tries: {this.state.tries} / {this.state.total_tries}</small>;
    }
    return (
      <Container>
        <Row>
          <h2>Find examples that fool the model - {this.state.task.name}</h2> <small style={{marginTop: 40, marginLeft: 20, fontSize: 10}}></small>
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
            <small className="form-text text-muted">Please enter your input. Remember, the goal is to find an example that the model gets wrong but that another person would get right. Load time may be slow; please be patient.</small>
          </InputGroup>
          <InputGroup>
            <Button className="btn btn-primary" style={{marginRight: 2}} onClick={this.handleResponse} disabled={this.state.submitDisabled}>Submit <i className={this.state.submitDisabled ? "fa fa-cog fa-spin" : ""} /></Button>
            <Button className="btn btn-secondary" style={{marginRight: 2}} onClick={this.getNewContext} disabled={this.state.refreshDisabled}>Switch to next context</Button>
            {taskTracker}
          </InputGroup>
        </Row>
      </Container>
    );
  }
}

export { CreateInterface };
