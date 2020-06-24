import React from 'react';
import {
  Col,
  Container,
  Row,
  Jumbotron,
  Table,
  Button,
  Card,
  CardGroup
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import UserContext from './UserContext';
import './HomePage.css';
import Moment from 'react-moment';

class HomePageTable extends React.Component {
  render() {
    return <>
      <h2 className="text-uppercase">{this.props.title}</h2>
      <Table striped bordered hover>
        <thead>
          {this.props.th}
        </thead>
        <tbody>
          {this.props.items}
        </tbody>
      </Table>
      </>
  }
}

class TaskTable extends React.Component {
  static contextType = UserContext;
  state = {
    tasks: []
  }
  componentDidMount() {
    this.context.api.getTasks()
    .then(result => {
      this.setState({tasks: result.tasks})
    })
    .catch(error => {
      console.log(error);
    });
  }
  render() {
    const headItems = <tr><th>Task</th><th>Stats</th></tr>;
    const taskItems = this.state.tasks.map((task) =>
      <tr key={task.id}><td><Link className="btn-link" to={'/tasks/' + task.id}>{task.name}</Link></td><td>{task.stats}</td></tr>
    );
    return <HomePageTable title='Tasks' th={headItems} items={taskItems} />
  }
}

class UserTable extends React.Component {
  static contextType = UserContext;
  state = {
    users: []
  }
  componentDidMount() {
    this.context.api.getUsers()
    .then(result => {
      this.setState({users: result})
    })
    .catch(error => {
      console.log(error);
    });
  }
  render() {
    const headItems = <tr><th>User</th><th>Stats</th></tr>;
    const userItems = this.state.users.map((user) =>
      <tr key={user.id}><td><Link className="btn-link" to={'/users/' + user.id}>{user.username}</Link></td><td>n/a</td></tr>
    );
    return <HomePageTable title='Users' th={headItems} items={userItems} />
  }
}

class HomePage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      showjumbo: true,
      tasks: []
    };
    this.hideJumbo = this.hideJumbo.bind(this);
  }
  hideJumbo() {
    this.setState({showjumbo: false});
  }
  componentDidMount() {
    this.context.api.getTasks()
    .then(result => {
      this.setState({tasks: result})
    })
    .catch(error => {
      console.log(error);
    });
  }
  render() {
    /*
    const tasks = [
      {id: 1, name: 'NLI', desc: 'Natural Language Inference is classifying context-hypothesis pairs into whether they entail, contradict or are neutral.', round: 4, examples: 123, verified: 123, tries_per: 8, time_per: 120},
      {id: 2, name: 'QA', desc: 'Question answering and machine reading comprehension is answering a question given a context.', round: 1, examples: 123, verified: 123, tries_per: 8, time_per: 120},
      {id: 3, name: 'SENTIMENT', desc: 'Sentiment analysis is classifying one or more sentences by their positive or negative sentiment.', round: 1, examples: 123, verified: 123, tries_per: 8, time_per: 120},
      {id: 4, name: 'NLVR', desc: 'Natural language and visual reasoning is deciding if an image and sentence or caption belong together or not.', round: 1, examples: 123, verified: 123, tries_per: 8, time_per: 120},
      {id: 5, name: 'HATE SPEECH', desc: 'Hate speech detection is classifying one or more sentences by whether or not they constitute hate speech.', round: 1, examples: 123, verified: 123, tries_per: 8, time_per: 120}
    ];
    */
    const taskCards = !this.state.tasks ? <p>No tasks found</p> : this.state.tasks.map((task, index) =>
      <Col md={6} lg={3}>
      <Card key={task.id} className="taskCard" onClick={() => this.props.history.push("/tasks/" + task.id)}>
        <h2 className="taskHeader blue-color text-uppercase text-center">{task.name}</h2>
        <Card.Body>
          <Card.Text className="text-center">
            {task.desc}
          </Card.Text>
          <Table className="table-striped">
          <thead></thead>
          <tbody>
          <tr><td>Round:</td><td>{task.cur_round}</td></tr>
          <tr><td>Verified/Collected<br/>(model error rate):</td><td>{task.round.total_verified}/{task.round.total_collected}<br/>({task.round.total_collected > 0 ? (task.round.total_verified / task.round.total_collected).toFixed(2) : '0.00'}%)</td></tr>
          </tbody>
          </Table>
        </Card.Body>
        <Card.Footer>
          <small className="text-muted">
           Last updated  <Moment utc fromNow>{task.last_updated}</Moment>
          </small>
        </Card.Footer>
      </Card>
      </Col>
    );
    return (
      <>
      <div className={"jumbotron jumboSlider " + (this.state.showjumbo ? "" : "hideJumbo")}>
        <Container>
          <Row className="justify-content-center text-center">
            <h1>Rethinking AI Benchmarking</h1>
            <p>DynaBench is a research platform for dynamic adversarial data collection and benchmarking. Static benchmarks have well-known issues: they saturate quickly, are susceptible to overfitting, contain exploitable annotator artifacts and have unclear or imperfect evaluation metrics.<br></br><br></br> This platform essentially is a scientific experiment: can we make faster progress if we collect data dynamically, with humans and models in the loop, rather than in the old-fashioned static way?</p>
            <Button className="button-ellipse" as={Link} to="/about" variant="primary">Read more</Button>
          </Row>
        </Container>
      </div>
      <Container className="homeCardgroup">
        <h2 className="header font-weight-light d-block text-center">Tasks</h2>
        <CardGroup>
          {taskCards}
        </CardGroup>
      </Container>
      </>
    );
  }
}

export default HomePage;
