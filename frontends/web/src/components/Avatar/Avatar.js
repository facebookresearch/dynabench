import React, { useContext } from "react";
import "./Avatar.css";

export const Avatar = ({
  profile_img,
  username,
  isEditable,
  theme = "light",
  isThumbnail,
  handleUpdate,
}) => {
  const getInitial = (name) => {
    return (
      name &&
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    );
  };

  return (
    <>
      {profile_img && !profile_img !== "" ? (
        <div
          className={`avatar-circle ${
            isThumbnail ? "sm inline-block mr-1" : null
          }`}
        >
          <img className="profile-pic" src="profile_img" />
          {isEditable ? (
            <div
              className={`editPic ${
                theme === "light" ? "white-bg" : "blue-bg"
              }`}
            >
              <img className="edit-pic-icon" src="/camera.png" />
              <input
                className="pic-file-upload"
                type="file"
                title="Click here to upload your profile picture"
                onChange={(e) => handleUpdate(e)}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className={`avatar-circle ${
            theme === "light" ? "white-bg" : "blue-bg"
          } ${isThumbnail ? "sm inline-block mr-1" : null}`}
        >
          <span
            className={`initials ${
              theme === "light" ? "blue-bg" : "white-color"
            }`}
          >
            {getInitial(username)}
          </span>
          {isEditable ? (
            <div className="editPic blue-bg">
              <img className="edit-pic-icon" src="/camera.png" />
              <input
                className="pic-file-upload"
                type="file"
                title="Click here to upload your profile picture"
                onChange={(e) => handleUpdate(e)}
              />
            </div>
          ) : null}
        </div>
      )}
    </>
  );
};
