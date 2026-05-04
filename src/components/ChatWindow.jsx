import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import "./ChatWindow.css";

// ---- CONSTANTS ----
const MAX_FILE_SIZE_MB = 10;
const EMOJIS = ["😀","😂","😍","🥰","😎","🤔","😅","🙏","👍","❤️","🔥","✅","🎉","💯","🚀","😭","🤣","😊","👏","💪","🌟","😮","🤝","💬","📎","🎯","⚡","🛠️","📱","💻"];

// ---- AVATAR COLORS ----
const AVATAR_COLORS = ["#5b7cf6","#9b59f5","#ef4444","#f59e0b","#10b981","#06b6d4","#ec4899","#84cc16"];
const getAvatarColor = (str = "") => {
  let hash = 0;
  for (const c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const getInitials = (str = "") =>
  str.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

// ---- ICONS ----
const Icon = ({ name, size = 18 }) => {
  const icons = {
    send:    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"/></svg>,
    attach:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
    sun:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    logout:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    search:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    chat:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    group:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    close:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    back:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    plus:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    star:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    file:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    emoji:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
    searchMsg: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  };
  return icons[name] || null;
};

// ---- AVATAR ----
const Avatar = ({ name = "", size = 38, isGroup = false }) => {
  const bg = isGroup
    ? "linear-gradient(135deg, #5b7cf6, #9b59f5)"
    : `linear-gradient(135deg, ${getAvatarColor(name)}, ${getAvatarColor(name + "x")})`;
  return (
    <div className="cn-avatar" style={{ width: size, height: size, background: bg }}>
      {isGroup ? <Icon name="group" size={size * 0.45} /> : getInitials(name)}
    </div>
  );
};

// ---- TYPING INDICATOR ----
const TypingIndicator = () => (
  <div className="typing-indicator">
    <div className="typing-dots"><span /><span /><span /></div>
  </div>
);

// ---- IMAGE URL DETECTION ----
const isImageUrl = (url = "") =>
  /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) || url.includes("amazonaws.com");

// ---- BUBBLE CONTENT ----
const BubbleContent = ({ type, text }) => {
  if (type === "file") {
    if (isImageUrl(text)) {
      return (
        <a href={text} target="_blank" rel="noreferrer" className="cn-image-link">
          <img src={text} alt="Shared" className="cn-bubble-image"
            onError={(e) => { e.target.style.display = "none"; }} />
        </a>
      );
    }
    const fileName = decodeURIComponent(text.split("/").pop().split("?")[0]) || "Attachment";
    return (
      <a href={text} target="_blank" rel="noreferrer" className="cn-file-link">
        <span className="cn-file-link-icon"><Icon name="file" size={14} /></span>
        <span className="cn-file-link-name">{fileName}</span>
      </a>
    );
  }
  return <span className="cn-bubble-text">{text}</span>;
};

// ---- EMOJI PICKER ----
const EmojiPicker = ({ onSelect, onClose }) => (
  <div className="cn-emoji-picker">
    <div className="cn-emoji-picker-header">
      <span>Emoji</span>
      <button className="cn-emoji-close" onClick={onClose}><Icon name="close" size={14} /></button>
    </div>
    <div className="cn-emoji-grid">
      {EMOJIS.map((e) => (
        <button key={e} className="cn-emoji-btn" onClick={() => onSelect(e)}>{e}</button>
      ))}
    </div>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
const ChatWindow = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  // F3: Decode token once with useMemo, not on every render
  const { currentUserId, currentUserEmail, currentUserName } = useMemo(() => {
    try {
      const d = jwtDecode(localStorage.getItem("token"));
      return {
        currentUserId: d.id,
        currentUserEmail: d.email,
        currentUserName: d.name || d.email?.split("@")[0] || "Me",
      };
    } catch {
      return { currentUserId: null, currentUserEmail: null, currentUserName: "Me" };
    }
  }, []);

  // ---- STATE ----
  const [activeTab, setActiveTab] = useState("personal");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [groupName, setGroupName] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [isGroup, setIsGroup] = useState(false);
  const [currentRoomLabel, setCurrentRoomLabel] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [replies, setReplies] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileConvoOpen, setIsMobileConvoOpen] = useState(false);
  const [recentRooms, setRecentRooms] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cn_recent_rooms") || "[]"); } catch { return []; }
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  // F5: Unread counts per roomId
  const [unreadCounts, setUnreadCounts] = useState({});
  // F6: Message search
  const [msgSearch, setMsgSearch] = useState("");
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  // F7: Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // F8: IME composition tracking
  const isComposingRef = useRef(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // ---- CLOSE EMOJI PICKER ON OUTSIDE CLICK ----
  useEffect(() => {
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ---- SOCKET ----
  useEffect(() => {
    socket.auth = { token: localStorage.getItem("token") };
    socket.connect();
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    socket.on("user_typing", () => setIsTyping(true));
    socket.on("user_stop_typing", () => setIsTyping(false));
    return () => { socket.off("user_typing"); socket.off("user_stop_typing"); };
  }, []);

  // ---- RECEIVE MESSAGES ----
  useEffect(() => {
    const handler = (msg) => {
      const newMsg = {
        id: msg.id || `${Date.now()}-${Math.random()}`,
        text: msg.message,
        sender: msg.UserId === currentUserId ? "me" : "other",
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: msg.type || "text",
        senderName: msg.senderName || "",
      };
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, newMsg]);
      } else {
        // F5: Increment unread for other rooms
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.roomId]: (prev[msg.roomId] || 0) + 1,
        }));
      }
    };
    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [roomId, currentUserId]);

  // ---- FETCH OLD MESSAGES ----
  useEffect(() => {
    if (!roomId) return;
    setLoadingRoom(true);
    // F5: Clear unread when opening a room
    setUnreadCounts((prev) => ({ ...prev, [roomId]: 0 }));
    api.get(`/api/messages?roomId=${roomId}`)
      .then((res) => {
        const data = res.data;
        if (!Array.isArray(data)) return;
        // F4: Use stable message id as key instead of array index
        setMessages(data.map((m) => ({
          id: m.id || `${m.createdAt}-${m.UserId}`,
          text: m.message,
          sender: m.UserId === currentUserId ? "me" : "other",
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: m.type || "text",
          senderName: m.senderName || "",
        })));
      })
      .catch(() => toast("Could not load messages", "error"))
      .finally(() => setLoadingRoom(false));
  }, [roomId]);

  // ---- AUTO SCROLL ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---- SAVE RECENT ----
  const saveRoom = useCallback((room, label, group) => {
    const entry = { roomId: room, label, isGroup: group, ts: Date.now() };
    setRecentRooms((prev) => {
      const filtered = prev.filter((r) => r.roomId !== room);
      const next = [entry, ...filtered].slice(0, 20);
      localStorage.setItem("cn_recent_rooms", JSON.stringify(next));
      return next;
    });
  }, []);

  // ---- JOIN PERSONAL ----
  const handleJoinRoom = async () => {
    const email = targetEmail.trim();
    if (!email) return;
    if (email === currentUserEmail) { toast("You can't chat with yourself!", "error"); return; }
    try {
      const res = await api.get(`/api/auth/user?email=${encodeURIComponent(email)}`);
      const user = res.data;
      const room = [currentUserEmail, user.email].sort().join("_");
      setRoomId(room); setIsGroup(false); setMessages([]);
      setCurrentRoomLabel(user.name || user.email);
      setTargetEmail(""); setShowMsgSearch(false); setMsgSearch("");
      socket.emit("join_room", room);
      saveRoom(room, user.name || user.email, false);
      setIsMobileConvoOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      toast(err.response?.status === 404 ? "User not found" : "Could not connect", "error");
    }
  };

  // ---- JOIN GROUP ----
  const handleJoinGroup = () => {
    const name = groupName.trim();
    if (!name) return;
    const room = `group_${name.toLowerCase().replace(/\s+/g, "_")}`;
    setRoomId(room); setIsGroup(true); setMessages([]);
    setCurrentRoomLabel(name); setGroupName("");
    setShowMsgSearch(false); setMsgSearch("");
    socket.emit("join_room", room);
    saveRoom(room, name, true);
    setIsMobileConvoOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ---- REJOIN ----
  const handleRejoin = (entry) => {
    if (roomId === entry.roomId) { setIsMobileConvoOpen(true); return; }
    setRoomId(entry.roomId); setIsGroup(entry.isGroup);
    setMessages([]); setCurrentRoomLabel(entry.label);
    setShowMsgSearch(false); setMsgSearch("");
    socket.emit("join_room", entry.roomId);
    setActiveTab(entry.isGroup ? "group" : "personal");
    setIsMobileConvoOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ---- SEND ----
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !roomId) return;
    setInput(""); setSuggestions([]); setReplies([]); setShowSuggestions(false); setShowEmojiPicker(false);
    try {
      await api.post("/api/messages/send", { message: text, roomId, type: "text", isGroup });
    } catch {
      toast("Failed to send message", "error");
    }
  };

  // ---- TYPING (F8: guard against IME composition) ----
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!roomId || isComposingRef.current) return;
    socket.emit("typing", roomId);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => socket.emit("stop_typing", roomId), 1500);
  };

  // F8: IME-safe Enter key — don't submit while composing
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      handleSend();
    }
  };

  // F8: IME-safe Enter for sidebar inputs
  const handleSidebarKeyDown = (e, action) => {
    if (e.key === "Enter" && !isComposingRef.current) action();
  };

  // ---- EMOJI INSERT ----
  const handleEmojiSelect = (emoji) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // ---- FILE UPLOAD (F9: frontend size validation) ----
  const handleFileUpload = async (file) => {
    if (!file || !roomId) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB`, "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/api/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const { fileUrl } = res.data;
      if (!fileUrl) throw new Error("No URL");
      await api.post("/api/messages/send", { message: fileUrl, roomId, type: "file", isGroup });
      toast("File sent!", "success");
    } catch {
      toast("File upload failed", "error");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---- AI SUGGESTIONS ----
  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    const delay = setTimeout(async () => {
      try {
        const res = await api.post("/api/ai/suggestions", {
          text: input, lastMessage: messages.at(-1)?.text || "",
        });
        const { predictions = [], replies = [] } = res.data;
        if (predictions.length || replies.length) {
          setSuggestions(predictions); setReplies(replies); setShowSuggestions(true);
        }
      } catch {}
    }, 600);
    return () => clearTimeout(delay);
  }, [input]);

  // ---- LOGOUT ----
  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  // ---- FILTERED MESSAGES (F6: search) ----
  const displayMessages = useMemo(() => {
    if (!msgSearch.trim()) return messages;
    const q = msgSearch.toLowerCase();
    return messages.filter((m) => m.type === "text" && m.text.toLowerCase().includes(q));
  }, [messages, msgSearch]);

  const filteredPersonal = recentRooms.filter((r) => !r.isGroup);
  const filteredGroups = recentRooms.filter((r) => r.isGroup);

  const shouldShowSenderName = (i) => {
    const m = displayMessages[i];
    if (!isGroup || m.sender === "me") return false;
    const prev = displayMessages[i - 1];
    return !prev || prev.sender === "me" || prev.senderName !== m.senderName;
  };
  const shouldShowAvatar = (i) => {
    const m = displayMessages[i];
    if (m.sender === "me") return false;
    const next = displayMessages[i + 1];
    return !next || next.sender === "me" || next.senderName !== m.senderName;
  };

  return (
    <div className="cn-root">
      {/* ===== SIDEBAR ===== */}
      <aside className={`cn-sidebar ${isMobileConvoOpen ? "cn-sidebar--hidden" : ""}`}>
        <div className="cn-sidebar-header">
          <div className="cn-sidebar-brand">
            <div className="cn-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="cn-brand-name">ChatNexus</span>
          </div>
          <div className="cn-sidebar-actions">
            <button className="cn-icon-btn" onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"}>
              <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
            </button>
            <button className="cn-icon-btn cn-icon-btn--danger" onClick={handleLogout} title="Logout">
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>

        <div className="cn-user-info">
          <Avatar name={currentUserName} size={36} />
          <div className="cn-user-details">
            <span className="cn-user-name">{currentUserName}</span>
            <span className="cn-user-email">{currentUserEmail}</span>
          </div>
          <div className="cn-online-badge" title="Online" />
        </div>

        <div className="cn-tabs">
          <button className={`cn-tab ${activeTab === "personal" ? "cn-tab--active" : ""}`} onClick={() => setActiveTab("personal")}>
            <Icon name="chat" size={15} /> Personal
          </button>
          <button className={`cn-tab ${activeTab === "group" ? "cn-tab--active" : ""}`} onClick={() => setActiveTab("group")}>
            <Icon name="group" size={15} /> Groups
          </button>
        </div>

        {/* PERSONAL TAB */}
        {activeTab === "personal" && (
          <div className="cn-tab-panel">
            <div className="cn-new-chat-form">
              <div className="cn-form-label">New conversation</div>
              <div className="cn-input-row">
                <div className="cn-search-input-wrap">
                  <Icon name="search" size={15} />
                  <input className="cn-form-input" placeholder="Enter user email..."
                    value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)}
                    onCompositionStart={() => { isComposingRef.current = true; }}
                    onCompositionEnd={() => { isComposingRef.current = false; }}
                    onKeyDown={(e) => handleSidebarKeyDown(e, handleJoinRoom)} />
                </div>
                <button className="cn-start-btn" onClick={handleJoinRoom} title="Start chat">
                  <Icon name="plus" size={15} />
                </button>
              </div>
            </div>
            {filteredPersonal.length > 0 ? (
              <div className="cn-recents">
                <div className="cn-recents-label">Recent chats</div>
                {filteredPersonal.map((r) => (
                  <div key={r.roomId}
                    className={`cn-room-item ${roomId === r.roomId ? "cn-room-item--active" : ""}`}
                    onClick={() => handleRejoin(r)}>
                    <Avatar name={r.label} size={42} />
                    <div className="cn-room-info">
                      <span className="cn-room-name">{r.label}</span>
                      <span className="cn-room-preview">Personal chat</span>
                    </div>
                    {/* F5: Unread badge */}
                    {unreadCounts[r.roomId] > 0 && roomId !== r.roomId && (
                      <div className="cn-unread-badge">{unreadCounts[r.roomId] > 99 ? "99+" : unreadCounts[r.roomId]}</div>
                    )}
                    {roomId === r.roomId && <div className="cn-active-dot" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="cn-empty-hint"><Icon name="chat" size={36} /><p>No chats yet.<br />Enter an email above to start!</p></div>
            )}
          </div>
        )}

        {/* GROUP TAB */}
        {activeTab === "group" && (
          <div className="cn-tab-panel">
            <div className="cn-new-chat-form">
              <div className="cn-form-label">Join or create a group</div>
              <div className="cn-input-row">
                <div className="cn-search-input-wrap">
                  <Icon name="group" size={15} />
                  <input className="cn-form-input" placeholder="Group name..."
                    value={groupName} onChange={(e) => setGroupName(e.target.value)}
                    onCompositionStart={() => { isComposingRef.current = true; }}
                    onCompositionEnd={() => { isComposingRef.current = false; }}
                    onKeyDown={(e) => handleSidebarKeyDown(e, handleJoinGroup)} />
                </div>
                <button className="cn-start-btn" onClick={handleJoinGroup} title="Join/create">
                  <Icon name="plus" size={15} />
                </button>
              </div>
              <p className="cn-form-hint">Anyone with the same name joins the same room.</p>
            </div>
            {filteredGroups.length > 0 ? (
              <div className="cn-recents">
                <div className="cn-recents-label">Recent groups</div>
                {filteredGroups.map((r) => (
                  <div key={r.roomId}
                    className={`cn-room-item ${roomId === r.roomId ? "cn-room-item--active" : ""}`}
                    onClick={() => handleRejoin(r)}>
                    <Avatar name={r.label} size={42} isGroup />
                    <div className="cn-room-info">
                      <span className="cn-room-name">{r.label}</span>
                      <span className="cn-room-preview">Group chat</span>
                    </div>
                    {unreadCounts[r.roomId] > 0 && roomId !== r.roomId && (
                      <div className="cn-unread-badge">{unreadCounts[r.roomId] > 99 ? "99+" : unreadCounts[r.roomId]}</div>
                    )}
                    {roomId === r.roomId && <div className="cn-active-dot" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="cn-empty-hint"><Icon name="group" size={36} /><p>No groups yet.<br />Type a name above to create one!</p></div>
            )}
          </div>
        )}
      </aside>

      {/* ===== MAIN ===== */}
      <main className={`cn-main ${isMobileConvoOpen ? "cn-main--open" : ""}`}>
        {!roomId ? (
          <div className="cn-welcome">
            <div className="cn-welcome-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                  stroke="url(#wg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="wg" x1="3" y1="3" x2="21" y2="21">
                  <stop stopColor="#5b7cf6"/><stop offset="1" stopColor="#9b59f5"/>
                </linearGradient></defs>
              </svg>
            </div>
            <h2>Welcome to ChatNexus</h2>
            <p>{activeTab === "personal" ? "Enter a friend's email to start a private chat." : "Type a group name to join or create a group chat."}</p>
            <div className="cn-welcome-pills">
              <span>⚡ Real-time</span><span>🔒 Secure JWT</span><span>🤖 AI suggestions</span><span>📎 File sharing</span><span>😀 Emoji picker</span>
            </div>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="cn-chat-header">
              <button className="cn-mobile-back-btn" onClick={() => setIsMobileConvoOpen(false)}>
                <Icon name="back" size={18} />
              </button>
              <Avatar name={currentRoomLabel} size={40} isGroup={isGroup} />
              <div className="cn-header-info">
                <span className="cn-header-name">{currentRoomLabel}</span>
                <span className="cn-header-sub">
                  {isTyping ? <span className="cn-typing-text">typing...</span> : isGroup ? "Group chat" : "Online"}
                </span>
              </div>
              <div className="cn-header-actions">
                {/* F6: Message search toggle */}
                <button className={`cn-icon-btn ${showMsgSearch ? "cn-icon-btn--active" : ""}`}
                  onClick={() => { setShowMsgSearch((v) => !v); setMsgSearch(""); }}
                  title="Search messages">
                  <Icon name="searchMsg" size={17} />
                </button>
                {/* File attach */}
                <label className={`cn-icon-btn ${uploadingFile ? "cn-icon-btn--uploading" : ""}`} title="Attach file">
                  {uploadingFile ? <span className="cn-spinner" /> : <Icon name="attach" size={17} />}
                  <input ref={fileInputRef} type="file"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    disabled={uploadingFile} />
                </label>
              </div>
            </div>

            {/* F6: Message search bar */}
            {showMsgSearch && (
              <div className="cn-msg-search-bar">
                <Icon name="search" size={15} />
                <input className="cn-msg-search-input" placeholder="Search messages..."
                  value={msgSearch} onChange={(e) => setMsgSearch(e.target.value)}
                  autoFocus />
                {msgSearch && (
                  <span className="cn-msg-search-count">
                    {displayMessages.length} result{displayMessages.length !== 1 ? "s" : ""}
                  </span>
                )}
                <button className="cn-icon-btn" style={{ width: 28, height: 28 }}
                  onClick={() => { setShowMsgSearch(false); setMsgSearch(""); }}>
                  <Icon name="close" size={14} />
                </button>
              </div>
            )}

            {/* MESSAGES */}
            <div className="cn-messages">
              {loadingRoom && (
                <div className="cn-loading-messages">
                  <span className="cn-spinner cn-spinner--lg" />
                  <span>Loading messages...</span>
                </div>
              )}
              {!loadingRoom && displayMessages.length === 0 && (
                <div className="cn-no-messages">
                  <span>{msgSearch ? "No messages match your search" : "No messages yet — say hello! 👋"}</span>
                </div>
              )}
              {!loadingRoom && displayMessages.map((m, i) => {
                const isMe = m.sender === "me";
                return (
                  // F4: Use stable message id as key
                  <div key={m.id} className={`cn-msg-row ${isMe ? "cn-msg-row--me" : "cn-msg-row--other"}`}>
                    {!isMe && (
                      <div className="cn-msg-avatar-slot">
                        {shouldShowAvatar(i) && (
                          <Avatar name={m.senderName || currentRoomLabel} size={30} isGroup={isGroup} />
                        )}
                      </div>
                    )}
                    <div className="cn-msg-col">
                      {shouldShowSenderName(i) && m.senderName && (
                        <span className="cn-sender-name" style={{ color: getAvatarColor(m.senderName) }}>
                          {m.senderName}
                        </span>
                      )}
                      <div className={`cn-bubble ${isMe ? "cn-bubble--me" : "cn-bubble--other"}`}>
                        <BubbleContent type={m.type} text={m.text} />
                        <div className="cn-bubble-meta">
                          <span className="cn-bubble-time">{m.time}</span>
                          {isMe && <span className="cn-bubble-ticks"><Icon name="check" size={11} /></span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="cn-msg-row cn-msg-row--other">
                  <div className="cn-msg-avatar-slot">
                    <Avatar name={currentRoomLabel} size={30} isGroup={isGroup} />
                  </div>
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* QUICK REPLIES */}
            {replies.length > 0 && (
              <div className="cn-quick-replies">
                <span className="cn-quick-replies-label">Quick reply</span>
                {replies.map((r, i) => (
                  <button key={i} className="cn-quick-reply-btn" onClick={() => { setInput(r); setReplies([]); inputRef.current?.focus(); }}>{r}</button>
                ))}
              </div>
            )}

            {/* AI COMPLETIONS */}
            {showSuggestions && suggestions.length > 0 && input.trim() && (
              <div className="cn-suggestions">
                <span className="cn-suggestions-label"><Icon name="star" size={11} /> AI</span>
                {suggestions.map((s, i) => (
                  <button key={i} className="cn-suggestion-btn"
                    onClick={() => { setInput((p) => p.trimEnd() + " " + s); setShowSuggestions(false); inputRef.current?.focus(); }}>
                    {s}
                  </button>
                ))}
                <button className="cn-suggestions-close" onClick={() => setShowSuggestions(false)}>
                  <Icon name="close" size={13} />
                </button>
              </div>
            )}

            {/* F7: EMOJI PICKER */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="cn-emoji-picker-wrap">
                <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
              </div>
            )}

            {/* INPUT BAR */}
            <div className="cn-input-bar">
              {/* F7: Emoji button */}
              <button className={`cn-icon-btn cn-emoji-toggle ${showEmojiPicker ? "cn-icon-btn--active" : ""}`}
                onClick={() => setShowEmojiPicker((v) => !v)} title="Emoji">
                <Icon name="emoji" size={18} />
              </button>
              <div className="cn-input-wrap">
                <input ref={inputRef} className="cn-message-input" value={input}
                  onChange={handleInputChange} onKeyDown={handleKeyDown}
                  onCompositionStart={() => { isComposingRef.current = true; }}
                  onCompositionEnd={() => { isComposingRef.current = false; }}
                  placeholder="Type a message..." autoComplete="off" />
              </div>
              <button className={`cn-send-btn ${input.trim() ? "cn-send-btn--active" : ""}`}
                onClick={handleSend} disabled={!input.trim()} title="Send">
                <Icon name="send" size={16} />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ChatWindow;
