import React from "react";
import { useEffect, useState, useContext } from "react";
import { Card, Pagination } from "react-bootstrap";
import UserContext from "../../containers/UserContext";
import OldModelLeaderboard from "./OldModelLeaderboard";

/**
 * @deprecated Remove once dynaboard in launched. @see TaskLeaderboardCard
 *
 * @param {*} props
 */
const OldTaskLeaderboardCard = (props) => {
  const [data, setData] = useState([]);
  const [tags, setTags] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);

  const taskId = props.taskId;

  const fetchOverallModelLeaderboard = (api, page) => {
    api
      .getOverallModelLeaderboard(
        taskId,
        props.location.hash.replace("#", ""),
        10,
        page
      )
      .then(
        (result) => {
          // const isEndOfPage = (page + 1) * this.state.pageLimit >= result.count;
          setData(result.data);
          setTags(result.leaderboard_tags);
        },
        (error) => {
          console.log(error);
        }
      );
  };

  const paginate = (component, state) => {};

  const context = useContext(UserContext);

  useEffect(() => {
    setIsLoading(true);
    fetchOverallModelLeaderboard(context.api, page);
    setIsLoading(false);
    return () => {};
  }, [page]);

  if (!data) {
    return null;
  }

  return (
    <Card className="my-4">
      <Card.Header className="p-3 light-gray-bg">
        <h2 className="text-uppercase m-0 text-reset">
          {props && props.location && props.location.hash === "#overall"
            ? "Overall Model Leaderboard"
            : "Round " + props.displayRoundId + " Model Leaderboard"}
        </h2>
      </Card.Header>
      <Card.Body className="p-0 leaderboard-container">
        <OldModelLeaderboard
          data={data}
          tags={tags}
          taskShortName={props.task.shortname}
        />
      </Card.Body>
      <Card.Footer className="text-center">
        <Pagination className="mb-0 float-right" size="sm">
          <Pagination.Item
            // disabled={!this.state.modelLeaderBoardPage}
            onClick={() => paginate("model", "previous")}
          >
            Previous
          </Pagination.Item>
          <Pagination.Item
            // disabled={this.state.isEndOfModelLeaderPage}
            onClick={() => paginate("model", "next")}
          >
            Next
          </Pagination.Item>
        </Pagination>
      </Card.Footer>
    </Card>
  );
};
export default OldTaskLeaderboardCard;
