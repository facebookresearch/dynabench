import React from 'react';
import {
  Container,
  Col,
  Row,
  Card,
  CardGroup,
  Table
} from 'react-bootstrap';
import Moment from 'react-moment';

import UserContext from './UserContext';

class TasksPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      tasks: []
    }
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
    const taskCards = this.state.tasks.map((task, index) =>
      <Col sm={6} lg={3}>
        <Card key={task.id} className="task-card" onClick={() => this.props.history.push("/tasks/" + task.id)}>
          <h2 className="task-header text-uppercase text-center">{task.name} ({task.shortname})</h2>
          <Card.Body>
            <Card.Text className="text-center">
              {task.desc}
            </Card.Text>
            <Table>
            <thead></thead>
            <tbody>
            <tr><td>Round:</td><td>{task.cur_round}</td></tr>
            <tr><td>Verified/Collected</td><td>{task.round.total_verified}/{task.round.total_collected}</td></tr>
            <tr><td>(Model error rate):</td><td>({task.round.total_collected > 0 ? (task.round.total_verified / task.round.total_collected).toFixed(2) : '0.00'}%)</td></tr>
            <tr><td>Last update:</td><td><Moment utc fromNow>{task.last_updated}</Moment></td></tr>
            </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>
    );
    return (
      <Container>
        <Row>
          <h2 className="text-uppercase">Tasks</h2>
        </Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
          {taskCards}
          </CardGroup>
        </Row>
      </Container>
    );
  }
}

export default TasksPage;
