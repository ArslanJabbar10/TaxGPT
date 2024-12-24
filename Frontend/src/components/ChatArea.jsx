import React, { useContext } from "react";
import TextArea from "./TextArea";
import ModelUserChat from "./ModelUserChat";
import { DarkMode } from "./SecondPage";
import "./all.css";

const ChatArea = ({ messages, setMessages, activeChat }) => {
  const { dark } = useContext(DarkMode);

  // Function to append a new message to the existing list
  const handleSendMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  return (
    <>
      <div
        style={{
          backgroundColor: dark ? "var(--dark-dark-bg-color)" : "#FFFFFF",
        }}
      >
        {/* Display Chat History */}
        <ModelUserChat messages={messages} />

        {/* Text Area for Sending Messages */}
        <TextArea onSendMessage={handleSendMessage} activeChat={activeChat} />
      </div>
    </>
  );
};

export default ChatArea;
