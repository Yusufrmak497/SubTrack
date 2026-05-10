import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

import SubscriptionList from './components/SubscriptionList'
import LoginPage from './components/LoginPage'

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
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const isDark = theme === 'dark'

  function handleLogin(newToken) {
    setToken(newToken)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
  }

  if (!token) {
    return (
      <>
        <Toaster position="top-center" />
        <LoginPage onLogin={handleLogin} />
      </>
    )
  }

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
        <p>Control subscriptions, spending, and renewal dates</p>
        <button className="logout-btn" onClick={handleLogout}>Çıkış Yap</button>
      </header>

      <main className="content">
        <SubscriptionList token={token} onUnauthorized={handleLogout} />
      </main>

      <footer className="footer">&copy; 2026 TinyVault</footer>
      <Toaster position="top-center" />
    </div>
  )
}

export default App
