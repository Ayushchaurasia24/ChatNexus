import React, { useEffect, useRef, useState } from "react";
import "./chat.css";

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // ✅ Fetch messages from backend (Task 5)
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
          sender: msg.UserId === 1 ? "me" : "other", // temp logic
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.log("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, []);

  // ✅ Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send message
  const handleSend = async () => {
    if (input.trim() === "") return;

    try {
      const response = await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      const newMessage = {
        text: data.message,
        time: new Date(data.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sender: "me",
      };

      setMessages((prev) => [...prev, newMessage]);
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