import React, { useEffect, useRef, useState } from "react";
import "./chat.css";
import { io } from "socket.io-client";

// ✅ Socket outside component (correct)
const socket = io("http://localhost:5000");

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // ✅ Fetch messages (Task 5)
  useEffect(() => {
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
          sender: msg.UserId === 1 ? "me" : "other",
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.log("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, []);

  // ✅ 🔥 SOCKET LISTENER (THIS WAS MISSING)
  useEffect(() => {
    socket.on("newMessage", (msg) => {
      const formattedMessage = {
        text: msg.message,
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sender: msg.UserId === 1 ? "me" : "other",
      };

      setMessages((prev) => [...prev, formattedMessage]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, []);

  // ✅ Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ❌ REMOVE duplicate add (important fix)
  const handleSend = async () => {
    if (input.trim() === "") return;

    try {
      await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      // ❌ DON'T manually add message
      // Socket will handle it

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