import React, { useState, useEffect, useContext } from "react";
import { Spinner } from "react-bootstrap";
import UserContext from "../../containers/UserContext";

const FloresTaskDescription = ({ taskId }) => {
  const context = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);
  const [task, setTask] = useState({});

  useEffect(() => {
    setIsLoading(true);
    context.api.getTask(taskId).then(
      (result) => {
        setTask(result);
      },
      (error) => {
        console.log(error);
      }
    );
    setIsLoading(false);
    return () => {};
  }, [taskId, context.api]);

  if (isLoading) return <Spinner animation="border" />;
  return (
    <>
      <h5>{task.name}</h5>
      <p>
        <span className="font-weight-bold">Description: </span> {task.desc}
      </p>
    </>
  );
};

export default FloresTaskDescription;
