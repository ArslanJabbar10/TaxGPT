import React, { useState } from "react";
import { Link } from "react-router";

const Intro = () => {
  const [hover, setHover] = useState(false);
  return (
    <>
      <div
        className="d-flex flex-column flex-lg-row justify-content-center align-items-center"
        style={{
          margin: "auto",
          maxWidth: "1200px", // Optional: limit the width of the container
          gap: "20px", // Space between the sections
          minHeight: "calc(100vh - 240px)", // Adjust to fill the space between Navbar and Footer
        }}
      >
        {/* First Section */}
        <div
          className="d-flex flex-column justify-content-center align-items-start order-2 order-lg-1"
          style={{
            flex: "1",
            // border: "1px solid #ddd",
            padding: "20px",
            minHeight: "250px",
            textAlign: "left",
            backgroundColor: "#fff",
          }}
        >
          <h1
            style={{
              fontSize: "90px",
              fontWeight: "normal",
              background: "linear-gradient(90deg, #4285F4, #EA4335)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
            }}
          >
            TaxGPT
          </h1>
          <h5 style={{ padding: "10px 250px 10px 0px" }}>
            Simplify Your Taxes with Smart AI Assistance
          </h5>
          <p style={{ padding: "3px 250px 10px 0px" }}>
            Get personalized guidance, quick answers, and automated filing
            tailored just for you
          </p>
          <button
            onMouseEnter={() => setHover(true)} // Trigger hover state
            onMouseLeave={() => setHover(false)} // Reset hover state
            onClick={() => {
              // Redirect to the backend route for Google OAuth
              window.location.href = "http://localhost:5000/login/google";
            }}
            style={{
              fontSize: "16px",
              fontWeight: "500",
              color: hover ? "#fff" : "#000", // Text color changes on hover
              background: hover ? "#4285F4" : "#D9EAFD", // Background color changes on hover
              padding: "12px 24px",
              borderRadius: "24px",
              border: "none",
              boxShadow: "5px 5px 5px rgba(0, 0, 0, 0.15)",
              cursor: "pointer",
              transition: "background 0.3s, color 0.3s", // Smooth transition effect
            }}
          >
            Try TaxGPT
          </button>
        </div>

        {/* Second Section */}
        <div
          className="d-flex flex-column justify-content-center align-items-start order-1 order-lg-2"
          style={{
            flex: "1",
            border: "1px solid #ddd",
            padding: "20px",
            minHeight: "350px",
            textAlign: "center",
            backgroundColor: "#FFF",
          }}
        ></div>
      </div>
    </>
  );
};

export default Intro;
