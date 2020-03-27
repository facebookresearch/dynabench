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

class CreateInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: null,
      roundId: null,
      task: {},
      context: null,
      response: "",
      content: [],
      submitDisabled: true,
      refreshDisabled: true
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
  }
  getNewContext() {
    this.setState({submitDisabled: true, refreshDisabled: true}, function () {
      this.context.api.getRandomContext(this.state.taskId, this.state.task.cur_round)
      .then(result => {
        this.setState({context: result, content: [{cls: 'context', text: result.context}], submitDisabled: false, refreshDisabled: false});
      })
      .catch(error => {
        console.log(error);
      });
    });
  }
  handleResponse() {
    this.setState({submitDisabled: true, refreshDisabled: true}, function () {
      // TODO: Do API call to get model response, then another API call to store the data
      this.setState({content: [...this.state.content, {cls: 'response', text: this.state.response}]}, function() {
        this.setState({response: "", submitDisabled: false, refreshDisabled: false});
      });
    });
  }
  handleResponseChange(e) {
    this.setState({response: e.target.value});
  }
  componentDidMount() {
    const { match: { params } } = this.props;
    this.setState({taskId: params.taskId}, function() {
      this.context.api.getTask(this.state.taskId)
      .then(result => {
        this.setState({task: result}, function() {
          this.getNewContext();
        });
      })
      .catch(error => {
        console.log(error);
      });
    });
  }
  render() {
    console.log(this.state);
    const content = this.state.content.map((item, index) =>
      <p key={index} className={item.cls}>{item.text}</p>
    );
    return (
      <Container>
        <Row>
          <h2>Find examples that fool the model - {this.state.task.name}</h2> <small style={{marginTop: 40, marginLeft: 20, fontSize: 10}}>(<a href="#" className="btn-link">Need an explainer?</a>)</small>
        </Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
            <Card border='dark'>
              <Card.Body style={{minHeight: 400}}>
                {content}
              </Card.Body>
            </Card>
          </CardGroup>
          <InputGroup>
            <FormControl style={{width: '100%', margin: 2}} placeholder="Enter hypothesis.." value={this.state.response} onChange={this.handleResponseChange} />
          </InputGroup>
          <InputGroup>
            <small className="form-text text-muted">Please enter your input. Remember, the goal is to find an example that the model gets wrong but that another person would get right. Load time may be slow; please be patient.</small>
          </InputGroup>
          <InputGroup>
            <Button className="btn btn-primary" style={{marginRight: 2}} onClick={this.handleResponse} disabled={this.state.submitDisabled}>Submit</Button> <Button className="btn btn-secondary" onClick={this.getNewContext} disabled={this.state.refreshDisabled}>Switch to next context</Button>
          </InputGroup>
        </Row>
      </Container>
    );
  }
}

export default CreateInterface;
