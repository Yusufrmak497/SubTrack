import React from 'react';
import './../index.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-logo" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
        {/* Placeholder SVG Icon for a Vault/Shield */}
        <svg 
          width="28" 
          height="28" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="url(#primaryGradient)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <defs>
            <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M12 8v4"></path>
          <path d="M12 16h.01"></path>
        </svg>
        <h1>TinyVault</h1>
      </div>

      <nav className="header-nav">
        {/* Future Nav Links Placeholder */}
        <a href="/" className="nav-item active">Dashboard</a>
        {/* <a href="#" className="nav-item">Analytics</a> */}
        {/* <a href="#" className="nav-item">Settings</a> */}
      </nav>

      <div className="header-actions">
        {/* Future Theme Toggle or Avatar Placeholder */}
        <button className="icon-btn" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
        <div className="user-avatar">
          <span>TV</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
