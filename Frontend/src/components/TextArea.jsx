import React, { useState, useContext } from "react";
import { ChatClickable } from "./SecondPage";
import { DarkMode } from "./SecondPage";
import "./all.css";

const TextArea = (props) => {
  const [hoverG, setHoverG] = useState(false);
  const [hoverM, setHoverM] = useState(false);
  const [hoverS, setHoverS] = useState(false);
  const { dark } = useContext(DarkMode);

  const [inputValue, setInputValue] = useState(""); // State for user input
  const { changingClickable } = useContext(ChatClickable);

  const [inputHeight, setInputHeight] = useState(55); // Initial height of textarea
  const maxHeight = 120; // Maximum height of the textarea and parent div

  // Check if it's the first message in the active chat
  const isFirstMessage = props.messages.length === 0;

  const handleInputChange = (e) => {
    const textarea = e.target;
    // Reset height to auto to calculate scrollHeight correctly
    textarea.style.height = "auto";

    // Adjust the height dynamically, but not exceed the maxHeight
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${newHeight}px`;

    setInputHeight(newHeight);

    // Update the input value
    setInputValue(textarea.value);
  };

  // Handle sending a message
  const handleSend = async () => {
    if (inputValue.trim() === "" || !props.activeChat) return;

    try {
      // Step 1: Add user message
      props.onSendMessage({ sender: "user", text: inputValue });

      // Step 2: Send user message to the backend
      const response = await fetch("http://localhost:5000/api/add_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chat_id: props.activeChat.id, // Ensure we send the active chat ID
          sender: "user",
          content: inputValue.trim(),
        }),
      });

      const data = await response.json();

      // Step 3: Add model (bot) response if the backend responds
      if (response.ok) {
        props.onSendMessage({ sender: "model", text: data.model_response });
        if (isFirstMessage) {
          const titleResponse = await fetch(
            "http://localhost:5000/api/generate_title",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                chat_id: props.activeChat.id,
                user_message: inputValue.trim(),
                model_response: data.model_response,
              }),
            }
          );
          const titleData = await titleResponse.json();
          if (titleResponse.ok) {
            // Update the chat title in the frontend
            props.updateChatTitle(props.activeChat.id, titleData.new_title);
          }
        }
      } else {
        console.error("Error getting model response:", data.error);
      }
    } catch (error) {
      console.error("Error during message handling:", error);
    }

    setInputValue(""); // Clear input field
    setInputHeight(55); // Reset height to the initial value
    changingClickable(); // Any additional logic
  };

  return (
    <>
      <div className="container">
        <div
          className="the_div"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            padding: "10px 20px",
            borderRadius: "25px",
            backgroundColor: dark ? "var(--dark-dark-bg-color)" : "#e6e6e680",
            border: dark ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
            maxWidth: "800px",
            height: `${inputHeight + 20}px`, // Adjust height dynamically (add padding)
            transition: "height 0.2s ease-in-out", // Smooth height adjustment
            margin: "5px auto",
            zIndex: 1,
          }}
        >
          {/* Input Field */}
          <textarea
            className={`custom-textarea ${
              dark ? "dark-mode-scrollbar_chat" : "light-mode-scrollbar_sidebar"
            }`}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Message TaxGPT"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              fontSize: "16px",
              color: dark ? "#FFFFFF" : "#333",
              resize: "none", // Disable manual resizing
              overflowY: inputHeight === maxHeight ? "auto" : "hidden", // Allow scroll if maxHeight reached
              height: `${inputHeight}px`, // Dynamic height
              lineHeight: "1.5", // Line spacing
              boxSizing: "border-box",
            }}
          />

          {/* Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            {/* Gallery Icon */}
            <div
              onMouseEnter={() => setHoverG(true)}
              onMouseLeave={() => setHoverG(false)}
              style={{
                background: hoverG
                  ? dark
                    ? "var(--light-dark-bg-color)"
                    : "#d0d3d4"
                  : dark
                  ? "none"
                  : "none",
                border: "none",
                height: "40px",
                width: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              <svg
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  position: "relative",
                  top: "6px",
                  left: "10px",
                }}
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill={dark ? "#FFFFFF" : "#000000"}
                className="bi bi-image"
                viewBox="0 0 16 16"
              >
                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z" />
              </svg>
            </div>

            {/* Microphone Icon */}
            <div
              onMouseEnter={() => setHoverM(true)}
              onMouseLeave={() => setHoverM(false)}
              style={{
                background: hoverM
                  ? dark
                    ? "var(--light-dark-bg-color)"
                    : "#d0d3d4"
                  : dark
                  ? "none"
                  : "none",
                border: "none",
                height: "40px",
                width: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              <svg
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  position: "relative",
                  top: "6px",
                  left: "10px",
                }}
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill={dark ? "#FFFFFF" : "#000000"}
                className="bi bi-mic"
                viewBox="0 0 16 16"
              >
                <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5" />
                <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3" />
              </svg>
            </div>

            {/* Send Icon */}
            {inputValue.trim() && (
              <div
                onMouseEnter={() => setHoverS(true)}
                onMouseLeave={() => setHoverS(false)}
                style={{
                  background: hoverS
                    ? dark
                      ? "var(--light-dark-bg-color)"
                      : "#d0d3d4"
                    : dark
                    ? "none"
                    : "none",
                  border: "none",
                  height: "40px",
                  width: "40px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                <svg
                  onClick={() => {
                    handleSend();
                    changingClickable();
                  }}
                  style={{
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                    position: "relative",
                    top: "6px",
                    left: "10px",
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill={dark ? "#FFFFFF" : "#000000"}
                  className="bi bi-send"
                  viewBox="0 0 16 16"
                >
                  <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                </svg>
              </div>
            )}
          </div>
        </div>
        <div
          className="note"
          style={{
            textAlign: "center",
            marginTop: "1px", // Add spacing from the text area
            fontSize: "12px", // Adjust font size for visibility
            color: dark ? "#999999" : "#666", // Subtle text color
            padding: "0px 10px", // Add some padding for better appearance
            width: "fit-content", // Fit the content width
            margin: "auto", // Center-align and add spacing from the textarea
          }}
        >
          TaxGPT can make mistakes. Check important info.
        </div>
      </div>
    </>
  );
};

export default TextArea;
