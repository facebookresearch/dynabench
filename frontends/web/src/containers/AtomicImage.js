/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

class AtomicImage extends React.Component {

    constructor(props) {
         super(props);
         this.fixedWidth = 500
         this.onImgLoad = ({target:img}) => {
            const ratio =  img.naturalHeight / img.naturalWidth
            img.width = this.fixedWidth
            img.height = ratio * this.fixedWidth
         }
     }

     render(){
         const {src} = this.props
         if(src && src.length > 0){
            return (
               <img onLoad={this.onImgLoad} src={src} style={{ alignSelf: 'center' }} />
            );
         }
         return (
            <div className="mb-1 p-3 light-gray-bg">
               There are no available images
            </div>
         )
     }
  }

  export default AtomicImage;
