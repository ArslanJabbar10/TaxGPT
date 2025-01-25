import React, { useState, useContext } from "react";
import { ChatClickable } from "./SecondPage";
import { AddingChat } from "./SecondPage";
import { ClearChat } from "./SecondPage";
import { DarkMode } from "./SecondPage";
import "./all.css";

const SideBarC1 = (props) => {
  const [hover, setHover] = useState(false);
  const [hoverB, setHoverB] = useState(false);
  const { newChatClickable } = useContext(ChatClickable);
  const { addNewChat } = useContext(AddingChat);
  const { isPlusClicked } = useContext(ClearChat);
  const { dark } = useContext(DarkMode);

  return (
    <>
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button
          onMouseEnter={() => setHover(true)} // Trigger hover state
          onMouseLeave={() => setHover(false)} // Reset hover state
          onClick={props.checkClick}
          style={{
            background: hover
              ? dark
                ? "var(--light-dark-hover-color)"
                : "var(--hover-bg-color)"
              : dark
              ? "var(--light-dark-bg-color)"
              : "var(--sidebar-bg-color)",
            border: "none",
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            transition: "background 0.2s, color 0.2s",
            title: "Collapse menu",
          }}
        >
          <svg
            style={{ marginBottom: "3px" }}
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill={dark ? "#FFFFFF" : "#000000"}
            className="bi bi-list"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
            />
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <div className="new_chat_button">
        <button
          onMouseEnter={() => setHoverB(true)}
          onMouseLeave={() => setHoverB(false)}
          onClick={() => {
            addNewChat();
            isPlusClicked();
          }}
          disabled={!newChatClickable}
          style={{
            backgroundColor: newChatClickable
              ? hoverB
                ? dark
                  ? "var(--light-dark-hover-color)" // Hover effect when dark mode is on
                  : "var(--hover-bg-color)" // Hover effect when dark mode is off
                : dark
                ? "var(--light-dark-bg-color)" // Default background when dark mode is on
                : "#e5e5e5" // Default background when dark mode is off
              : dark
              ? "var(--dark-dark-bg-color)" // Disabled state in dark mode
              : "#e5e5e5",
            color: newChatClickable
              ? dark
                ? "#FFFFFF"
                : "#000"
              : dark
              ? "#5d5d5d" //
              : "#666", // Muted text when disabled
            padding: "10px",
            marginBottom: "10px",
            marginTop: "30px",
            border: "none",
            borderRadius: "30px",
            cursor: newChatClickable ? "pointer" : "default", // Change cursor style
            opacity: newChatClickable ? 1 : 0.7,
          }}
        >
          <svg
            style={{ marginBottom: "3px", marginRight: "15px" }}
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill={
              newChatClickable
                ? dark
                  ? "#FFFFFF"
                  : "#000"
                : dark
                ? "#5d5d5d"
                : "#666"
            }
            className="bi bi-plus-lg"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"
            />
          </svg>
          New chat
        </button>
      </div>
    </>
  );
};

export default SideBarC1;
