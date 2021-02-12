/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

class MagnifiedImage extends React.Component {

    constructor() {
        super();
        this.magFactor = 1.5;
        this.state = {
            minWidth: 0,
            minHeight: 0
        }
    }

    handleClick = e => {
        if (e.target.classList.contains("backdrop")) {
            this.props.setMagnifiedImageSrc(null);
        }
    }

    onImgLoad = ({ target: img }) => {
        this.setState({
            minHeight: img.naturalHeight * this.magFactor,
            minWidth: img.naturalWidth * this.magFactor,
        })
    }

    render() {
        return (
            <div className="backdrop" onClick={this.handleClick} onLoad={this.onImgLoad}>
                <img src={this.props.src} alt="magnifiedImage" style={{ minHeight: this.state.minHeight, minWidth: this.state.minWidth }}/>
            </div>
        )
    }

}

export { MagnifiedImage }
