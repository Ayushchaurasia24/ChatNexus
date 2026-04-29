import React, { useEffect, useRef, useState } from "react";
import "./chat.css";
import { jwtDecode } from "jwt-decode";
import socket from "../socket";

const ChatWindow = () => {
  // ================= STATE =================
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [groupName, setGroupName] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [isGroup, setIsGroup] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [replies, setReplies] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // ================= AUTH =================
  const token = localStorage.getItem("token");
  let currentUserId = null;
  let currentUserEmail = null;

  try {
    const decoded = jwtDecode(token);
    currentUserId = decoded.id;
    currentUserEmail = decoded.email;
  } catch {}

  // ================= SOCKET =================
  useEffect(() => {
    socket.auth = { token };
    socket.connect();
    return () => socket.disconnect();
  }, []);

  // ================= ROOM JOIN =================
  const generateRoomId = (a, b) => {
    return [a, b].sort().join("_");
  };

  const handleJoinRoom = async () => {
    if (!targetEmail.trim()) return;

    const res = await fetch(
      `http://localhost:5000/api/auth/user?email=${targetEmail}`
    );

    if (!res.ok) return alert("User not found");

    const user = await res.json();

    const room = generateRoomId(currentUserEmail, user.email);

    setRoomId(room);
    setIsGroup(false);
    setMessages([]);

    socket.emit("join_room", room);
  };

  const handleJoinGroup = () => {
    if (!groupName.trim()) return;

    const room = `group_${groupName.toLowerCase()}`;

    setRoomId(room);
    setIsGroup(true);
    setMessages([]);

    socket.emit("join_room", room);
  };

  useEffect(() => {
    socket.on("user_typing", () => {
      setIsTyping(true);
    });

    socket.on("user_stop_typing", () => {
      setIsTyping(false);
    });

    return () => {
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, []);

  // ================= FETCH OLD =================
  useEffect(() => {
    if (!roomId) return;

    fetch(`http://localhost:5000/api/messages?roomId=${roomId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(
          data.map((m) => ({
            text: m.message,
            sender: m.UserId === currentUserId ? "me" : "other",
            time: new Date(m.createdAt).toLocaleTimeString(),
            type: m.type || "text",
          }))
        );
      });
  }, [roomId]);

  // ================= RECEIVE =================
  useEffect(() => {
    const handler = (msg) => {
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

    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [roomId]);

  // ================= SCROLL =================
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
  const handleJoinKey = (e, type) => {
    if (e.key === "Enter") {
      if (type === "user") handleJoinRoom();
      if (type === "group") handleJoinGroup();
    }
  };


  // ================= ENTER =================
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // ================= FILE =================
  const handleFileUpload = async (file) => {
    if (!file || !roomId) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      headers: { Authorization: token },
      body: formData,
    });

    const data = await res.json();

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

  // ================= AI =================
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await fetch("http://localhost:5000/api/ai/suggestions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: input,
            lastMessage: messages.at(-1)?.text || "",
          }),
        });

        const data = await res.json();

        setSuggestions(data.predictions || []);
        setReplies(data.replies || []);
      } catch (err) {
        console.log(err);
      }
    }, 500); // debounce

    return () => clearTimeout(delay);
  }, [input]);

  // ================= UI =================
  return (
    <div className="chat-container">

      {/* TOP BAR */}
      <div className="top-bar">
        <input
          placeholder="User email"
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
          onKeyDown={(e) => handleJoinKey(e, "user")}
        />
        <button onClick={handleJoinRoom}>Chat</button>

        <input
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          onKeyDown={(e) => handleJoinKey(e, "group")}
        />
        <button onClick={handleJoinGroup}>Group</button>

        <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />
      </div>

      {/* HEADER */}
      <div className="chat-header">{roomId || "Start Chat"}</div>

      {/* MESSAGES */}
      {isTyping && <div className="typing">Someone is typing...</div>}
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.sender}`}>
            {m.type === "file" ? (
              <a href={m.text} target="_blank">📎 File</a>
            ) : (
              m.text
            )}
            <span>{m.time}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* REPLIES */}
      <div className="replies">
        {replies.map((r, i) => (
          <button key={i} onClick={() => setInput(r)}>
            {r}
          </button>
        ))}
      </div>

      {/*suggestions*/}
      {suggestions.length > 0 && input && (
        <div className="suggestions">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() =>
                setInput((prev) => (prev ? prev + "" + s : s))
              }>{s}</button>
          ))}
        </div>
      )}
      
      {/* INPUT */}
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);

            socket.emit("typing", roomId);

            setTimeout(() => {
              socket.emit("stop_typing", roomId);
            }, 1000);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>

    </div>

  );
};

export default ChatWindow;