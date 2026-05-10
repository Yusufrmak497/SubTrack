import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/AdminDashboard'
import SubscriptionList from './components/SubscriptionList'
import Header from './components/Header'

function getInitialTheme() {
  const stored = window.localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function AppDashboard({ token, role, username, onLogout, theme, onToggleTheme }) {
  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        username={username}
        role={role}
      />
      <main className="content">
        <SubscriptionList token={token} role={role} onUnauthorized={onLogout} />
      </main>
      <footer className="footer">&copy; 2026 SubTrack</footer>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [role, setRole] = useState(() => localStorage.getItem('role') || 'user')
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  function handleLogin(newToken, newRole) {
    setToken(newToken)
    setRole(newRole || localStorage.getItem('role') || 'user')
    setUsername(localStorage.getItem('username') || '')
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    setToken(null)
    setRole('user')
    setUsername('')
  }

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to={role === 'admin' ? '/admin' : '/app'} replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            token ? <Navigate to="/app" replace /> : <RegisterPage onLogin={handleLogin} />
          }
        />

        {/* Protected — any authenticated user */}
        <Route
          path="/app"
          element={
            token ? (
              <AppDashboard
                token={token}
                role={role}
                username={username}
                onLogout={handleLogout}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected — admin only */}
        <Route
          path="/admin"
          element={
            token && role === 'admin' ? (
              <div className="app">
                <Header
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  onLogout={handleLogout}
                  username={username}
                  role={role}
                />
                <AdminDashboard token={token} onUnauthorized={handleLogout} />
                <footer className="footer">&copy; 2026 SubTrack</footer>
              </div>
            ) : token ? (
              <Navigate to="/app" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
