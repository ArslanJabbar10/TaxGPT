import React, { useState } from "react";

const WelcomeLine = () => {
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
          setUserName(data.name);
        } else {
          console.error("Failed to fetch user name:", data.error);
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div>
      <h1>Welcome, {userName}</h1>
    </div>
  );
};

export default WelcomeLine;
