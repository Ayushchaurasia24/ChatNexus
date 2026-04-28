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
  const messagesEndRef = useRef(null);

  // ✅ Get current userId safely
  const token = localStorage.getItem("token");
  let currentUserId = null;

  try {
    const decoded = token ? jwtDecode(token) : null;
    currentUserId = decoded?.id;
  } catch (err) {
    console.log("Invalid token");
  }

  // ✅ Fetch messages from backend
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

  // ✅ Join personal room
  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("join_room", currentUserId);

  }, [currentUserId]);

  // ✅ Socket listener (real-time messages)
  useEffect(() => {
    if (!currentUserId) return;

    const handleNewMessage = (msg) => {
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
  }, [currentUserId]);

  // ✅ Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send message (API only, socket handles UI)
  const handleSend = async () => {
    if (input.trim() === "") return;

    try {
      // ✅ Send via API (DB storage)
      const res = await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({ message: input }),
      });

      const savedMessage = await res.json();

      // ✅ ALSO send via socket (real-time)
      socket.emit("send_message", {
        roomId: currentUserId,
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
        <h2>Group Chat</h2>
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