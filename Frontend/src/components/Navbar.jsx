import React, { useState } from "react";
// import moon from "../assets/moon.svg";
// import sun from "../assets/sun.svg";

const Navbar = () => {
  const [hover, setHover] = useState(false);
  // const [message, setMessage] = useState("");

  // useEffect(() => {
  //   fetch("/api/hello")
  //     .then((response) => response.json())
  //     .then((data) => setMessage(data.message))
  //     .catch((error) => console.error("Error fetching API:", error));
  // }, []);

  // const [light_or_dark, setMode] = useState(moon);

  // const changeMode = () => {
  //   if (light_or_dark === moon) {
  //     console.log("reached");
  //     setMode(sun);
  //   } else {
  //     setMode(moon);
  //   }
  // };

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container-fluid">
        <a className="navbar-brand" href="#" style={{ margin: "10px" }}>
          TaxGPT
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {/* <li className="nav-item">
              <button
                style={{
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "50%",
                  height: "45px",
                  width: "45px",
                }}
                onClick={changeMode}
              >
                <img
                  style={{ verticalAlign: "unset" }}
                  src={light_or_dark}
                  alt=""
                />
              </button>
            </li> */}
            {/* <li className="nav-item">
              <a
                className="nav-link mx-3"
                href="#"
                style={{ color: "#1866BF", fontWeight: "500" }}
              >
                {message}
              </a>
            </li> */}
            <li className="nav-item">
              <a
                className="nav-link mx-3"
                href="#"
                style={{ color: "#1866BF", fontWeight: "500" }}
              >
                FAQ
              </a>
            </li>
            <li className="nav-item">
              <button
                onMouseEnter={() => setHover(true)} // Trigger hover state
                onMouseLeave={() => setHover(false)} // Reset hover state
                onClick={() => {
                  // Redirect to the backend route for Google OAuth
                  window.location.href = "http://localhost:5000/login/google";
                }}
                className="btn ms-2 mx-4"
                style={{
                  color: "#fff",
                  background: hover ? "#1866BF" : "#4285F4", // Background color changes on hover
                  width: "80px",
                  borderRadius: "15px",
                  fontWeight: "600",
                  transition: "background 0.3s, color 0.3s",
                }}
              >
                Sign in
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
