/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

class AtomicImage extends React.Component {

   constructor(props) {
      super(props);
      this.state = { isImgLoaded: false };
   }

   componentDidUpdate(prevProps) {
      if (prevProps.src !== this.props.src) {
         this.setState({ isImgLoaded: false });
      }
   }

   render() {
      const { src, maxWidth, maxHeight } = this.props;
      if (src && src.length > 0) {
         return (
            <div
               className="d-flex justify-content-center"
               onClick={() => this.state.isImgLoaded && this.props.setMagnifiedImageSrc && this.props.setMagnifiedImageSrc(src)}>
               <img
                  onLoad={() => this.setState({ isImgLoaded: true })}
                  src={src}
                  alt="atomicImage"
                  style={{
                     display: this.state.isImgLoaded ? "block" : "none",
                     alignSelf: "center",
                     maxHeight,
                     maxWidth
                  }}
               />
               {!this.state.isImgLoaded &&
                  <div className="d-flex align-items-center justify-content-center" style={{ height: 200 }}>
                     <div className="spinner-border" role="status"/>
                  </div>
               }
            </div>
         )
      } else {
         return (
            <div className="mb-1 p-3 light-gray-bg">
               There are no available images
            </div>
         )
      }
   }
}

export default AtomicImage;
