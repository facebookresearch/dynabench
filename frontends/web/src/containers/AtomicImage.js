/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

class AtomicImage  extends React.Component {
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
         const {src} = this.props;
         return (
          <img onLoad={this.onImgLoad} src="http://images.cocodataset.org/test2017/000000178453.jpg" style={{ alignSelf: 'center' }} />
        );
     }
  }

  export default AtomicImage;
