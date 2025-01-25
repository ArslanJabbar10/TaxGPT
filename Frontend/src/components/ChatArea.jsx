import React, { createContext, useContext, useState } from "react";
import TextArea from "./TextArea";
import ModelUserChat from "./ModelUserChat";
import { DarkMode } from "./SecondPage";
import "./all.css";

const DynamicRender = createContext();

const ChatArea = ({ messages, setMessages, activeChat, updateChatTitle }) => {
  const { dark } = useContext(DarkMode);
  const [runTimeResponse, setRunTime] = useState(false);
  const [stopped, setStopped] = useState(false);

  // Function to append a new message to the existing list
  const handleSendMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  return (
    <>
      <DynamicRender.Provider
        value={{ runTimeResponse, setRunTime, stopped, setStopped }}
      >
        <div
          className={`custom-textarea ${
            dark ? "dark-mode-scrollbar_chat" : "light-mode-scrollbar_chat"
          }`}
          style={{
            height: "calc(100vh - 61px)", // Full viewport height
            display: "flex",
            flexDirection: "column", // Stack ModelUserChat and TextArea vertically
            backgroundColor: dark ? "var(--dark-dark-bg-color)" : "#FFFFFF",
            overflowY: "hidden", // Prevent window scrolling
          }}
        >
          {/* Chat History */}
          <div
            style={{
              flex: 1, // Take up all available space, leaving room for TextArea
              overflowY: "auto", // Enable scrolling for the chat history only
            }}
          >
            <ModelUserChat messages={messages} />
          </div>

          {/* Text Area for Sending Messages */}
          <div
            style={{
              flexShrink: 0, // Prevent shrinking
              zIndex: 1, // Ensure TextArea stays above other content
              position: "relative",
            }}
          >
            <TextArea
              onSendMessage={handleSendMessage}
              activeChat={activeChat}
              messages={messages}
              updateChatTitle={updateChatTitle}
            />
          </div>
        </div>
      </DynamicRender.Provider>
    </>
  );
};

export default ChatArea;
export { DynamicRender };
