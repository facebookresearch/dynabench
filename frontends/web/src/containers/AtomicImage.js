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
      const { src, maxSize } = this.props;
      if (src && src.length > 0) {
         return (
            <>
               <img
                  onLoad={() => this.setState({ isImgLoaded: true })}
                  src={src}
                  style={{
                     marginTop: "20px",
                     display: this.state.isImgLoaded ? "block" : "none",
                     alignSelf: "center",
                     maxHeight: maxSize,
                     maxWidth: maxSize
                  }
               } />
               {!this.state.isImgLoaded &&
                  <div className="d-flex align-items-center justify-content-center" style={{ height: 200 }}>
                     <div className="spinner-border" role="status">
                     <span className="sr-only">Loading...</span>
                     </div>
                  </div>
               }
            </>
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
