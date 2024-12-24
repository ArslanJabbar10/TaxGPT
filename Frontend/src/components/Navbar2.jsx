import React, { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DarkMode } from "./SecondPage";
import "./all.css";
// import { ChatClickable } from "./SecondPage";
// import { AddingChat } from "./SecondPage";
// import { ClearChat } from "./SecondPage";

const Navbar2 = (props) => {
  const [hoverS, setHoverS] = useState(false);
  const [hoverU, setHoverU] = useState(false);
  const [hoverL, setHoverL] = useState(false);
  const { dark, setDark } = useContext(DarkMode);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null); // Ref for dropdown to detect clicks outside
  // const { newChatClickable } = useContext(ChatClickable);
  // const { addNewChat } = useContext(AddingChat);
  // const { isPlusClicked } = useContext(ClearChat);
  const [profilePicture, setProfilePicture] = useState(null); // State for profile picture

  const [isMobile, setIsMobile] = useState(window.innerWidth < 992); // Track screen size

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        } else {
          console.error("Failed to fetch user info:", data.error);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/logout", {
        method: "GET",
        credentials: "include", // Include session cookies
      });

      if (response.ok) {
        navigate("/"); // Navigate to FirstPage.jsx
      } else {
        console.error("Logout failed:", await response.text());
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDarkMode = (event) => {
    setDark(event.target.checked); // Set dark mode to true if checked, false otherwise
  };

  return (
    <nav
      className="navbar"
      style={{
        width: "100%",
        height: "60px",
        backgroundColor: dark ? "var(--dark-dark-bg-color)" : "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: isMobile
          ? "center"
          : props.expand_btn
          ? "flex-start"
          : "space-between",
        padding: "0 20px",
        position: "relative",
      }}
    >
      {/* Left section */}
      <div
        className="container-fluid"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "space-between" : "flex-start",
          gap: "30px",
        }}
      >
        {/* Toggle Button */}
        {(props.expand_btn || isMobile) && (
          <button
            onClick={props.isExpandedBtnClicked}
            onMouseEnter={() => setHoverS(true)}
            onMouseLeave={() => setHoverS(false)}
            style={{
              background: hoverS
                ? dark
                  ? "var(--light-dark-bg-color)"
                  : "var(--hover-bg-color)"
                : dark
                ? "var(--dark-dark-bg-color)"
                : "#FFFFFF",
              border: "none",
              height: "40px",
              width: "40px",
              borderRadius: "50%",
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
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
        )}

        {/* TaxGPT Text */}
        <span
          style={{
            position: isMobile ? "absolute" : "static",
            left: "50%",
            transform: isMobile ? "translateX(-50%)" : "none",
            fontSize: "20px",
            fontWeight: "500",
            color: dark ? "#FFFFFF" : "#000000",
            whiteSpace: "nowrap",
            fontFamily: "sans-serif",
          }}
        >
          TaxGPT
        </span>
      </div>

      {/* Right section */}
      <div
        className="right-section"
        style={{
          position: "absolute",
          right: "20px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Account Button */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault(); // Prevent default behavior of the anchor tag
            toggleDropdown();
          }}
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: dark
              ? "1px solid var(--dark-dark-bg-color)"
              : "1px solid #FFFFFF", // Optional: Add a border
            textDecoration: "none",
          }}
        >
          <img
            src={profilePicture} // Replace with your image source
            alt="User Avatar"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </a>
        {/* Dropdown Menu */}
        {dropdownVisible && (
          <ul
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: "36px", // Adjust based on the icon's height
              right: "0", // Align to the right edge of the icon
              zIndex: 1000,
              backgroundColor: dark ? "var(--light-dark-bg-color)" : "#FFFFFF",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              borderRadius: "12px",
              padding: "10px 10px",
              listStyle: "none",
              width: "180px",
              transition: "transform 0.9s ease", // Add transition
            }}
          >
            <li
              onMouseEnter={() => setHoverU(true)}
              onMouseLeave={() => setHoverU(false)}
              style={{
                padding: "8px 15px",
                display: "flex",
                alignItems: "center",
                borderRadius: "8px",
                backgroundColor: dark
                  ? hoverU
                    ? "var(--light-dark-hover-color)"
                    : "var(--light-dark-bg-color)"
                  : hoverU
                  ? "var(--hover-bg-color)"
                  : "#FFFFFF",
              }}
            >
              <div className="form-check form-switch">
                <input
                  style={{ cursor: "pointer" }}
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="flexSwitchCheckDefault"
                  onChange={toggleDarkMode}
                  checked={dark} // Bind the checked state to `dark`
                />
              </div>
              <div
                style={{
                  marginLeft: "10px",
                  color: dark ? "#FFFFFF" : "#000000",
                }}
              >
                Dark Mode
              </div>
            </li>
            <li
              onMouseEnter={() => setHoverL(true)}
              onMouseLeave={() => setHoverL(false)}
              onClick={handleLogout}
              style={{
                padding: "8px 15px",
                cursor: "pointer",
                borderTop: "1px solid #8e8e8e",
                display: "flex",
                alignItems: "center",
                borderRadius: "8px",
                backgroundColor: dark
                  ? hoverL
                    ? "var(--light-dark-hover-color)"
                    : "var(--light-dark-bg-color)"
                  : hoverL
                  ? "var(--hover-bg-color)"
                  : "#FFFFFF",
              }}
            >
              <div
                style={{
                  marginLeft: "10px",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill={dark ? "#FFFFFF" : "#000000"}
                  className="bi bi-box-arrow-right"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"
                  />
                  <path
                    fillRule="evenodd"
                    d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"
                  />
                </svg>
              </div>
              <div
                style={{
                  marginLeft: "30px",
                  color: dark ? "#FFFFFF" : "#000000",
                }}
              >
                Logout
              </div>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar2;
