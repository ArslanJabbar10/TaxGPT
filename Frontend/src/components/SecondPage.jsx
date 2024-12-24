import React, { useState, createContext, useEffect } from "react";
import SideBar from "./SideBar";
import Navbar2 from "./Navbar2";
import ChatArea from "./ChatArea";

const ChatClickable = createContext();
const AddingChat = createContext();
const ClearChat = createContext();
const DarkMode = createContext();

const ThreeDotsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    className="bi bi-three-dots"
    viewBox="0 0 16 16"
  >
    <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" />
  </svg>
);

const SecondPage = () => {
  const [isOpen, setIsOpen] = useState(true); // To toggle the sidebar
  const [expand_btn, setExpandBtn] = useState(false);
  const [newChatClickable, setClickable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]); // Sample chat history
  const [activeChat, setActiveChat] = useState(null); // Active chat state
  const [dark, setDark] = useState(false);

  // Fetch chats from backend when component mounts
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/get_chats", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          const formattedChats = data.map((chat) => ({
            id: chat.id, // Add chat_id to each chat
            text: chat.title, // Displayed chat title
            icon: <ThreeDotsIcon />,
          }));
          setChats(formattedChats);
          if (formattedChats.length > 0) {
            setActiveChat(formattedChats[formattedChats.length - 1]); // Set latest chat as active
          }
        } else {
          console.error("Failed to fetch chats:", data.error);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats();
  }, []);

  // Fetch messages for active chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/get_messages?chat_id=${activeChat.id}`,
          { method: "GET", credentials: "include" }
        );
        const data = await response.json();
        if (response.ok) {
          const formattedMessages = data.messages.map((msg) => ({
            sender: msg.sender,
            text: msg.content,
          }));
          setMessages(formattedMessages);
          // Check if messages exist and set newChatClickable to true
          if (formattedMessages.length > 0) {
            setClickable(true);
          } else {
            setClickable(false); // Optional: Reset if no messages exist
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [activeChat]);

  const addNewChat = async () => {
    console.log("addNewChat called");

    try {
      const response = await fetch("http://localhost:5000/api/new_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include session cookies
        body: JSON.stringify({ title: `Chat ${chats.length + 1}` }),
      });

      const data = await response.json();

      if (response.ok) {
        const newChat = {
          id: data.chat_id,
          text: data.title,
          icon: <ThreeDotsIcon />,
        };
        setChats((prevChats) => [...prevChats, newChat]);
        setActiveChat(newChat);
        setMessages([]);
        setClickable(false); // Set to false when a new chat is successfully created
      } else {
        console.error("Failed to create new chat:", data.error);
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const updateChatText = (index, newText) => {
    setChats((prevChats) => {
      const updatedChats = [...prevChats]; // Create a shallow copy of the chats
      updatedChats[index].text = newText; // Update the specific chat's text
      return updatedChats;
    });
  };

  const deleteChat = (index) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.filter((_, i) => i !== index); // Remove chat at the given index
      console.log("Updated Chats after deletion:", updatedChats); // Log the updated chats

      return updatedChats;
    });
    // Clear activeChat if the deleted chat was active
    if (chats[index]?.id === activeChat?.id) {
      setActiveChat(null);
    }
  };

  const isPlusClicked = () => {
    setMessages([]);
  };

  const sidebar_changes = () => {
    if (isOpen) {
      setIsOpen(false);
      setExpandBtn(true);
    } else {
      setIsOpen(true);
      setExpandBtn(false);
    }
  };

  const changingClickable = () => {
    setClickable(true);
  };

  return (
    <>
      <ChatClickable.Provider value={{ newChatClickable, changingClickable }}>
        <AddingChat.Provider
          value={{ addNewChat, chats, updateChatText, deleteChat }}
        >
          <ClearChat.Provider value={{ isPlusClicked }}>
            <DarkMode.Provider value={{ dark, setDark }}>
              <div
                style={{
                  display: "flex",
                  height: "100vh",
                  flexDirection: "row",
                }}
              >
                <SideBar
                  isToggleClicked={sidebar_changes}
                  isOpen={isOpen}
                  setActiveChat={setActiveChat}
                  setIsOpen={setIsOpen}
                  activeChat={activeChat}
                />
                <div
                  style={{
                    flexGrow: 1,
                    width: isOpen ? `calc(100% - 250px)` : `100%`, // Adjust 250px based on Sidebar width
                    transition: "width 0.3s ease",
                  }}
                >
                  <Navbar2
                    isExpandedBtnClicked={sidebar_changes}
                    expand_btn={expand_btn}
                  />
                  <ChatArea
                    messages={messages}
                    setMessages={setMessages}
                    activeChat={activeChat}
                  />
                </div>
              </div>
            </DarkMode.Provider>
          </ClearChat.Provider>
        </AddingChat.Provider>
      </ChatClickable.Provider>
    </>
  );
};

export default SecondPage;
export { ChatClickable };
export { AddingChat };
export { ClearChat };
export { DarkMode };
