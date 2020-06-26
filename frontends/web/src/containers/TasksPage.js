import React from "react";
import { Container, Col, Row, Card, CardGroup, Table } from "react-bootstrap";
import Moment from "react-moment";

import TasksContext from "./TasksContext";

class TasksPage extends React.Component {
  render() {
    const taskCards = ({ tasks }) =>
      tasks.length
        ? tasks.map((task, index) => (
            <Col sm={6} lg={3} key={task.id}>
              <Card
                className="task-card"
                onClick={() => this.props.history.push("/tasks/" + task.id)}
              >
                <h2 className="task-header text-uppercase text-center blue-color">
                  {task.name} ({task.shortname})
                </h2>
          <Card.Body>
                  <Card.Text className="text-center">{task.desc}</Card.Text>
            <Table>
            <thead></thead>
            <tbody>
                      <tr>
                        <td>Round:</td>
                        <td>{task.cur_round}</td>
                      </tr>
                      <tr>
                        <td>Verified/Collected</td>
                        <td>
                          {task.round.total_verified}/
                          {task.round.total_collected}
                        </td>
                      </tr>
                      <tr>
                        <td>(Model error rate):</td>
                        <td>
                          (
                          {task.round.total_collected > 0
                            ? (
                                task.round.total_verified /
                                task.round.total_collected
                              ).toFixed(2)
                            : "0.00"}
                          %)
                        </td>
                      </tr>
                      <tr>
                        <td>Last update:</td>
                        <td>
                          <Moment utc fromNow>
                            {task.last_updated}
                          </Moment>
                        </td>
                      </tr>
            </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>
          ))
        : "";
    return (
      <Container>
        <Row>
          <h2 className="text-uppercase">Tasks</h2>
        </Row>
        <Row>
          <CardGroup style={{ marginTop: 20, width: "100%" }}>
            <TasksContext.Consumer>
              {(tasks) => taskCards(tasks)}
            </TasksContext.Consumer>
          </CardGroup>
        </Row>
      </Container>
    );
  }
}

export default TasksPage;
