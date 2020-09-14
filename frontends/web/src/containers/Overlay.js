import React from "react"
import {
  Modal,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";

const OverlayContext = React.createContext(false);

function OverlayProvider({ children, initial=false, delayMs = 1400 }) {
  const [hidden, setHidden] = React.useState(true)

  React.useEffect(() => {
    setTimeout(() => setHidden(initial), delayMs)
  }, [])

  return (<div>
    <Modal
      show={!hidden}
      onHide={() => setHidden(true)}
      dialogAs={() => null}
      ></Modal>
    <OverlayContext.Provider value={{hidden, setHidden}}>
      {children}
    </OverlayContext.Provider>
  </div>);
}

function Annotation({children, placement="right", tooltip, ...props}) {
  return (<>
    <OverlayContext.Consumer>
      {({hidden}) => <OverlayTrigger
        {...props}
        placement={placement}
        delay={{ show: 250, hide: 400 }}
        show={!hidden}
        overlay={(props) => <Tooltip {...props}>{tooltip}</Tooltip>}
      >
        {/* <div style={{outline: hidden ? null : "5px dotted rgba(0,0,0,0.4)"}}> */}
          {children}
        {/* </div> */}
      </OverlayTrigger>}
    </OverlayContext.Consumer>
  </>);
}

export {
  OverlayContext,
  OverlayProvider,
  Annotation
}