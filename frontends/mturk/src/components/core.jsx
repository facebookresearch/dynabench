import React from "react";

class TaskDescription extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <h1>Task description</h1>;
  }
}

class TaskFrontend extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
  }
  render() {
    return <h1>Task frontend</h1>;
  }
}

export { TaskDescription, TaskFrontend };
