import { Avatar } from "@material-ui/core";
import React, { forwardRef } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "./features/userSlice";
import "./Message.css";

const Message = forwardRef(
  (
    { id, data: { photo, message, timestamp, email, displayName, uid } },
    ref
  ) => {
    const user = useSelector(selectUser);

    return (
      <div
        ref={ref}
        className={`message ${user.email === email && "message__sender"}`}
      >
        <Avatar className="message__photo" src={photo} />
        <p>{message}</p>
        {/* timestamps will initally come in being null
             see: https://medium.com/firebase-developers/the-secrets-of-firestore-fieldvalue-servertimestamp-revealed-29dd7a38a82b#:~:text=Server%20timestamps%20are%20a%20valuable,code%20and%20in%20security%20rules. */}
        <small>
          {timestamp ? new Date(timestamp.seconds * 1000).toLocaleString() : ""}
        </small>
      </div>
    );
  }
);

export default Message;
