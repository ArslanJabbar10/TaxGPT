import React, { useState, useContext, useRef } from "react";
import { ChatClickable } from "./SecondPage";
import { DarkMode } from "./SecondPage";
import "./all.css";

const TextArea = (props) => {
  const [hoverG, setHoverG] = useState(false);
  const [hoverM, setHoverM] = useState(false);
  const [hoverS, setHoverS] = useState(false);
  const { dark } = useContext(DarkMode);

  const [inputValue, setInputValue] = useState(""); // State for user input
  const [filePath, setFilePath] = useState("");
  const { changingClickable } = useContext(ChatClickable);
  const [preview, setPreview] = useState(null); // To store the preview data
  const [alertMessage, setAlertMessage] = useState(""); // State for the alert message
  const [showAlert, setShowAlert] = useState(false); // State to control alert visibility
  const [fileType, setFileType] = useState("");
  const fileInputRef = useRef(null);

  const [inputHeight, setInputHeight] = useState(60); // Initial height of textarea
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
    if ((inputValue.trim() === "" && preview === null) || !props.activeChat)
      return;
    try {
      // Prepare the payload for the backend
      const payload = {
        chat_id: props.activeChat.id,
        sender: "user",
        content: inputValue.trim(),
        file_path: filePath ? `/uploads/${filePath}` : null,
        file_type: fileType || null,
      };
      props.onSendMessage({
        sender: "user",
        text: inputValue.trim(), //Remove trim if any bug faced
        file_path: filePath ? `/uploads/${filePath}` : null,
        file_type: fileType || null,
      });
      // Step 2: Send user message to the backend
      const response = await fetch("http://localhost:5000/api/add_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      setInputValue(""); // Clear input field

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

    setPreview(null);
    setInputHeight(60); // Reset height to the initial value
    changingClickable(); // Any additional logic
    setFilePath(null);
    setFileType(null);
  };

  const handleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Voice recognition is not supported in your browser.");
      return;
    }

    // Create a new instance of the speech recognition API
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US"; // Set the language
    recognition.interimResults = false; // Get only the final results
    recognition.maxAlternatives = 1; // Limit to the best match

    recognition.onstart = () => {
      console.log("Voice recognition started.");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript; // Get the spoken text
      console.log("You said:", transcript);
      setInputValue((prev) => `${prev} ${transcript}`); // Update textarea value
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      alert("Voice recognition error occurred.");
    };

    recognition.onend = () => {
      console.log("Voice recognition ended.");
    };

    // Start voice recognition
    recognition.start();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; // Get the selected file

    if (file) {
      const fileType = file.type;
      const filePath = file.name;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("http://localhost:5000/api/upload_file", {
          method: "POST",
          credentials: "include", // Include cookies for session
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          setFilePath(data.file_path);
          setFileType(data.file_type);
          setPreview(`http://localhost:5000${data.file_path}`); // File URL
        } else {
          setAlertMessage(data.error || "File upload failed");
          setShowAlert(true);
          setTimeout(() => {
            setShowAlert(false);
            setAlertMessage("");
          }, 5000);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }

      if (fileType.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePath(filePath);
          setFileType("Image");
          setPreview(event.target.result); // Display image preview
        };
        reader.readAsDataURL(file);
      } else if (fileType === "application/pdf") {
        setFilePath(filePath);
        setFileType("PDF");
        setPreview(URL.createObjectURL(file));
      } else if (
        fileType === "application/msword" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFileType("Document");
        setFilePath(filePath);
        setPreview(URL.createObjectURL(file));
      } else if (
        fileType === "application/vnd.ms-powerpoint" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) {
        setFileType("PowerPoint");
        setFilePath(filePath);
        setPreview(URL.createObjectURL(file));
      } else if (fileType === "text/plain") {
        setFileType("Text File");
        setFilePath(filePath);
        setPreview(URL.createObjectURL(file));
      } else {
        setAlertMessage("Unsupported file type selected");
        setShowAlert(true);

        setTimeout(() => {
          setShowAlert(false);
          setAlertMessage("");
        }, 5000);
        return;
      }

      // const url = URL.createObjectURL(file); // Create preview link
      //setPreview(null); // Update preview state
      // Reset the file input value
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };

  // const handleRemoveFile = () => {
  //   setPreview(null);
  //   setFilePath("");
  //   setFileType("");

  //   // Reset the file input value
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = null;
  //   }
  // };

  return (
    <>
      <div className="container">
        <div
          className="the_div"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column", // Stack children vertically
            alignItems: "stretch", // Ensure children take full width
            padding: "10px 20px",
            borderRadius: "25px",
            backgroundColor: dark ? "var(--dark-dark-bg-color)" : "#e6e6e680",
            border: dark ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
            maxWidth: "800px",
            // height: `${inputHeight + 20}px`, // Adjust height dynamically (add padding)
            transition: "height 0.2s ease-in-out", // Smooth height adjustment
            margin: "5px auto",
            zIndex: 1,
            overflow: "hidden", // Prevent content overflow
          }}
        >
          {showAlert && (
            <div
              style={{
                position: "fixed",
                top: "10px", // Distance from the top of the window
                left: "50%", // Start at the center horizontally
                transform: "translateX(-50%)", // Adjust for element width to truly center
                backgroundColor: "red",
                color: "white",
                padding: "1px 15px",
                borderRadius: "5px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowAlert(false)} // Close alert on click
                style={{
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "28px",
                  paddingBottom: "3px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                ×
              </button>
              <span>{alertMessage}</span>
            </div>
          )}
          {/* Preview Section */}
          {preview && (
            <div
              style={{
                marginBottom: "1px",
                textAlign: "center",
                display: "flex",
                alignItems: "flex-start",
                position: "relative",
              }}
            >
              {fileType === "Image" ? (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "150px",
                    height: "50px",
                    width: "60px",
                    borderRadius: "10px",
                  }}
                />
              ) : (
                <>
                  {/* File Icon */}
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
                        {filePath}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: dark ? "#ccc" : "#666",
                        }}
                      >
                        {fileType}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {/* Cross Button */}
              <div style={{ position: "relative", top: "-3px", right: "10px" }}>
                <button
                  onClick={() => setPreview(null)} // Clear the preview
                  style={{
                    background: dark ? "#FFFFFF" : " #000000",
                    color: dark ? "#000000" : " #FFFFFF",
                    border: "1px solid #000000",
                    borderRadius: "50%",
                    width: "15px",
                    height: "15px",
                    paddingBottom: "1px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: "10px",
                    fontWeight: "bolder",
                    lineHeight: "14px",
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {/* Input and Icons Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center", // Align items vertically in the center
              gap: "10px", // Space between icons and textarea
            }}
          >
            {/* Input Field */}
            <textarea
              className={`custom-textarea ${
                dark
                  ? "dark-mode-scrollbar_chat"
                  : "light-mode-scrollbar_sidebar"
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
                onClick={() => document.getElementById("file-upload").click()} // Trigger file input click
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
              {/* Hidden File Input */}
              <input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => handleFileUpload(e)}
              />

              {/* Microphone Icon */}
              <div
                onClick={handleVoiceInput} // Add voice functionality
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
              {(inputValue.trim() || preview) && (
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
