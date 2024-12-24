import React from "react";

const Footer = () => {
  return (
    <footer className="d-none d-lg-block bg-light py-3 fixed-bottom">
      <div className="container mx-3" style={{ padding: "13px" }}>
        <a
          className="me-3 text-decoration-none"
          href="#"
          style={{ color: "#758694", fontWeight: "bolder", fontSize: "18px" }}
        >
          FBR
        </a>
        <a
          className="text-decoration-none mx-4"
          href="#"
          style={{ color: "#000" }}
        >
          Privacy & Terms
        </a>
      </div>
    </footer>
  );
};

export default Footer;
