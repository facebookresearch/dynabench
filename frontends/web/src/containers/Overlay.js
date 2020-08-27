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
      {context => <OverlayTrigger
        {...props}
        placement={placement}
        delay={{ show: 250, hide: 400 }}
        show={!context.hidden}
        overlay={(props) => <Tooltip {...props}>{tooltip}</Tooltip>}
      >{children}</OverlayTrigger>}
    </OverlayContext.Consumer>
  </div>);
}

export {
  OverlayContext,
  OverlayProvider,
  Annotation
}