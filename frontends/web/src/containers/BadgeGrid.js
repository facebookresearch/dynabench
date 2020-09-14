/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  Card,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import Moment from "react-moment";
import "./BadgeGrid.css";
const BadgeGrid = (props) => {
  return (
    <Card style={{marginTop: 10, padding: 50, textAlign: 'center'}}>
      {props.user.badges ?
        <div className="image-grid-container">
        {
        props.user.badges.map(({name, awarded}, idx) =>
          <center key={idx}>
            <OverlayTrigger
              placement="top"
              delay={{ show: 250, hide: 400 }}
              overlay={(props) => <Tooltip {...props}>
                {name}<br/>
                <Moment utc fromNow>{awarded}</Moment>
                </Tooltip>}
            >
              <img src={"/badges/"+name+".png"} style={{width: 50, marginBottom: 10, cursor: 'pointer'}} />
            </OverlayTrigger>
          </center>
        )
        }
        </div>
      : 'No badges yet'}
    </Card>
  );
};

export default BadgeGrid;
