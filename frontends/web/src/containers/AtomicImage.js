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
          <img onLoad={this.onImgLoad} src={src} />
        );
     }
  }

  export default AtomicImage;
