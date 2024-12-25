import React, { useContext, useEffect, useState } from "react";
import SideBarC1 from "./SideBarC1";
import SideBarC2 from "./SideBarC2";
import SideBarC3 from "./SideBarC3";
import { AddingChat } from "./SecondPage";
import { DarkMode } from "./SecondPage";
import "./all.css";

const Sidebar = (props) => {
  const { chats, updateChatText, deleteChat } = useContext(AddingChat);
  const { dark } = useContext(DarkMode);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [wasMobile, setWasMobile] = useState(window.innerWidth < 992);

  // Monitor screen resizing and toggle `isOpen` when entering mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobileScreen = window.innerWidth < 992;

      setIsMobile(mobileScreen);

      // Toggle `isOpen` only if entering/exiting mobile view
      if (mobileScreen !== wasMobile) {
        props.isToggleClicked();
        setWasMobile(mobileScreen);
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup the event listener
    return () => window.removeEventListener("resize", handleResize);
  }, [props.isToggleClicked, wasMobile]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: props.isOpen
          ? isMobile
            ? "row-reverse"
            : "row"
          : "row-reverse",
        position: "relative",
        height: "100vh",
      }}
    >
      {/* Blurred overlay for mobile view */}
      {isMobile && props.isOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.4)", // Dark overlay
            backdropFilter: "blur(5px)", // Blur effect
            zIndex: 1,
          }}
          onClick={props.isToggleClicked} // Close sidebar on clicking overlay
        ></div>
      )}
      {props.isOpen && (
        <div
          style={{
            width: "300px",
            backgroundColor: dark
              ? isMobile
                ? "var(--light-dark-bg-color)"
                : "var(--light-dark-bg-color)"
              : isMobile
              ? "var(--sidebar-bg-color)"
              : "var(--sidebar-bg-color)",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            zIndex: isMobile ? 2 : "auto", // Bring sidebar to top in mobile view
            position: isMobile ? "absolute" : "relative", // Position sidebar on top in mobile view
            height: "100%",
            top: 0,
            left: 0,
            boxShadow: isMobile ? "0px 0px 10px rgba(0, 0, 0, 0.5)" : "none",
            transition: "left 0.3s ease",
          }}
        >
          <SideBarC1 checkClick={props.isToggleClicked} />
          <SideBarC2
            chats={chats}
            updateChatText={updateChatText}
            deleteChat={deleteChat}
            setActiveChat={props.setActiveChat}
            activeChat={props.activeChat}
          />
          <SideBarC3 />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
