import React, { useEffect, useRef, useState } from "react";
import "./chat.css";
import { jwtDecode } from "jwt-decode";
import socket from "../socket";

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");

  const messagesEndRef = useRef(null);

  const generateRoomId = (email1, email2) => {
    return [email1, email2].sort().join("_");
  };

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

  // ✅ SINGLE SOCKET CONNECTION (FIXED)
  useEffect(() => {
    if (!socket.connected) {
      socket.auth = {
        token: localStorage.getItem("token"),
      };
      socket.connect();
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoinRoom = async () => {
    if (!targetEmail.trim()) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/user?email=${targetEmail}`
      );

      if (!res.ok) return;

      const user = await res.json();

      if (user.email === currentUserEmail) return;

      const newRoomId = generateRoomId(currentUserEmail, user.email);

      setRoomId(newRoomId);
      setIsGroup(false);
      setMessages([]);

      socket.emit("join_room", newRoomId);
    } catch (err) {
      console.log(err);
    }
  };

  const handleJoinGroup = () => {
    if (!groupName.trim()) return;

    const groupRoomId = `group_${groupName.trim().toLowerCase()}`;

    setRoomId(groupRoomId);
    setIsGroup(true);
    setMessages([]);

    socket.emit("join_room", groupRoomId);
  };

  const handleFileUpload = async (file) => {
    if (!file || !roomId) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.fileUrl) return;

      await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          message: data.fileUrl,
          roomId,
          type: "file",
          isGroup,
        }),
      });
    } catch (error) {
      console.log("File upload error:", error);
    }
  };

  useEffect(() => {
    if (!currentUserId || !roomId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/messages?roomId=${roomId}`
        );
        const data = await response.json();

        const formattedMessages = data.map((msg) => ({
          text: msg.message,
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sender: msg.UserId === currentUserId ? "me" : "other",
          type: msg.type || "text",
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.log(error);
      }
    };

    fetchMessages();
  }, [currentUserId, roomId]);

  useEffect(() => {
    if (!currentUserId) return;

    const handleNewMessage = (msg) => {
      if (msg.roomId !== roomId) return;

      setMessages((prev) => [
        ...prev,
        {
          text: msg.message,
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sender: msg.UserId === currentUserId ? "me" : "other",
          type: msg.type || "text",
        },
      ]);
    };

    socket.on("receive_message", handleNewMessage);

    return () => {
      socket.off("receive_message", handleNewMessage);
    };
  }, [currentUserId, roomId]);

  useEffect(() => {
    return () => {
      if (roomId) {
        socket.emit("leave_room", roomId);
      }
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !roomId) return;

    try {
      await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          message: input,
          roomId,
          type: "text",
          isGroup,
        }),
      });

      setInput("");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>{isGroup ? "Group Chat" : "Personal Chat"}</h2>

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

      <div style={{ padding: "10px" }}>
        <input
          type="email"
          placeholder="Enter user email..."
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
        />
        <button onClick={handleJoinRoom}>Start Chat</button>
      </div>

      <div style={{ padding: "10px" }}>
        <input
          type="file"
          onChange={(e) => handleFileUpload(e.target.files[0])}
        />
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.sender === "me" ? "sent" : "received"
            }`}
          >
            {msg.type === "file" ? (
              <a href={msg.text} target="_blank" rel="noreferrer">
                📎 Open File
              </a>
            ) : (
              <p>{msg.text}</p>
            )}
            <span>{msg.time}</span>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="chat-input">
        <input
          type="text"
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