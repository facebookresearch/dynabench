import React, { useContext, useEffect, useState } from "react";
import UserContext from "../../containers/UserContext";
import {
  Card,
  Dropdown,
  DropdownButton,
  OverlayTrigger,
  Pagination,
  Table,
  Tooltip,
} from "react-bootstrap";
import { Annotation } from "../../containers/Overlay";
import { Avatar } from "../Avatar/Avatar";
import { Link } from "react-router-dom";

const UserLeaderboardCard = (props) => {
  const context = useContext(UserContext);
  const [pageLimit, setPageLimit] = useState(7);
  const [isEndOfUserLeaderPage, setIsEndOfUserLeaderPage] = useState(true);
  const [userLeaderBoardData, setUserLeaderBoardData] = useState([]);
  const [displayRound, setDisplayRound] = useState("overall");
  const [userLeaderBoardPage, setUserLeaderBoardPage] = useState(0);

  const fetchOverallUserLeaderboard = (page, displayRound) => {
    context.api
      .getOverallUserLeaderboard(props.taskId, displayRound, pageLimit, page)
      .then(
        (result) => {
          const isEndOfPage = (page + 1) * pageLimit >= result.count;
          setIsEndOfUserLeaderPage(isEndOfPage);
          setUserLeaderBoardData(result.data);
          setDisplayRound(displayRound);
          setUserLeaderBoardPage(page);
        },
        (error) => {
          console.log(error);
        }
      );
  };

  const paginate = (state, round) => {
    const page =
      state === "next"
        ? this.state.userLeaderBoardPage + 1
        : this.state.userLeaderBoardPage - 1;
    fetchOverallUserLeaderboard(page, round);
  };

  useEffect(() => {
    setUserLeaderBoardPage(0);
    setDisplayRound("overall");
    setIsEndOfUserLeaderPage(true);
    fetchOverallUserLeaderboard(userLeaderBoardPage, displayRound);
  }, [props.taskId]);

  const rounds = (props.round && props.cur_round) || 0;
  const roundNavs = [];
  for (let i = rounds; i >= 0; i--) {
    let cur = "";
    let active = false;
    if (i === props.cur_round) {
      cur = " (active)";
    }
    const dropDownRound = i === 0 ? "overall" : i;
    if (dropDownRound === displayRound) {
      active = true;
    }
    roundNavs.push(
      <Dropdown.Item
        key={dropDownRound}
        index={dropDownRound}
        onClick={() => fetchOverallUserLeaderboard(0, dropDownRound)}
        active={active}
      >
        {dropDownRound === "overall" ? "Overall" : "Round " + dropDownRound}
        {cur}
      </Dropdown.Item>
    );
    if (i === props.cur_round) {
      roundNavs.push(<Dropdown.Divider key={"div" + i} />);
    }
  }
  return (
    <Annotation
      placement="left"
      tooltip="This shows how well our users did on this task. This does not include non-Dynabench users such as Mechanical Turkers."
    >
      <Card className="my-4">
        <Card.Header className="light-gray-bg d-flex align-items-center">
          <h2 className="text-uppercase m-0 text-reset">User Leaderboard</h2>
          <div className="d-flex justify-content-end flex-fill">
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="tip-user-round-selection">Switch Round</Tooltip>
              }
            >
              <DropdownButton
                variant="light"
                className="border-0 blue-color font-weight-bold light-gray-bg"
                style={{ marginRight: 10 }}
                id="dropdown-basic-button"
                title={
                  displayRound === "overall"
                    ? "Overall"
                    : "Round " +
                      displayRound +
                      (props.cur_round === displayRound ? " (active)" : "")
                }
              >
                {roundNavs}
              </DropdownButton>
            </OverlayTrigger>
          </div>
        </Card.Header>
        <Table hover className="mb-0">
          <thead>
            <tr>
              <th>User</th>
              <th className="text-right">Verified MER</th>
              <th className="text-right pr-4">Totals</th>
            </tr>
          </thead>
          <tbody>
            {userLeaderBoardData.map((data) => {
              return (
                <tr key={data.uid}>
                  <td>
                    <Avatar
                      avatar_url={data.avatar_url}
                      username={data.username}
                      isThumbnail={true}
                      theme="blue"
                    />
                    <Link
                      to={`/users/${data.uid}#profile`}
                      className="btn-link"
                    >
                      {data.username}
                    </Link>
                  </td>
                  <td className="text-right">{data.MER}%</td>
                  <td className="text-right pr-4">{data.total}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <Card.Footer className="text-center">
          <Pagination className="mb-0 float-right" size="sm">
            <Pagination.Item
              disabled={!userLeaderBoardPage}
              onClick={() => paginate("previous", displayRound)}
            >
              Previous
            </Pagination.Item>
            <Pagination.Item
              disabled={isEndOfUserLeaderPage}
              onClick={() => paginate("next", displayRound)}
            >
              Next
            </Pagination.Item>
          </Pagination>
        </Card.Footer>
      </Card>
    </Annotation>
  );
};

export default UserLeaderboardCard;
