import React from "react"
import {
  Modal,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";

const OverlayContext = React.createContext(false);

function OverlayProvider({ children, initiallyHide=false, delayMs = 1400 }) {

  const [hidden, setHidden] = React.useState(true)

  React.useEffect(() => {
    setTimeout(() => setHidden(initiallyHide), delayMs)
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

function BadgeOverlay({children, badgeTypes, ...props}) {
  return (<Modal
    {...props}
    centered
    backdropClassName="badge-backdrop"
    dialogAs={({children}) => (
      <div className="modal-dialog modal-dialog-centered">
        <div className="badge-overlay">
          {children}
        </div>
      </div>
    )}
  >
    Congratulations! You won a badge!
    {badgeTypes ? <div className="m-3">
      {badgeTypes.split("|").map((badge, idx) => (
        <img
          key={badge+"-"+idx}
          className="awarded-badge"
          src={"/badges/"+badge+".png"}
          style={{margin: "0 10px", animationDelay: 0.4 + 0.3 * idx + "s"}} />)
      )}
    </div> : null}
    <div style={{fontSize: 12}}>Click anywhere to continue...</div>
  </Modal>);
}

export {
  OverlayContext,
  OverlayProvider,
  Annotation,
  BadgeOverlay
}