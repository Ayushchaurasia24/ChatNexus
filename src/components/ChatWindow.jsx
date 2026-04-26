import React, { useEffect, useRef, useState } from "react";
import "./chat.css";

const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { text: "Hello 👋", time: "10:30 AM", sender: "other" },
    { text: "Hi bro!", time: "10:31 AM", sender: "me" },
  ]);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = () => {
    if (input.trim() === "") return;

    const newMessage = {
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: "me",
    };

    setMessages([...messages, newMessage]);
    setInput("");
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