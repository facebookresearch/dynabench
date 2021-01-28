/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Avatar } from "../components/Avatar/Avatar";
import { Link } from "react-router-dom";
import { Table } from "react-bootstrap";

export const OverallUserLeaderBoard = (props) => {
    return (
      <Table hover bordered striped>
        <thead>
          <tr>
            <th>User</th>
            <th className="text-right">Verified MER</th>
            <th className="text-right pr-4">Totals</th>
          </tr>
        </thead>
        <tbody>
          {props.data.map((data) => {
            return (
              <tr key={data.uid}>
                <td>
                  <Avatar
                    avatar_url={data.avatar_url}
                    username={data.username}
                    isThumbnail={true}
                    theme="blue"
                  />
                  <Link to={`/users/${data.uid}#profile`} className="btn-link">
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
    );
  };
