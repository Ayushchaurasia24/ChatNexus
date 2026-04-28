import React, { useEffect, useRef, useState } from "react";
import "./chat.css";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

// Create socket ONCE (singleton)
const socket = io("http://localhost:5000", {
  auth: {
    token: localStorage.getItem("token"),
  },
});

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [roomId, setRoomId] = useState(null);
  const messagesEndRef = useRef(null);

  //helper to generate unique room
  const generateRoomId = (email1, email2) => {
    return [email1, email2].sort().join("_");
  };

  //Get current userId safely
  const token = localStorage.getItem("token");
  let currentUserId = null;

  try {
    const decoded = token ? jwtDecode(token) : null;
    currentUserId = decoded?.id;
  } catch (err) {
    console.log("Invalid token", err);
  }

  //JOIN ROOM USING EMAIL
  const handleJoinRoom = async () => {
    if (!targetEmail.trim()) return;

    try {
      // ✅ STEP 1: verify user exists
      const res = await fetch(
        `http://localhost:5000/api/auth/user?email=${targetEmail}`
      );

      if (!res.ok) {
        console.log("User not found");
        return;
      }

      const user = await res.json();

      // ✅ STEP 2: get both emails
      const currentUserEmail = jwtDecode(
        localStorage.getItem("token")
      )?.email;

      const otherUserEmail = user.email;
      if (otherUserEmail === currentUserEmail) {
        console.log("Cannot chat with yourself");
        return;
      }

      // ✅ STEP 3: generate consistent room
      const newRoomId = generateRoomId(
        currentUserEmail,
        otherUserEmail
      );

      setRoomId(newRoomId);

      // ✅ STEP 4: join room
      socket.emit("join_room", newRoomId);

      console.log("Joined room:", newRoomId);
    } catch (err) {
      console.log("Error joining room:", err);
    }
  };

  // fetch messages from backend
  useEffect(() => {
    if (!currentUserId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/messages");
        const data = await response.json();

        const formattedMessages = data.map((msg) => ({
          text: msg.message,
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sender: msg.UserId === currentUserId ? "me" : "other",
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.log("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [currentUserId]);

  // because now we use dynamic room ,receive message ONLY for active room
  useEffect(() => {
    if (!currentUserId) return;

    const handleNewMessage = (msg) => {
      //filter by room
      if (msg.roomId !== roomId) return;

      const formattedMessage = {
        text: msg.message,
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sender: msg.UserId === currentUserId ? "me" : "other",
      };

      setMessages((prev) => [...prev, formattedMessage]);
    };

    socket.on("receive_message", handleNewMessage);

    return () => {
      socket.off("receive_message", handleNewMessage);
    };
  }, [currentUserId, roomId]); //added roomId dependency

  //leave previous room when room changes
  useEffect(() => {
    return () => {
      if (roomId) {
        socket.emit("leave_room", roomId);
      }
    };
  }, [roomId]);

  // ✅ Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //send message to ROOM (not self)
  const handleSend = async () => {
    if (input.trim() === "" || !roomId) return;

    try {
      const res = await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({ message: input }),
      });

      const savedMessage = await res.json();

      //send to selected room
      socket.emit("send_message", {
        roomId: roomId,
        message: savedMessage.message,
        createdAt: savedMessage.createdAt,
        UserId: currentUserId,
      });

      setInput("");
    } catch (error) {
      console.log("Error sending message:", error);
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <h2>Personal Chat</h2>
      </div>

      {/* 🟡 NEW: USER SEARCH UI */}
      <div style={{ padding: "10px" }}>
        <input
          type="email"
          placeholder="Enter user email..."
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
        />
        <button onClick={handleJoinRoom}>Start Chat</button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.sender === "me" ? "sent" : "received"
            }`}
          >
            <p>{msg.text}</p>
            <span>{msg.time}</span>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;