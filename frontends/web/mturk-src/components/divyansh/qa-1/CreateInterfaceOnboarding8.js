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
          value = {[{start:53, end:57, tag:"ANS"}]}
        />
        <small>Your goal: enter a question for which the highlighted span of text in this passage is the correct answer.</small>
      </>
    );
  }
}

class CreateInterfaceOnboardingStep8 extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {hypothesis: "", task: {}, answer: [], target: 0};
    this.handleResponseChange = this.handleResponseChange.bind(this);
    this.updateAnswer = this.updateAnswer.bind(this);
    
  }
  updateAnswer(value) {
    this.setState({ answer: value, answerNotSelected: false });
  }
  handleResponseChange(e) {
    this.setState({hypothesis: e.target.value});
  }

  render() {
    const content = <ContextInfo/>
    return (
      <Container>
        <Row>
          <h2>Generate Question for the given answer. 3/4</h2>
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
            <small className="form-text text-muted">Please enter your input. Remember, the goal is to generate an example in accordance with the instructions. Load time may be slow; please be patient.</small> <br />
          </InputGroup>
	</Row>
      </Container>
    );
  }
}

export { CreateInterfaceOnboardingStep8 };

