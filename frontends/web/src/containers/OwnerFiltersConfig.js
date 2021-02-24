import React from "react";
import {
    DropdownButton,
    Dropdown,
    Modal,
    Form,
} from "react-bootstrap";
import { Annotation } from "./Overlay";

class OwnerFiltersConfig extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showOwnerValidationFiltersModal: false
        }
    }
    render() {
        return (
            <div style={{float: "right"}}>
                <Annotation placement="top" tooltip="Click to adjust your owner validation filters">
                <button type="button" className="btn btn-outline-primary btn-sm btn-help-info"
                    onClick={() => this.setState({ showOwnerValidationFiltersModal: true })}
                ><i className="fa fa-cog"></i></button>
                </Annotation>
                  <Modal
                    show={this.state.showOwnerValidationFiltersModal}
                    onHide={() => this.setState({ showOwnerValidationFiltersModal: false })}
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>Owner Validation Filters</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Form.Check
                          checked={this.props.isOwner}
                          label="Enter task owner mode?"
                          onChange={() => this.props.toggleOwnerMode()}
                        />
                        {this.props.isOwner
                          ? <div>
                              <DropdownButton variant="light" className="p-1" title={this.props.ownerValidationFlagFilter.toString() + " flag" + (this.props.ownerValidationFlagFilter === 1 ? "" : "s")}>
                                {["Any",0,1,2,3,4,5].map((target, index) => <Dropdown.Item onClick={() => this.props.updateOwnerValidationFlagFilter(target)} key={index} index={index}>{target}</Dropdown.Item>)}
                              </DropdownButton>
                              <DropdownButton variant="light" className="p-1" title={this.props.ownerValidationDisagreementFilter.toString() + " correct/incorrect disagreement" + (this.props.ownerValidationDisagreementFilter === 1 ? "" : "s")}>
                                {["Any",0,1,2,3,4].map((target, index) => <Dropdown.Item onClick={() => this.props.updateOwnerValidationDisagreementFilter(target)} key={index} index={index}>{target}</Dropdown.Item>)}
                              </DropdownButton>
                            </div>
                          : ""
                        }
                      </Modal.Body>
                  </Modal>
            </div>
        )
    }
}

export default OwnerFiltersConfig;
