import React, { useState, createContext, useEffect } from "react";
import SideBar from "./SideBar";
import Navbar2 from "./Navbar2";
import ChatArea from "./ChatArea";
import { isToday, isYesterday, isWithinInterval, subDays } from "date-fns";

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
  const [chats, setChats] = useState({
    today: [],
    yesterday: [],
    past7Days: [],
    past30Days: [],
    older: [],
  }); // Sample chat history
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
          const groupedChats = {
            today: [],
            yesterday: [],
            past7Days: [],
            past30Days: [],
            older: [],
          };

          const today = new Date();
          const sevenDaysAgo = subDays(today, 7);
          const thirtyDaysAgo = subDays(today, 30);

          data.forEach((chat) => {
            const chatDate = new Date(chat.created_at);
            const formattedChat = {
              id: chat.id,
              hash_id: chat.hash_id, // Include hash_id
              text: chat.title,
              icon: <ThreeDotsIcon />,
              created_at: chatDate,
            };

            if (isToday(chatDate)) {
              groupedChats.today.unshift(formattedChat);
            } else if (isYesterday(chatDate)) {
              groupedChats.yesterday.unshift(formattedChat);
            } else if (
              isWithinInterval(chatDate, { start: sevenDaysAgo, end: today })
            ) {
              groupedChats.past7Days.unshift(formattedChat);
            } else if (
              isWithinInterval(chatDate, { start: thirtyDaysAgo, end: today })
            ) {
              groupedChats.past30Days.unshift(formattedChat);
            } else {
              groupedChats.older.unshift(formattedChat);
            }
          });

          setChats(groupedChats);

          // Check the current URL for a hash_id
          const currentHashId = window.location.pathname.split("/chat/")[1];

          if (currentHashId) {
            // Find the chat matching the hash_id
            const allChats = [
              ...groupedChats.today,
              ...groupedChats.yesterday,
              ...groupedChats.past7Days,
              ...groupedChats.past30Days,
              ...groupedChats.older,
            ];

            const matchingChat = allChats.find(
              (chat) => chat.hash_id === currentHashId
            );

            if (matchingChat) {
              setActiveChat(matchingChat);
            } else {
              console.error("Chat not found for hash_id:", currentHashId);
            }
          } else {
            // Set the latest chat as active if no hash_id is in the URL
            const allChats = [
              ...groupedChats.today,
              ...groupedChats.yesterday,
              ...groupedChats.past7Days,
              ...groupedChats.past30Days,
              ...groupedChats.older,
            ];

            const mostRecentChat = allChats.reduce((latest, current) => {
              return !latest || current.created_at > latest.created_at
                ? current
                : latest;
            }, null);

            if (mostRecentChat) {
              setActiveChat(mostRecentChat);
              // Update the URL to include the hash_id of the latest chat
              window.history.pushState(
                {},
                "",
                `/chat/${mostRecentChat.hash_id}`
              );
            }
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
        console.log("Raw messages from backend:", data.messages);
        if (response.ok) {
          const formattedMessages = data.messages
            .map((msg) => ({
              id: msg.id,
              sender: msg.sender,
              text: msg.content,
              file_path: msg.file_path,
              file_type: msg.file_type,
              created_at: new Date(msg.created_at), // Parse created_at to Date object
            }))
            .sort(
              (a, b) =>
                a.created_at.getTime() === b.created_at.getTime()
                  ? a.id - b.id // Use id to break ties when created_at is the same
                  : a.created_at - b.created_at // Sort by created_at
            ); // Sort by created_at ascending
          console.log("Formatted and sorted messages:", formattedMessages);
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
        body: JSON.stringify({ title: "New Chat" }),
      });

      const data = await response.json();

      if (response.ok) {
        const newChat = {
          id: data.chat_id,
          hash_id: data.hash_id,
          text: data.title,
          icon: <ThreeDotsIcon />,
          created_at: new Date(data.created_at),
        };
        setChats((prevChats) => {
          const updatedChats = { ...prevChats }; // Shallow copy of the current grouped chats
          updatedChats.today = [newChat, ...updatedChats.today]; // Add new chat to the "today" group at the beginning
          return updatedChats;
        });

        setActiveChat(newChat);
        window.history.pushState({}, "", `/chat/${newChat.hash_id}`);
        setMessages([]);
        setClickable(false); // Set to false when a new chat is successfully created
      } else {
        console.error("Failed to create new chat:", data.error);
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const updateChatText = (chatId, newText) => {
    setChats((prevChats) => {
      if (!prevChats || typeof prevChats !== "object") return prevChats;

      const updatedChats = {};

      for (const [group, chats] of Object.entries(prevChats)) {
        updatedChats[group] = chats.map((chat) =>
          chat.id === chatId ? { ...chat, text: newText } : chat
        );
      }

      return updatedChats; // Return the updated grouped chats
    });
  };

  const deleteChat = (chatId) => {
    setChats((prevChats) => {
      if (!prevChats || typeof prevChats !== "object") return prevChats;

      const updatedChats = {};

      for (const [group, chats] of Object.entries(prevChats)) {
        updatedChats[group] = chats.filter((chat) => chat.id !== chatId);
      }

      return updatedChats; // Return the updated grouped chats
    });

    // Clear activeChat if the deleted chat was active
    if (activeChat?.id === chatId) {
      setActiveChat(null);
    }
  };

  const updateChatTitle = (chatId, newTitle) => {
    setChats((prevChats) => {
      if (!prevChats || typeof prevChats !== "object") return prevChats;

      const updatedChats = {};

      for (const [group, chats] of Object.entries(prevChats)) {
        updatedChats[group] = chats.map((chat) =>
          chat.id === chatId ? { ...chat, text: newTitle } : chat
        );
      }

      return updatedChats; // Return the updated grouped chats
    });
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
      <ChatClickable.Provider
        value={{ newChatClickable, setClickable, changingClickable }}
      >
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
                    updateChatTitle={updateChatTitle}
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
