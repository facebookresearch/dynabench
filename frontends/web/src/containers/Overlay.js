import React from "react"
import {
  Modal,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";

const OverlayContext = React.createContext(false);

function OverlayProvider({ children, initial=false }) {
  const [hidden, setHidden] = React.useState(initial)

  return (<div>
    <Modal
      show={!hidden}
      onHide={() => setHidden(true)}
    ></Modal>
    <OverlayContext.Provider value={{hidden, setHidden}}>
      {children}
    </OverlayContext.Provider>
  </div>);
}

function Annotation({children, placement="right", tooltip, ...props}) {
  return (<div>
    <OverlayContext.Consumer>
      {({hidden}) => <OverlayTrigger
        {...props}
        placement={placement}
        delay={{ show: 250, hide: 400 }}
        show={!hidden}
        overlay={(props) => <Tooltip {...props}>{tooltip}</Tooltip>}
      >
        <div style={{outline: hidden ? null : "5px dotted rgba(0,0,0,0.4)"}}>
          {children}
        </div>
      </OverlayTrigger>}
    </OverlayContext.Consumer>
  </div>);
}

export {
  OverlayContext,
  OverlayProvider,
  Annotation
}