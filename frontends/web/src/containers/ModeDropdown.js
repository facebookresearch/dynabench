import React from "react";
import { DropdownButton, Dropdown } from "react-bootstrap";

const ModeDropdown = ({ selectedMode, onClick }) => {
  const modesProps = {
    live: {
      variant: "primary",
      icon: "fa fa-brain",
      name: "Live Mode",
    },
    inspiration: {
      variant: "info",
      icon: "fa fa-lightbulb",
      name: "Inspiration",
    },
    sandbox: {
      variant: "warning",
      icon: "fa fa-exclamation-triangle",
      name: "Sandbox",
    },
  };

  return (
    <DropdownButton
      variant={modesProps[selectedMode].variant}
      className="p-1"
      title={
        <>
          <i className={modesProps[selectedMode].icon} />
          &nbsp; {modesProps[selectedMode].name}
        </>
      }
    >
      {Object.keys(modesProps).map((mode, index) => (
        <Dropdown.Item data={mode} onClick={onClick} key={index}>
          {modesProps[mode].name}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
};

export { ModeDropdown };
