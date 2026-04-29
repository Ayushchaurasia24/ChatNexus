import React, { useEffect, useRef, useState } from "react";
import "./chat.css";
import { jwtDecode } from "jwt-decode";
import socket from "../socket";

const ChatWindow = () => {
  // ================= STATE =================
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");

  // ✅ AI STATES (FIXED LOCATION)
  const [suggestions, setSuggestions] = useState([]);
  const [replies, setReplies] = useState([]);

  const messagesEndRef = useRef(null);

  // ================= AUTH =================
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

  // ================= SOCKET =================
  useEffect(() => {
    if (!socket.connected) {
      socket.auth = { token };
      socket.connect();
    }

    return () => socket.disconnect();
  }, []);

  // ================= JOIN PERSONAL =================
  const handleJoinRoom = async () => {
    if (!targetEmail.trim()) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/user?email=${targetEmail}`
      );

      if (!res.ok) return;

      const user = await res.json();

      if (user.email === currentUserEmail) return;

      const newRoomId =
        currentUserEmail < user.email
          ? `${currentUserEmail}_${user.email}`
          : `${user.email}_${currentUserEmail}`;

      setRoomId(newRoomId);
      setIsGroup(false);
      setMessages([]);

      socket.emit("join_room", newRoomId);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= JOIN GROUP =================
  const handleJoinGroup = () => {
    if (!groupName.trim()) return;

    const groupRoomId = `group_${groupName.toLowerCase()}`;
    setRoomId(groupRoomId);
    setIsGroup(true);
    setMessages([]);

    socket.emit("join_room", groupRoomId);
  };

  // ================= FILE UPLOAD =================
  const handleFileUpload = async (file) => {
    if (!file || !roomId) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const data = await res.json();

    if (!data.fileUrl) return;

    await fetch("http://localhost:5000/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        message: data.fileUrl,
        roomId,
        type: "file",
        isGroup,
      }),
    });
  };

  // ================= FETCH OLD MESSAGES =================
  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      const res = await fetch(
        `http://localhost:5000/api/messages?roomId=${roomId}`
      );
      const data = await res.json();

      setMessages(
        data.map((msg) => ({
          text: msg.message,
          sender: msg.UserId === currentUserId ? "me" : "other",
          time: new Date(msg.createdAt).toLocaleTimeString(),
          type: msg.type || "text",
        }))
      );
    };

    fetchMessages();
  }, [roomId]);

  // ================= SOCKET RECEIVE =================
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (msg.roomId !== roomId) return;

      setMessages((prev) => [
        ...prev,
        {
          text: msg.message,
          sender: msg.UserId === currentUserId ? "me" : "other",
          time: new Date(msg.createdAt).toLocaleTimeString(),
          type: msg.type || "text",
        },
      ]);
    };

    socket.on("receive_message", handleNewMessage);

    return () => socket.off("receive_message", handleNewMessage);
  }, [roomId]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= SEND =================
  const handleSend = async () => {
    if (!input.trim() || !roomId) return;

    await fetch("http://localhost:5000/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        message: input,
        roomId,
        type: "text",
        isGroup,
      }),
    });

    setInput("");
  };

  // ================= AI FETCH =================
  const fetchSuggestions = async (text) => {
    try {
      const res = await fetch("http://localhost:5000/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          lastMessage: messages[messages.length - 1]?.text || "",
        }),
      });

      const data = await res.json();

      setSuggestions(data.predictions || []);
      setReplies(data.replies || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= DEBOUNCE =================
  useEffect(() => {
    const delay = setTimeout(() => {
      if (input.trim()) fetchSuggestions(input);
    }, 500);

    return () => clearTimeout(delay);
  }, [input]);

  // ================= UI =================
  return (
    <div className="chat-container">
      <h2>{isGroup ? "Group Chat" : "Personal Chat"}</h2>

      {/* JOIN GROUP */}
      <input
        placeholder="Group name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <button onClick={handleJoinGroup}>Join Group</button>

      {/* JOIN USER */}
      <input
        placeholder="User email"
        value={targetEmail}
        onChange={(e) => setTargetEmail(e.target.value)}
      />
      <button onClick={handleJoinRoom}>Start Chat</button>

      {/* FILE */}
      <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />

      {/* MESSAGES */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.sender}>
            {msg.type === "file" ? (
              <a href={msg.text}>📎 File</a>
            ) : (
              msg.text
            )}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* REPLIES */}
      <div>
        {replies.map((r, i) => (
          <button key={i} onClick={() => setInput(r)}>
            {r}
          </button>
        ))}
      </div>

      {/* SUGGESTIONS */}
      <div>
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => setInput(s)}>
            {s}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

export default ChatWindow;