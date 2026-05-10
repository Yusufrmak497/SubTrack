import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

import AuthPanel from './components/AuthPanel'
import SubscriptionList from './components/SubscriptionList'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [token, setToken] = useState(() => window.localStorage.getItem('auth_token') || '')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (!token) {
      setUser(null)
      window.localStorage.removeItem('auth_token')
      return
    }

    let cancelled = false
    const fetchMe = async () => {
      setAuthLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          throw new Error('Session is not valid')
        }
        const data = await response.json()
        if (!cancelled) {
          setUser(data)
          window.localStorage.setItem('auth_token', token)
        }
      } catch {
        if (!cancelled) {
          setUser(null)
          setToken('')
          window.localStorage.removeItem('auth_token')
        }
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }

    fetchMe()
    return () => {
      cancelled = true
    }
  }, [token])

  const isDark = theme === 'dark'
  const isAuthenticated = Boolean(token && user)

  return (
    <div className="app">
      <header className="hero">
        <button
          className="theme-toggle"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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
        <h1>TinyVault</h1>
        <p>{isAuthenticated ? `Welcome, ${user.username}` : 'Control subscriptions, spending, and renewal dates'}</p>
        {isAuthenticated ? (
          <button className="auth-logout" onClick={() => setToken('')}>
            Logout
          </button>
        ) : null}
      </header>

      <main className="content">
        {authLoading ? (
          <section className="panel state-text">Validating session...</section>
        ) : isAuthenticated ? (
          <SubscriptionList token={token} onUnauthorized={() => setToken('')} />
        ) : (
          <AuthPanel onAuthenticated={setToken} />
        )}
      </main>
      <Toaster position="top-right" />

      <footer className="footer">&copy; 2026 TinyVault</footer>
    </div>
  )
}

export default App
