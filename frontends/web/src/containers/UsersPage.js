/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { OverallUserLeaderBoard } from "./OverallUserLeaderboard";
import {
  Card,
  Pagination,
} from "react-bootstrap";
import UserContext from "./UserContext";


class UsersPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      userLeaderBoardData: [],
      isEndOfModelLeaderPage: true,
      userLeaderBoardPage: 0,
      pageLimit: 10,
    }
  }

  componentDidMount() {
    this.fetchUserLeaderboardPage(0)
  }

  fetchUserLeaderboardPage(page) {
    this.context.api
    .getUsersLeaderboard(
      this.state.pageLimit,
      page
    )
    .then((result) => {
      const isEndOfPage = (page + 1) * this.state.pageLimit >= result.count;
      this.setState({
        isEndOfUserLeaderPage: isEndOfPage,
        userLeaderBoardData: result.data,
      });
  }, (error) => {
    console.log(error);
  });
  }

  paginate = (state) => {
    var isNext = (state === "next")
    var userLeaderBoardPage = isNext ? this.state.userLeaderBoardPage + 1 : this.state.userLeaderBoardPage - 1
    this.setState(
      {
        userLeaderBoardPage: userLeaderBoardPage
      },
      () => {
        this.fetchUserLeaderboardPage(this.state.userLeaderBoardPage);
      }
    );
  };

  render() {
    return (
      <Card className="my-4">
        <Card.Header className="p-3 light-gray-bg">
          <h2 className="text-uppercase m-0 text-reset">
            Global Users Leaderboard
          </h2>
        </Card.Header>
        <Card.Body className="p-0 leaderboard-container">
          <OverallUserLeaderBoard
            data={this.state.userLeaderBoardData}
          />
        </Card.Body>
        <Card.Footer className="text-center">
          <Pagination className="mb-0 float-right" size="sm">
            <Pagination.Item
              disabled={!this.state.userLeaderBoardPage}
              onClick={() => this.paginate("previous")}
            >
              Previous
            </Pagination.Item>
            <Pagination.Item
              disabled={this.state.isEndOfUserLeaderPage}
              onClick={() => this.paginate("next")}
            >
              Next
            </Pagination.Item>
          </Pagination>
        </Card.Footer>
      </Card>
    )
  }
}

export default UsersPage;
