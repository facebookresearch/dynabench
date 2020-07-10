import React, { useContext } from "react";
import UserContext from "../../containers/UserContext";
import './Avatar.css'
export const Avatar = ({
  profile_img,
  username,
  isEditable,
  theme = "light",
  isThumbnail,
}) => {
  const { api } = useContext(UserContext);
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

  const handleAvatarChange = (e) => {
    const files = e.target.files;
    api
      .updateProfilePic(files[0])
      .then((result) => {
        this.setState({ user: result });
      })
      .catch((error) => {
        console.log("error", error);
      });
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
                onChange={(e) => handleAvatarChange(e)}
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
              theme === "light" ? "blue-color" : "white-color"
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
                onChange={(e) => handleAvatarChange(e)}
              />
            </div>
          ) : null}
        </div>
      )}
    </>
  );
};
