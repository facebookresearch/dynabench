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

class ContextInfo extends React.Component {
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

class CreateInterfaceOnboardingStep1 extends React.Component {
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
    const content = <ContextInfo
	             answer={this.state.answer}
                     updateAnswer={this.updateAnswer}
		    />
    {/*console.log(this.state);*/}
    var answer_correct = <></>;
    if (this.state.answer.length > 0) {
      var last_answer = this.state.answer[this.state.answer.length - 1];
      var answer_text = last_answer.tokens.join(" ");
      if (answer_text == "mainstream press")
	{answer_correct = <Row>Correct Answer.</Row>;}
      else if (answer_text == "the mainstream press")
        {answer_correct = <Row>Correct Answer.</Row>;}
      else if (answer_text.includes("mainstream press"))
        {answer_correct = <Row>Your answer is partially correct, the correct answer is "mainstream press" or "the mainstream press". Remember to select the shortest possible span of text that completely answers the given question.</Row>;}
      else
	{answer_correct = <Row>Wrong Answer! Correct answer is "mainstream press" or "the mainstream press"</Row>;}
    }
    console.log(this.state);
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
	  {/*console.log(this.state)*/}
	    {/*<InputGroup>
            <FormControl
              style={{ width: '100%', margin: 2 }}
              placeholder={'Enter question..'}
              value={this.state.hypothesis}
              onChange={this.handleResponseChange}
            />
          </InputGroup>*/}
          <InputGroup>
            <br />Question: Who disapproves of paying sources for tips?<br /><br />
          </InputGroup>
	</Row>
	{answer_correct}
      </Container>
    );
  }
}

export { CreateInterfaceOnboardingStep1 };

