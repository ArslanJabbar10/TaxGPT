import React, { useState, useContext } from "react";
import { DarkMode } from "./SecondPage";
import "./all.css";

const SideBarC3 = () => {
  const [hoverH, setHoverH] = useState(false);
  const [hoverS, setHoverS] = useState(false);
  const { dark } = useContext(DarkMode);

  return (
    <div>
      <div
        onMouseEnter={() => setHoverH(true)}
        onMouseLeave={() => setHoverH(false)}
        style={{
          padding: "10px",
          marginBottom: "5px",
          backgroundColor: hoverH
            ? dark
              ? "var(--light-dark-hover-color)" // Dark mode hover color
              : "var(--hover-bg-color)" // Light mode hover color
            : dark
            ? "var(--light-dark-bg-color)" // Dark mode non-hover color
            : "var(--sidebar-bg-color)", // Light mode non-hover color
          border: `1px solid ${
            dark ? "var(--light-dark-bg-color)" : "var(--sidebar-bg-color)"
          }`,
          borderRadius: "8px",
          cursor: "pointer",
          transition: "background 0.1s",
          position: "relative", // Parent must be relative for absolute positioning to work
          display: "flex", // Use flexbox to align children
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="17"
          fill={dark ? "#FFFFFF" : "#000000"}
          className="bi bi-question-circle"
          viewBox="0 0 16 16"
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94" />
        </svg>
        <span
          style={{ marginLeft: "20px", color: dark ? "#FFFFFF" : "#000000" }}
        >
          Help
        </span>
      </div>
      <div
        onMouseEnter={() => setHoverS(true)}
        onMouseLeave={() => setHoverS(false)}
        style={{
          padding: "10px",
          marginBottom: "5px",
          backgroundColor: hoverS
            ? dark
              ? "var(--light-dark-hover-color)" // Dark mode hover color
              : "var(--hover-bg-color)" // Light mode hover color
            : dark
            ? "var(--light-dark-bg-color)" // Dark mode non-hover color
            : "var(--sidebar-bg-color)", // Light mode non-hover color
          border: `1px solid ${
            dark ? "var(--light-dark-bg-color)" : "var(--sidebar-bg-color)"
          }`,
          borderRadius: "8px",
          cursor: "pointer",
          transition: "background 0.3s",
          position: "relative", // Parent must be relative for absolute positioning to work
          display: "flex", // Use flexbox to align children
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="17"
          fill={dark ? "#FFFFFF" : "#000000"}
          className="bi bi-gear"
          viewBox="0 0 16 16"
        >
          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
        </svg>
        <span
          style={{ marginLeft: "20px", color: dark ? "#FFFFFF" : "#000000" }}
        >
          Settings
        </span>
      </div>
    </div>
  );
};

export default SideBarC3;
