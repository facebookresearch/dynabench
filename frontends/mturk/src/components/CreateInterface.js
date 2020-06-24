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

class CreateInterface extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {
      taskId: 1,
      task: {},
      context: null,
      target: 0,
      modelPred: null,
      hypothesis: "",
      content: [],
      submitDisabled: true,
      refreshDisabled: true,
      mapKeyToExampleId: {},
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
    this.retractExample = this.retractExample.bind(this);
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
    this.api.retractExample(this.state.mapKeyToExampleId[idx])
    .then(result => {
      const newContent = this.state.content.slice();
      newContent[idx].cls = 'retracted';
      newContent[idx].retracted = true;
      this.setState({content: newContent});
      console.log(newContent);
    })
    .catch(error => {
      console.log(error);
    });
  }
  handleResponse() {
    this.setState({submitDisabled: true, refreshDisabled: true}, function () {
      if (this.state.hypothesis.length == 0) {
        this.setState({submitDisabled: false, refreshDisabled: false});
        return;
      }

      this.api.getModelResponse(this.state.task.round.url, this.state.context.context, this.state.hypothesis)
      .then(result => {
        this.setState({
          content: [...this.state.content, {
            cls: 'hypothesis',
            modelPred: result.prob.indexOf(Math.max(...result.prob)),
            fooled: result.prob.indexOf(Math.max(...result.prob)) !== this.state.target,
            text: this.state.hypothesis,
            retracted: false,
            response: result}
        ]}, function() {
          // TODO: Insert mturk ID here
          this.api.storeExample(this.state.task.id, this.state.task.cur_round, 'turk', this.state.context.id, this.state.hypothesis, this.state.target, result)
          .then(result => {
            var key = this.state.content.length-1;
            this.setState({hypothesis: "", submitDisabled: false, refreshDisabled: false, mapKeyToExampleId: {...this.state.mapKeyToExampleId, [key]: result.id}},
              function () {
                if (this.state.content[this.state.content.length-1].fooled || this.state.content.length > 10) {
                  // TODO: Determine exactly when to trigger this
                  console.log('Success! You can submit HIT');
                  this.props.onSubmit(this.state.content);
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
  render() {
    const content = this.state.content.map((item, index) =>
      item.cls == 'context' ?
          <div key={index}><div className={item.cls}>{item.text}</div><small>Your goal: enter a <strong>{this.state.task.targets[this.state.target]}</strong> statement that fools the model.</small></div>
          :
          <div key={index} className={item.cls + ' rounded border ' + (item.retracted ? 'border-warning' : (item.fooled ? 'border-success' : 'border-danger'))}  style={{ minHeight: 120 }}>
            <Row>
              <div className="col-sm-9">
                <div>{item.text}</div>
                <small>{
                  item.retracted ?
                  <>
                  <span><strong>Example retracted</strong> - thanks. The model predicted <strong>{this.state.task.targets[item.modelPred]}</strong>. Please try again!</span>
                  </>
                  :
                  (item.fooled ?
                  <>
                  <span><strong>Well done!</strong> You fooled the model. The model predicted <strong>{this.state.task.targets[item.modelPred]}</strong> instead. </span><br/>
                  <span>Made a mistake? You can still <a href="#" data-index={index} onClick={this.retractExample} className="btn-link">retract this example</a>. Otherwise, we will have it verified.</span>
                  </>
                  :
                  <>
                  <span><strong>Bad luck!</strong> The model correctly predicted <strong>{this.state.task.targets[item.modelPred]}</strong>. Try again.</span>
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
            <FormControl style={{width: '100%', margin: 2}} placeholder="Enter hypothesis.." value={this.state.hypothesis} onChange={this.handleResponseChange} />
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

export { CreateInterface };
