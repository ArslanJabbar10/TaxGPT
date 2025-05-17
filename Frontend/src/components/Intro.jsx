import React, { useState, useEffect } from "react";
import { Link } from "react-router";

const Intro = () => {
  const [hover, setHover] = useState(false);
  const steps = [
    { title: "1. Ask Your Tax Question", icon: "💬" },
    { title: "2. We Search FBR Records", icon: "🔍" },
    { title: "3. Get a Reliable Answer", icon: "✅" },
  ];

  const [typedTitles, setTypedTitles] = useState(["", "", ""]);
  const [showIcons, setShowIcons] = useState([false, false, false]);

  useEffect(() => {
    const typeStep = async (stepIndex) => {
      const fullTitle = steps[stepIndex].title;
      for (let i = 0; i <= fullTitle.length; i++) {
        await new Promise((res) =>
          setTimeout(() => {
            setTypedTitles((prev) => {
              const updated = [...prev];
              updated[stepIndex] = fullTitle.slice(0, i);
              return updated;
            });
            res();
          }, 35)
        );
      }

      // Show the icon after the title is fully typed
      setShowIcons((prev) => {
        const updated = [...prev];
        updated[stepIndex] = true;
        return updated;
      });

      // Small delay before next title starts
      await new Promise((res) => setTimeout(res, 400));

      // Start typing next step
      if (stepIndex + 1 < steps.length) {
        typeStep(stepIndex + 1);
      }
    };

    // Start typing the first step
    typeStep(0);
  }, []);
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
            border: "1px solid #FFFFFF",
            padding: "20px",
            minHeight: "350px",
            backgroundColor: "#FFF",
            width: "100%",
          }}
        >
          <div
            style={{
              padding: "40px 40px",
              maxWidth: "700px",
              margin: "40px auto",
              borderRadius: "20px",
              background: "linear-gradient(to right, #f4f9ff, #e6eeff)",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
              fontFamily: "'Segoe UI', sans-serif",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                fontSize: "2rem",
                fontWeight: "600",
                marginBottom: "30px",
                background: "linear-gradient(to right, #007bff, #ff416c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              How TaxGPT Works
            </h2>

            {steps.map((step, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#fff",
                  padding: "20px 25px",
                  borderRadius: "16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
                  transform: showIcons[index] ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.3s ease",
                }}
              >
                <span
                  style={{
                    fontSize: "24px",
                    transition: "transform 0.3s ease",
                    transform: showIcons[index] ? "scale(1.3)" : "scale(0)",
                  }}
                >
                  {showIcons[index] ? step.icon : ""}
                </span>
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 500,
                    color: "#333",
                    minHeight: "1.5rem",
                  }}
                >
                  {typedTitles[index]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Intro;
