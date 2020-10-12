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

class ContextInfoAns extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text :'national enquirer the national enquirer ( also commonly known as the enquirer ) is an american supermarket tabloid published by american media inc ( ami ) . founded in 1926 , the tabloid has gone through a number of changes over the years . the " enquirer " openly acknowledges that it will pay sources for tips , a practice generally disapproved of by the mainstream press . the tabloid has struggled with declining circulation figures because of competition from glossy tabloid publications . in may 2014 , american media announced a decision to shift the headquarters of the " national enquirer " from florida , where it had been located since 1971'}; 
  }
  render() {
    return (
      <>
        <TokenAnnotator
          style={{
            lineHeight: 1.5,
          }}
          className='context'
          tokens={this.state.text.split(' ')}
          value = {this.props.answer}
	  onChange={this.props.updateAnswer}
	  getSpan={span => ({
              ...span,
              tag: 'ANS',
            })}
        />
        <small>Your goal: Select an answer in the context that answers the question below.</small>
      </>
    );
  }
}

class ContextInfoQues extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text :'national enquirer the national enquirer ( also commonly known as the enquirer ) is an american supermarket tabloid published by american media inc ( ami ) . founded in 1926 , the tabloid has gone through a number of changes over the years . the " enquirer " openly acknowledges that it will pay sources for tips , a practice generally disapproved of by the mainstream press . the tabloid has struggled with declining circulation figures because of competition from glossy tabloid publications . in may 2014 , american media announced a decision to shift the headquarters of the " national enquirer " from florida , where it had been located since 1971'};
  }
  render() {
    return (
      <>
        <TokenAnnotator
          style={{
            lineHeight: 1.5,
          }}
          className='context'
          tokens={this.state.text.split(' ')}
	  value={this.props.answer}
        />
        <small>Your goal: enter a question for which the highlighted span of text in this passage is the correct answer.</small>
      </>
    );
  }
}

class CreateInterfaceOnboardingAns extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {hypothesis: "", task: {}, answer: [], answerNotSelected: true, target: 0};
    this.handleResponseChange = this.handleResponseChange.bind(this);
    this.updateAnswer = this.updateAnswer.bind(this);    
  }
  updateAnswer(value) {
    if (value.length > 0) {
      this.setState({
        answer: [value[value.length - 1]],
        answerNotSelected: false,
      });
    } else {
        this.setState({ answer: value, answerNotSelected: false });
    }
  }
  handleResponseChange(e) {
    this.setState({hypothesis: e.target.value});
  }

  render() {
    const answers = {1:["mainstream press", "the mainstream press"], 2:['1971'], 3:['american media inc ( ami )', 'american media inc'], 4:['american supermarket tabloid', 'an american supermarket tabloid'], 5:['declining circulation figures because of competition from glossy tabloid publications', 'declining circulation figures']};
    const questions = ['Who disapproves of paying sources for tips?', 'When were the National Enquirer Headquarters in Florida established?', 'Who publishes the National Enquirer?', 'What is the National Enquirer?', 'What is the problem faced by the National Enquirer?'];
    var content = <ContextInfoAns
	             answer={this.state.answer}
                     updateAnswer={this.updateAnswer}
		    />
    var answer_correct = <></>;
    if (this.state.answer.length > 0) {
      var last_answer = this.state.answer[this.state.answer.length - 1];
      var answer_text = last_answer.tokens.join(" ");
      if (answers[this.props.step].includes(answer_text))
        {answer_correct = <Row>Correct Answer.</Row>;}
      else if (answer_text.includes(answers[this.props.step][0])){
        if (this.props.step==2) 
          {answer_correct = <Row>Your answer is partially correct, the correct answer is {answers[this.props.step][0]}. Remember to select the shortest possible span of text that completely answers the given question.</Row>;}
	else
	  {answer_correct = <Row>Your answer is partially correct, the correct answer is {answers[this.props.step][0]} or {answers[this.props.step][1]}. Remember to select the shortest possible span of text that completely answers the given question.</Row>;}
      }
      else {
        if (this.props.step==2)
	  {answer_correct = <Row>Wrong Answer! Correct answer is {answers[this.props.step][0]}</Row>;}
        else
          {answer_correct = <Row>Wrong Answer! Correct answer is {answers[this.props.step][0]} or {answers[this.props.step][1]}</Row>;}
      }
    }
    return (
      <Container>
        <Row>
          <h2>Given the question, highlight the correct answer. 1/5</h2>
	</Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
            <Card border='dark'>
              <Card.Body style={{height: 300, overflowY: 'scroll'}}>
	        {content}
              </Card.Body>
            </Card>
          </CardGroup>
	  {this.props.step!=10 && <InputGroup>
            <br />Question: {questions[this.props.step-1]}<br /><br />
          </InputGroup>}
	  {this.props.step==10 && <> <InputGroup>
            <FormControl
              style={{ width: '100%', margin: 2 }}
              placeholder={'Enter question..'}
              value={this.state.hypothesis}
              onChange={this.handleResponseChange}
            />
            </InputGroup>
            <InputGroup>
              <small className="form-text text-muted">Please enter your input. Remember, the goal is to generate an example in accordance with the instructions. Load time may be slow; please be patient.</small> <br />
            </InputGroup></>}
	</Row>
	{answer_correct}
      </Container>
    );
  }
}

class CreateInterfaceOnboardingQues extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {hypothesis: "", task: {}, answer: [], target: 0};
    this.handleResponseChange = this.handleResponseChange.bind(this);
  }
  handleResponseChange(e) {
    this.setState({hypothesis: e.target.value});
  }
  render() {
    const answers = {6:[{start:0, end:2, tag:"ANS"}], 7:[{start:85, end:87, tag:"ANS"}], 8:[{start:53, end:57, tag:"ANS"}], 9:[{start:78, end:83, tag:"ANS"}]}
    const content = <ContextInfoQues
	              answer={answers[this.props.step]} />
    return (
      <Container>
        <Row>
          <h2>Generate Question for the given answer. 1/4</h2>
        </Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
            <Card border='dark'>
              <Card.Body style={{height: 300, overflowY: 'scroll'}}>
                {content}
              </Card.Body>
            </Card>
          </CardGroup>
          <InputGroup>
            <FormControl
              style={{ width: '100%', margin: 2 }}
              placeholder={'Enter question..'}
              value={this.state.hypothesis}
              onChange={this.handleResponseChange}
            />
          </InputGroup>
          <InputGroup>
            <small className="form-text text-muted">Please enter your input. Remember, the goal is to generate an example in accordance with the instructions. Load time may be slow; please be patient.</small><br />
          </InputGroup>
        </Row>
      </Container>
    );
  }
}

export { CreateInterfaceOnboardingAns, CreateInterfaceOnboardingQues };

