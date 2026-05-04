import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import "../styles/auth.css";

export default function NotFound() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "20px",
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      textAlign: "center",
      padding: "40px 24px",
      transition: "background 0.25s ease",
    }}>
      <button className="theme-toggle-btn" onClick={toggleTheme} style={{ position: "fixed", top: 20, right: 20 }}>
        {theme === "dark" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      <div style={{
        fontSize: "80px",
        fontWeight: "800",
        background: "linear-gradient(135deg, #5b7cf6, #9b59f5)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        lineHeight: 1,
      }}>404</div>

      <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)" }}>
        Page not found
      </h1>
      <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "320px", lineHeight: 1.6 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/" style={{
          padding: "11px 24px",
          background: "linear-gradient(135deg, #5b7cf6, #9b59f5)",
          color: "white",
          borderRadius: "12px",
          fontWeight: "600",
          fontSize: "14px",
          textDecoration: "none",
        }}>
          Go home
        </Link>
        <Link to="/chat" style={{
          padding: "11px 24px",
          border: "1.5px solid var(--border-primary)",
          color: "var(--text-primary)",
          borderRadius: "12px",
          fontWeight: "600",
          fontSize: "14px",
          textDecoration: "none",
          background: "var(--bg-secondary)",
        }}>
          Open chat
        </Link>
      </div>
    </div>
  );
}
