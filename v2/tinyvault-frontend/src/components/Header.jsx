import { useNavigate, Link } from 'react-router-dom'
import './Header.css'

const ROLE_BG    = { admin: '#fef3c7', user: '#dbeafe', viewer: '#f3f4f6' }
const ROLE_COLOR = { admin: '#92400e', user: '#1e40af', viewer: '#374151' }

export default function Header({ theme, onToggleTheme, onLogout, username, role }) {
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  return (
    <header className="app-header-bar">
      {/* Left: logo + role badge */}
      <div className="app-header-left">
        <Link to="/" className="app-header-logo" onClick={() => window.location.reload()}>SubTrack</Link>
        {role && (
          <span
            className="app-header-role-badge"
            style={{ background: ROLE_BG[role] || '#f3f4f6', color: ROLE_COLOR[role] || '#374151' }}
          >
            {role}
          </span>
        )}
      </div>

      {/* Center: nav */}
      <nav className="app-header-nav">
        <button className="app-header-nav-btn" onClick={() => navigate('/app')}>
          Dashboard
        </button>
        {role === 'admin' && (
          <button className="app-header-nav-btn app-header-nav-btn--accent" onClick={() => navigate('/admin')}>
            Admin Panel
          </button>
        )}
      </nav>

      {/* Right: user info + controls */}
      <div className="app-header-right">
        {username && (
          <span className="app-header-username">
            Merhaba, <strong>{username}</strong>
          </span>
        )}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-16v3m0 14v3m10-10h-3M5 12H2m17.07 7.07-2.12-2.12M7.05 7.05 4.93 4.93m14.14 0-2.12 2.12M7.05 16.95l-2.12 2.12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
            </svg>
          )}
        </button>
        <button className="logout-btn" onClick={onLogout}>Çıkış Yap</button>
      </div>
    </header>
  )
}
