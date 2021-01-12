/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

class AtomicImage extends React.Component {
    constructor(props) {
         super(props);
         this.onImgLoad = this.onImgLoad.bind(this);
         this.fixedWidth = 500
     }
     onImgLoad({target:img}) {
        const ratio =  img.naturalHeight / img.naturalWidth
        img.width = this.fixedWidth
        img.height = ratio * this.fixedWidth
     }
     render(){
         const src = this.props.src ? this.props.src : "https://s3.us-east-1.amazonaws.com/images.cocodataset.org/train2017/000000072023.jpg";
         return (
          <img onLoad={this.onImgLoad} src={src} style={{ alignSelf: 'center' }} />
        );
     }
  }

  export default AtomicImage;
