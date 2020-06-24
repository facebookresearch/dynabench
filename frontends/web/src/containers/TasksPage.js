import React from "react";
import { Container, Row, Card, CardGroup, Table } from "react-bootstrap";
import Moment from "react-moment";

import UserContext from "./UserContext";

class TasksPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      tasks: [],
    };
  }
  componentDidMount() {
    this.context.api
      .getTasks()
      .then((result) => {
        this.setState({ tasks: result });
      })
      .catch((error) => {
        console.log(error);
      });
  }
  render() {
    const taskCards = this.state.tasks.map((task, index) => (
      <CardGroup key={task.id} style={{ marginTop: 20, width: "100%" }}>
        {task.hidden === "False" ? (
          <Card
            className="taskCard"
            onClick={() => this.props.history.push("/tasks/" + task.id)}
          >
            <span
              className={
                index < 3
                  ? "taskHeader taskHeaderRight"
                  : "taskHeader taskHeaderLeft"
              }
            >
              <h2 className="text-uppercase">
                {task.name} ({task.shortname})
              </h2>
            </span>
            <Card.Body>
              <Card.Text>{task.desc}</Card.Text>
              <Table className="table-striped">
                <thead></thead>
                <tbody>
                  <tr>
                    <td>Round:</td>
                    <td>{task.cur_round}</td>
                  </tr>
                  <tr>
                    <td>
                      Verified/Collected
                      <br />
                      (model error rate):
                    </td>
                    <td>
                      {task.round.total_verified}/{task.round.total_collected}
                      <br />(
                      {task.round.total_collected > 0
                        ? (
                          task.round.total_verified /
                          task.round.total_collected
                        ).toFixed(2)
                        : "0.00"}
                      %)
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
            <Card.Footer>
              <small className="text-muted">
                Last updated{" "}
                <Moment utc fromNow>
                  {task.last_updated}
                </Moment>
              </small>
            </Card.Footer>
          </Card>
        ) : (null)}
      </CardGroup>
    ));
    return (
      <Container>
        <Row>
          <h2>TASKS</h2>
        </Row>
        <Row>{taskCards}</Row>
      </Container>
    );
  }
}

export default TasksPage;
