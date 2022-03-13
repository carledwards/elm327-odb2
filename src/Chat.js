import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./Chat.css";
import { selectChatId, selectChatName } from "./features/chatSlice";
import db from "./firebase";
import firebase from "firebase/compat/app";
import Message from "./Message";
import { selectUser } from "./features/userSlice";
import FlipMove from "react-flip-move";

var serialPort = null;
var serialPortWriter = null;

function Chat() {
  const user = useSelector(selectUser);
  const [input, setInput] = useState("");
  const chatName = useSelector(selectChatName);
  const [messages, setMessages] = useState([]);
  const chatId = useSelector(selectChatId);

  useEffect(() => {
    if (chatId) {
      db.collection("chats")
        .doc(chatId)
        .collection("messages")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) =>
          setMessages(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              data: doc.data(),
            }))
          )
        );
    }
  }, [chatId]);

  const connectToSerial = async () => {
    try {
      serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate: 38400 });

      // eslint-disable-next-line no-undef
      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(
        serialPort.writable
      );

      serialPortWriter = textEncoder.writable.getWriter();

      // eslint-disable-next-line no-undef
      const decoder = new TextDecoderStream();

      serialPort.readable.pipeTo(decoder.writable);
      const inputStream = decoder.readable;
      const reader = inputStream.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (value) {
          console.log(value);
          db.collection("chats").doc(chatId).collection("messages").add({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            message: value,
            uid: user.uid,
            photo: null,
            email: "elm327@localhost.com",
            displayName: "elm327",
          });
        }
        if (done) {
          console.log("[readLoop] DONE", done);
          reader.releaseLock();
          break;
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (input) {
      db.collection("chats").doc(chatId).collection("messages").add({
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        message: input,
        uid: user.uid,
        photo: user.photo,
        email: user.email,
        displayName: user.displayName,
      });

      await serialPortWriter.write(`${input}\r\n`);
    }
    setInput("");
  };

  return (
    <div className="chat">
      <div className="chat__header">
        <h4>
          <span className="chat__name">{chatName}</span>
        </h4>
      </div>

      <div className="chat__serialconnect">
        <button onClick={connectToSerial}>Connect to Serial Port</button>
      </div>

      <div className="chat__messages">
        <FlipMove>
          {messages.map(({ id, data }) => (
            <Message key={id} data={data} />
          ))}
        </FlipMove>
      </div>

      <div className="chat__input">
        <form>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message"
            type="text"
          />
          <button onClick={sendMessage}>Send Message</button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
