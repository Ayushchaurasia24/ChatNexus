import React, { useEffect, useRef, useState } from "react";
import "./chat.css";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

// ✅ Create socket ONCE (singleton)
const socket = io("http://localhost:5000", {
  auth: {
    token: localStorage.getItem("token"),
  },
});

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Personal chat
  const [targetEmail, setTargetEmail] = useState("");

  // Room + mode
  const [roomId, setRoomId] = useState(null);
  const [isGroup, setIsGroup] = useState(false);

  // Group chat
  const [groupName, setGroupName] = useState("");

  const messagesEndRef = useRef(null);

  // ✅ Generate unique room ID (order-independent)
  const generateRoomId = (email1, email2) => {
    return [email1, email2].sort().join("_");
  };

  // ✅ Get current user
  const token = localStorage.getItem("token");
  let currentUserId = null;
  let currentUserEmail = null;

  try {
    const decoded = token ? jwtDecode(token) : null;
    currentUserId = decoded?.id;
    currentUserEmail = decoded?.email;
  } catch (err) {
    console.log("Invalid token", err);
  }

  // =========================
  // 🔹 JOIN PERSONAL CHAT
  // =========================
  const handleJoinRoom = async () => {
    if (!targetEmail.trim()) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/user?email=${targetEmail}`
      );

      if (!res.ok) {
        console.log("User not found");
        return;
      }

      const user = await res.json();
      const otherUserEmail = user.email;

      // ❌ Prevent self-chat
      if (otherUserEmail === currentUserEmail) {
        console.log("Cannot chat with yourself");
        return;
      }

      const newRoomId = generateRoomId(
        currentUserEmail,
        otherUserEmail
      );

      setRoomId(newRoomId);
      setIsGroup(false); // ✅ FIXED
      setMessages([]);   // ✅ clear old chat

      socket.emit("join_room", newRoomId);

      console.log("Joined personal room:", newRoomId);
    } catch (err) {
      console.log("Error joining room:", err);
    }
  };

  // =========================
  // 🔹 JOIN GROUP CHAT
  // =========================
  const handleJoinGroup = () => {
    if (!groupName.trim()) return;

    const groupRoomId = `group_${groupName.trim().toLowerCase()}`;

    setRoomId(groupRoomId);
    setIsGroup(true);
    setMessages([]); // ✅ FIXED

    socket.emit("join_room", groupRoomId);

    console.log("Joined group:", groupRoomId);
  };

  // =========================
  // 🔹 FETCH MESSAGES (initial)
  // =========================
  useEffect(() => {
    if (!currentUserId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/messages"
        );
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

  // =========================
  // 🔹 SOCKET LISTENER
  // =========================
  useEffect(() => {
    if (!currentUserId) return;

    const handleNewMessage = (msg) => {
      // ✅ Only messages for current room
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
  }, [currentUserId, roomId]);

  // =========================
  // 🔹 LEAVE ROOM CLEANUP
  // =========================
  useEffect(() => {
    return () => {
      if (roomId) {
        socket.emit("leave_room", roomId);
      }
    };
  }, [roomId]);

  // =========================
  // 🔹 AUTO SCROLL
  // =========================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================
  // 🔹 SEND MESSAGE
  // =========================
  const handleSend = async () => {
    if (input.trim() === "" || !roomId) return;

    try {
      const res = await fetch(
        "http://localhost:5000/api/messages/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token"),
          },
          body: JSON.stringify({ message: input }),
        }
      );

      const savedMessage = await res.json();

      socket.emit("send_message", {
        roomId,
        message: savedMessage.message,
        createdAt: savedMessage.createdAt,
        UserId: currentUserId,
        isGroup,
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
        <h2>{isGroup ? "Group Chat" : "Personal Chat"}</h2>

        {/* Group Chat */}
        <div style={{ padding: "10px" }}>
          <input
            type="text"
            placeholder="Enter group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <button onClick={handleJoinGroup}>Join Group</button>
        </div>
      </div>

      {/* Personal Chat */}
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