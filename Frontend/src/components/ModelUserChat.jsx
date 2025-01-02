import React, { useState, useRef, useEffect, useContext } from "react";
import model from "../assets/model.svg";
import { ChatClickable } from "./SecondPage";
import { DarkMode } from "./SecondPage";
import "./all.css";

const ModelUserChat = (props) => {
  const chatEndRef = useRef(null);
  const { newChatClickable } = useContext(ChatClickable);
  const [profilePicture, setProfilePicture] = useState(null);
  const [userName, setUserName] = useState();
  const { dark } = useContext(DarkMode);
  const [hoverState, setHoverState] = useState({}); // Object to track hover states
  console.log(props.messages);
  const handleMouseEnter = (id, action) => {
    setHoverState((prev) => ({ ...prev, [`${id}-${action}`]: true }));
  };

  const handleMouseLeave = (id, action) => {
    setHoverState((prev) => ({ ...prev, [`${id}-${action}`]: false }));
  };

  // State to manage active states of actions for each message
  const [activeState, setActiveState] = useState({});

  // Function to update the active state
  const updateActiveState = (index, action, value) => {
    setActiveState((prev) => ({
      ...prev,
      [`${index}-${action}`]: value,
    }));
  };

  // Fetch user info on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user_info", {
          method: "GET",
          credentials: "include", // Include cookies (session data)
        });
        const data = await response.json();
        if (response.ok) {
          setProfilePicture(data.profile_picture);
          setUserName(data.name);
        } else {
          console.error("Failed to fetch user info:", data.error);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

  // Scroll to the bottom whenever a new message is added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [props.messages]);

  if (!newChatClickable) {
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", // Center content vertically
          alignItems: "center", // Center content horizontally
          height: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          borderRadius: "10px",
          overflow: "hidden",
          zIndex: 1,
          background: "linear-gradient(90deg, #4285F4, #EA4335)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        <h1
          style={{
            fontSize: "35px",
            fontFamily: "'Roboto', 'Google Sans', sans-serif",
            fontWeight: "600",
          }}
        >
          Hello, {userName}
        </h1>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        // height: "calc(100vh - 163px)", // Subtract the height of the navbar
        height: "100%", // Take up all available space
        maxWidth: "800px",
        margin: "0 auto",
        borderRadius: "10px",
        // overflow: "hidden",
        zIndex: 1,
        backgroundColor: dark ? "var(--dark-dark-bg-color)" : "#FFFFFF",
      }}
    >
      {/* Chat History */}
      <div
        style={{
          flexGrow: 1,
          padding: "10px",
          // overflowY: "auto",
        }}
      >
        {props.messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "flex-start",
              margin: "10px 0",
              flexDirection: message.sender === "user" ? "row-reverse" : "row",
            }}
          >
            {/* Profile Picture */}
            <div
              style={{
                width: "30px",
                height: "30px",
                margin: "0 10px",
              }}
            >
              {message.sender === "user" ? (
                <img
                  src={profilePicture} // User's profile picture from database
                  alt="User"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <img
                  src={model} // Replace with your model image path
                  alt="Model"
                  style={{
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              )}
            </div>
            {/* File Content */}
            <div
              style={{
                display:
                  message.sender === "user" && message.file_path
                    ? "flex"
                    : "block",
                flexDirection:
                  message.sender === "user" && message.file_path
                    ? "column"
                    : "row",
                alignItems: "flex-end", // Align content correctly
              }}
            >
              {message.sender === "user" && message.file_path && (
                <div
                  style={{
                    marginTop: "10px", // Add spacing between text and file preview
                  }}
                >
                  {message.file_type &&
                  message.file_type.startsWith("Image") ? (
                    <img
                      src={`http://localhost:5000${message.file_path}`}
                      alt="Uploaded File"
                      style={{
                        maxWidth: "100px",
                        maxHeight: "100px",
                        borderRadius: "8px",
                        display: "block", // Ensure it doesn't overflow
                        margin: "0 auto",
                      }}
                    />
                  ) : (
                    <>
                      <div
                        style={{
                          backgroundColor: dark ? "#28292a" : "#FFFFFF",
                          display: "flex",
                          justifyContent: "center",
                          padding: "8px 8px",
                          borderRadius: "20px",
                          border: dark
                            ? "thin solid #28292a"
                            : "thin solid #dee2e5",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "40px",
                            width: "40px",
                            backgroundColor: "#FF6F91", // Placeholder color
                            borderRadius: "10px",
                            flexShrink: 0, // Prevent shrinking
                          }}
                        >
                          {/* Add your file SVG here */}
                          <span style={{ paddingBottom: "3px" }}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="22"
                              height="22"
                              fill="white"
                              className="bi bi-file-earmark-text"
                              viewBox="0 0 16 16"
                            >
                              <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5" />
                              <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
                            </svg>
                          </span>
                        </div>

                        {/* File Info */}
                        <div style={{ textAlign: "left", marginLeft: "8px" }}>
                          <div
                            style={{
                              fontWeight: "600px",
                              fontSize: "14px",
                              textOverflow: "ellipsis",
                              color: dark ? "#FFFFFF" : "#000000",
                            }}
                          >
                            {message.file_path.substring(9)}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: dark ? "#ccc" : "#666",
                            }}
                          >
                            {message.file_type}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* Message Content */}
              {message.text && (
                <div
                  style={{
                    maxWidth: "100%",
                    padding: "10px 15px",
                    marginBottom: "10px",
                    borderRadius: "10px",
                    backgroundColor:
                      message.sender === "user"
                        ? dark
                          ? "var(--light-dark-bg-color)"
                          : "#e6e6e680"
                        : dark
                        ? "none"
                        : "none",
                    fontSize: "14px",
                    color: dark ? "#FFFFFF" : "#000000",
                    textAlign: "left",
                  }}
                >
                  {message.text}
                  {/* SVG Actions Row (only for model messages) */}
                  {message.sender === "model" && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        gap: "10px",
                        marginTop: "5px",
                      }}
                    >
                      {/* Read Aloud SVG */}
                      <div
                        onMouseEnter={() => handleMouseEnter(index, "read")}
                        onMouseLeave={() => handleMouseLeave(index, "read")}
                        style={{
                          background: hoverState[`${index}-read`]
                            ? dark
                              ? "var(--light-dark-bg-color)"
                              : "#d0d3d4"
                            : "none",
                          border: "none",
                          height: "25px",
                          width: "25px",
                          display: "flex",
                          justifyContent: "center",
                          paddingTop: "5px",
                          borderRadius: "50%",
                          cursor: "pointer",
                          transition: "background 0.2s, color 0.2s",
                        }}
                      >
                        {activeState[`${index}-read`] === "reading" ? (
                          // Stop SVG
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill={dark ? "#FFFFFF" : "#333"}
                            className="bi bi-stop-circle"
                            viewBox="0 0 16 16"
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              window.speechSynthesis.cancel();
                              updateActiveState(index, "read", null); // Reset to default
                            }}
                          >
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                            <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5z" />
                          </svg>
                        ) : (
                          // Volume Up SVG
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill={dark ? "#FFFFFF" : "#333"}
                            className="bi bi-volume-up"
                            viewBox="0 0 16 16"
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              const utterance = new SpeechSynthesisUtterance(
                                message.text
                              );
                              utterance.lang = "en-US";
                              utterance.onend = () => {
                                updateActiveState(index, "read", null); // Reset to default
                              };
                              updateActiveState(index, "read", "reading"); // Change to stop
                              window.speechSynthesis.speak(utterance);
                            }}
                          >
                            <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z" />
                            <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z" />
                            <path d="M10.025 8a4.5 4.5 0 0 1-1.318 3.182L8 10.475A3.5 3.5 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.5 4.5 0 0 1 10.025 8M7 4a.5.5 0 0 0-.812-.39L3.825 5.5H1.5A.5.5 0 0 0 1 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 7 12zM4.312 6.39 6 5.04v5.92L4.312 9.61A.5.5 0 0 0 4 9.5H2v-3h2a.5.5 0 0 0 .312-.11" />
                          </svg>
                        )}
                      </div>
                      {/* Copy to Clipboard SVG */}
                      <div
                        onMouseEnter={() => handleMouseEnter(index, "copy")}
                        onMouseLeave={() => handleMouseLeave(index, "copy")}
                        style={{
                          background: hoverState[`${index}-copy`]
                            ? dark
                              ? "var(--light-dark-bg-color)"
                              : "#d0d3d4"
                            : "none",
                          border: "none",
                          height: "25px",
                          width: "25px",
                          display: "flex",
                          justifyContent: "center",
                          paddingTop: "5px",
                          borderRadius: "50%",
                          cursor: "pointer",
                          transition: "background 0.2s, color 0.2s",
                        }}
                      >
                        {activeState[`${index}-copy`] === "copied" ? (
                          // Tick SVG
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill={dark ? "#FFFFFF" : "#333"}
                            className="bi bi-check2"
                            viewBox="0 0 16 16"
                          >
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0" />
                          </svg>
                        ) : (
                          // Copy SVG
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            fill={dark ? "#FFFFFF" : "#333"}
                            className="bi bi-copy"
                            viewBox="0 0 16 16"
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              navigator.clipboard.writeText(message.text);
                              updateActiveState(index, "copy", "copied");
                              setTimeout(() => {
                                updateActiveState(index, "copy", null); // Reset to default
                              }, 1000); // Reset after 3 seconds
                            }}
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} /> {/* Dummy div for scrolling */}
      </div>
    </div>
  );
};

export default ModelUserChat;
