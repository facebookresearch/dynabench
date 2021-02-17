/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import Magnifier from "react-magnifier";

class AtomicImage extends React.Component {
   render() {
      console.log(this.props.src)
      if (this.props.src && this.props.src.length > 0) {
         return <>
            <div style={{alignSelf: "center"}}>
               <Magnifier
                  mgWidth={250}
                  mgHeight={250}
                  width={"auto"}
                  height={"auto"}
                  src={this.props.src}
                  mgShape={"square"}
                  style={{
                     display: "block"
                  }}
               />
            </div>
         </>
      } else {
         return (
            <div className="mb-1 p-3 light-gray-bg">
               Loading...
            </div>
         )
      }
   }
}

export default AtomicImage;
