/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

class AtomicImage extends React.Component {

   constructor(props) {
      super(props);
      this.state = {
         isImgLoaded: false,
         width: 0,
         height: 0,
      };
   }

   componentDidUpdate(prevProps) {
      if (prevProps.src !== this.props.src) {
         this.setState({ isImgLoaded: false });
      }
   }

   onImgLoad = ({ target: img }) => {
      const aspectRatio =  img.naturalWidth / img.naturalHeight;
      const { maxHeight, maxWidth } = this.props;
      let height = 0, width = 0;
      if (maxHeight * aspectRatio > maxWidth) {
         width = maxWidth;
         height = maxWidth / aspectRatio;
      } else {
         height = maxHeight;
         width = maxHeight * aspectRatio;
      }
      this.setState({
         width,
         height,
         isImgLoaded: true,
      })
  }


   render() {
      if (this.props.src && this.props.src.length > 0) {
         return (
            <>
               <div className="d-flex align-items-center justify-content-center">
                  <img
                     onLoad={this.onImgLoad}
                     src={this.props.src}
                     style={{
                        display: this.state.isImgLoaded ? "block" : "none",
                        alignSelf: "center",
                        height: this.state.height,
                        width: this.state.width
                     }} />
               </div>
               {!this.state.isImgLoaded &&
                  <div className="d-flex align-items-center justify-content-center" style={{ height: this.props.maxHeight }}>
                     <div className="spinner-border" role="status"/>
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
