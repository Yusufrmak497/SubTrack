import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resetError = () => setError('')

  const handleRegister = async () => {
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })

    if (!registerResponse.ok) {
      const data = await registerResponse.json().catch(() => ({}))
      throw new Error(data?.detail || data?.error || 'Registration failed')
    }
  }

  const handleLogin = async () => {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email: mode === 'register' ? username : username, password }),
    })

    if (!loginResponse.ok) {
      const data = await loginResponse.json().catch(() => ({}))
      throw new Error(data?.detail || data?.error || 'Login failed')
    }

    const tokenPayload = await loginResponse.json()
    const token = tokenPayload.access_token
    if (!token) throw new Error('Token was not returned')

    onAuthenticated(token)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    resetError()
    setLoading(true)

    try {
      if (mode === 'register') {
        await handleRegister()
      }
      await handleLogin()
    } catch (submitError) {
      setError(submitError.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel auth-panel">
      <h3>{mode === 'login' ? 'Login' : 'Register'}</h3>
      <p className="auth-help">
        {mode === 'login'
          ? 'Use your username/email and password to access your own subscriptions.'
          : 'Create an account, then continue with your private subscription vault.'}
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder={mode === 'login' ? 'Username or email' : 'Username'}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        {mode === 'register' ? (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        ) : null}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />

        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register & Login'}
        </button>
      </form>

      <button
        type="button"
        className="auth-switch"
        onClick={() => {
          setMode((current) => (current === 'login' ? 'register' : 'login'))
          setError('')
        }}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </section>
  )
}

export default AuthPanel
