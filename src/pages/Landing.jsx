import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import "../styles/auth.css";
import "./Landing.css";

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>ChatNexus</span>
        </div>
        <div className="landing-nav-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <Link to="/login" className="nav-login-btn">Log in</Link>
          <Link to="/signup" className="nav-signup-btn">Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="hero-badge">
          <span className="badge-dot" />
          Real-time • Encrypted • AI-Powered
        </div>

        <h1 className="hero-title">
          Messaging that
          <br />
          <span className="hero-gradient">feels instant</span>
        </h1>

        <p className="hero-subtitle">
          Personal chats, group conversations, file sharing and AI-powered suggestions —<br />
          all in one beautifully designed app.
        </p>

        <div className="hero-cta">
          <Link to="/signup" className="cta-primary">
            Start messaging free
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
          <Link to="/login" className="cta-secondary">Sign in</Link>
        </div>

        {/* MOCK PHONE UI */}
        <div className="hero-mockup">
          <div className="mockup-phone">
            <div className="mockup-notch" />
            <div className="mockup-screen">
              {/* Personal chat preview */}
              <div className="mockup-header">
                <div className="mockup-avatar mockup-avatar-blue">A</div>
                <div>
                  <div className="mockup-name">Aryan K.</div>
                  <div className="mockup-status">online</div>
                </div>
              </div>
              <div className="mockup-messages">
                <div className="mockup-msg mockup-msg-in">
                  Hey, are you coming to the meeting?
                  <span>10:42</span>
                </div>
                <div className="mockup-msg mockup-msg-out">
                  Yes, on my way! Give me 5 mins
                  <span>10:43 ✓✓</span>
                </div>
                <div className="mockup-msg mockup-msg-in">
                  Perfect, we'll wait 👍
                  <span>10:43</span>
                </div>
                <div className="mockup-typing">
                  <span /><span /><span />
                </div>
              </div>
              <div className="mockup-input">
                <div className="mockup-input-field">Type a message...</div>
                <div className="mockup-send-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Group chat floating card */}
          <div className="mockup-group-card">
            <div className="group-card-header">
              <div className="group-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <span>Dev Team</span>
              <span className="group-count">12 members</span>
            </div>
            <div className="group-last-msg">
              <strong>Rahul:</strong> PR merged successfully 🚀
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2 className="features-title">Everything you need to stay connected</h2>
        <div className="features-grid">
          {[
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              ),
              title: "Real-time Messaging",
              desc: "Instant delivery with Socket.IO — messages appear as you type."
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
              title: "Group Chats",
              desc: "Create named rooms and invite everyone to collaborate together."
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              ),
              title: "File Sharing",
              desc: "Share images, docs and files seamlessly via AWS S3."
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ),
              title: "AI Suggestions",
              desc: "Smart reply predictions that learn from conversation context."
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ),
              title: "Secure Auth",
              desc: "JWT tokens + bcrypt hashing ensure your account stays safe."
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
              ),
              title: "Dark & Light Mode",
              desc: "Switch themes instantly. Your preference is remembered forever."
            },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <div className="brand-icon brand-icon-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          ChatNexus
        </div>
        <p className="footer-text">Built with ❤️ by <a href="https://www.linkedin.com/in/ayush-chaurasia-791981233" target="_blank" rel="noreferrer" style={{color: "inherit", textDecoration: "underline"}}>Ayush Chaurasia</a> using React + Node.js + Socket.IO</p>
      </footer>
    </div>
  );
}
