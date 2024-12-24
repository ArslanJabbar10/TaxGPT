import React, { useState, useEffect, useRef, useContext } from "react";
import { DarkMode } from "./SecondPage";

import "./all.css";

const SideBarC2 = (props) => {
  const [hoverR, setHoverR] = useState(false);
  const [hoverD, setHoverD] = useState(false);
  const { dark } = useContext(DarkMode);
  const [visibleDropdown, setVisibleDropdown] = useState(null);
  const dropdownRef = useRef(null); // Reference to detect clicks outside
  const iconRef = useRef([]); // Reference array for each chat icon
  const [editingIndex, setEditingIndex] = useState(null); // Track which chat is being edited
  const [tempText, setTempText] = useState(""); // Temporary text for editing

  const toggleDropdown = (index) => {
    setVisibleDropdown(visibleDropdown === index ? null : index);
  };

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setVisibleDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRename = (index) => {
    const actualIndex = props.chats.length - 1 - index; // Calculate the correct index
    setEditingIndex(actualIndex); // Enable editing mode for this chat
    setTempText(props.chats[actualIndex].text); // Set initial text for the input field
    setVisibleDropdown(null); // Close the dropdown
  };

  const handleDelete = async (index) => {
    const actualIndex = props.chats.length - 1 - index; // Reverse index calculation
    const chatToDelete = props.chats[actualIndex]; // Get the chat being deleted

    try {
      const response = await fetch("http://localhost:5000/api/delete_chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include session cookies
        body: JSON.stringify({
          chat_id: chatToDelete.id, // Send chat_id to backend
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Chat deleted successfully:", data.message);
        props.deleteChat(actualIndex); // Update the frontend state
      } else {
        console.error("Error deleting chat:", data.error);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }

    setVisibleDropdown(null); // Close the dropdown
  };

  const saveChanges = async (index) => {
    if (tempText.trim()) {
      const chatToUpdate = props.chats[index]; // Get the chat being renamed
      try {
        const response = await fetch(
          "http://localhost:5000/api/update_chat_title",
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // Include session cookies
            body: JSON.stringify({
              chat_id: chatToUpdate.id, // Send the chat_id
              new_title: tempText.trim(), // Send the new title
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          props.updateChatText(index, data.new_title); // Update the frontend chat title
          setEditingIndex(null); // Exit editing mode
        } else {
          console.error("Error updating chat title:", data.error);
        }
      } catch (error) {
        console.error("Error updating chat title:", error);
      }
    }
  };

  const handleChatClick = (index) => {
    const actualIndex = props.chats.length - 1 - index; // Reverse index
    const selectedChat = props.chats[actualIndex];
    props.setActiveChat(selectedChat); // Set active chat
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Enter") {
      saveChanges(index);
    }
  };

  const handleBlur = (index) => {
    saveChanges(index);
  };

  return (
    <>
      {/* Chat History */}
      <div style={{ flexGrow: 1, overflowY: "auto", marginBottom: "10px" }}>
        {[...props.chats].reverse().map((chat, index) => {
          const isActive = chat.id === props.activeChat?.id;
          return (
            <div
              key={index}
              style={{
                padding: "8px",
                marginBottom: "3px",
                backgroundColor: dark
                  ? isActive
                    ? "var(--light-dark-hover-color)" // Dark mode and active chat
                    : "var(--light-dark-bg-color)" // Dark mode and not active chat
                  : isActive
                  ? "var(--active-bg-color)" // Light mode and active chat
                  : "var(--sidebar-bg-color)", // Light mode and not active chat

                border: dark
                  ? isActive
                    ? "2px solid var(--light-dark-hover-color)" // Dark mode and active chat
                    : "1px solid var(--light-dark-bg-color)" // Dark mode and not active chat
                  : isActive
                  ? "2px solid var(--active-border-color)" // Light mode and active chat
                  : "1px solid var(--sidebar-bg-color)", // Light mode and not active chat
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background 0.1s",
                position: "relative", // Parent must be relative for absolute positioning to work
                display: "flex", // Use flexbox to align children
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => handleChatClick(index)} // Set this chat as active
              onMouseEnter={(e) =>
                !isActive &&
                (e.currentTarget.style.backgroundColor = dark
                  ? "var(--light-dark-hover-color)" // Dark mode hover color
                  : "var(--hover-bg-color)")
              }
              onMouseLeave={(e) =>
                !isActive &&
                (e.currentTarget.style.backgroundColor = dark
                  ? "var(--light-dark-bg-color)" // Dark mode background color
                  : "var(--sidebar-bg-color)")
              }
            >
              {/* Editable or Static Text */}
              {editingIndex === props.chats.length - 1 - index ? (
                <input
                  type="text"
                  value={tempText}
                  onChange={(e) => setTempText(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeyDown(props.chats.length - 1 - index)
                  } // Save on Enter
                  onBlur={() => handleBlur(props.chats.length - 1 - index)} // Save on Blur
                  style={{
                    flex: 1,
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "5px",
                    fontSize: "14px",
                  }}
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => handleChatClick(index)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    color: dark ? "#FFFFFF" : "#000000",
                  }}
                >
                  {chat.text}
                </span>
              )}
              <span
                ref={(el) => (iconRef.current[index] = el)} // Save reference to the icon
                onClick={() => toggleDropdown(index)}
                style={{
                  cursor: "pointer",
                  color: dark ? "#FFFFFF" : "#000000",
                }}
              >
                {chat.icon}
              </span>
              {visibleDropdown === index && (
                <ul
                  ref={dropdownRef}
                  className="dropdown-menu d-block shadow"
                  data-bs-theme="light"
                  style={{
                    position: "absolute", // Position it absolutely
                    top: "100%", // Position below the parent div
                    right: "20px", // Align with the left edge of the parent
                    width: "50px",
                    zIndex: 1000, // Ensure it appears on top
                    backgroundColor: dark
                      ? "var(--dark-dark-bg-color)"
                      : "var(--sidebar-bg-color)",
                    border: dark
                      ? "1px solid var(--light-dark-hover-color)"
                      : "1px solid var(--light-dark-hover-color)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <li
                    onMouseEnter={() => setHoverR(true)}
                    onMouseLeave={() => setHoverR(false)}
                    style={{
                      background: hoverR
                        ? dark
                          ? "var(--light-dark-bg-color)"
                          : "var(--hover-bg-color)"
                        : dark
                        ? "var(--dark-dark-bg-color)"
                        : "var(--sidebar-bg-color)",
                    }}
                  >
                    <a
                      className="dropdown-item d-flex gap-2 align-items-center"
                      href="#"
                      onClick={() => handleRename(index)} // Trigger rename mode
                      style={{
                        outline: "none",
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        color: dark ? "#FFFFFF" : "#000000",
                      }}
                    >
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill={dark ? "#FFFFFF" : "#000000"}
                          className="bi bi-pencil-fill"
                          viewBox="0 0 16 16"
                        >
                          <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z" />
                        </svg>
                      </div>

                      <div style={{ marginLeft: "10px" }}>Rename</div>
                    </a>
                  </li>
                  <li
                    onMouseEnter={() => setHoverD(true)}
                    onMouseLeave={() => setHoverD(false)}
                    style={{
                      background: hoverD
                        ? dark
                          ? "var(--light-dark-bg-color)"
                          : "var(--hover-bg-color)"
                        : dark
                        ? "var(--dark-dark-bg-color)"
                        : "var(--sidebar-bg-color)",
                    }}
                  >
                    <a
                      className="dropdown-item d-flex gap-2 align-items-center"
                      href="#"
                      onClick={() => handleDelete(index)} // Trigger delete on click
                      style={{
                        outline: "none",
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        color: dark ? "#FFFFFF" : "#000000",
                        borderTop: "1px solid var(--light-dark-hover-color)",
                      }}
                    >
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill={dark ? "#FFFFFF" : "#000000"}
                          className="bi bi-trash3"
                          viewBox="0 0 16 16"
                        >
                          <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                        </svg>
                      </div>

                      <div style={{ marginLeft: "10px" }}>Delete</div>
                    </a>
                  </li>
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default SideBarC2;
