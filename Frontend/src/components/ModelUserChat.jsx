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
          height: "calc(100vh - 162px)", // Subtract the height of the navbar
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
        height: "calc(100vh - 163px)", // Subtract the height of the navbar
        maxWidth: "800px",
        margin: "0 auto",
        borderRadius: "10px",
        overflow: "hidden",
        zIndex: 1,
        backgroundColor: dark ? "var(--dark-dark-bg-color)" : "#FFFFFF",
      }}
    >
      {/* Chat History */}
      <div
        style={{
          flexGrow: 1,
          padding: "10px",
          overflowY: "auto",
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
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              )}
            </div>
            {/* Message Content */}
            <div
              style={{
                maxWidth: "70%",
                padding: "10px 15px",
                borderRadius: "10px",
                backgroundColor:
                  message.sender === "user"
                    ? dark
                      ? "var(--light-dark-bg-color)"
                      : "#e6e6e680"
                    : dark
                    ? "none"
                    : "none",

                // boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
                fontSize: "14px",
                color: dark ? "#FFFFFF" : "#000000",
                textAlign: "left",
              }}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} /> {/* Dummy div for scrolling */}
      </div>
    </div>
  );
};

export default ModelUserChat;
