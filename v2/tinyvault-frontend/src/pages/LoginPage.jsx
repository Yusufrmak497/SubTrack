import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './AuthPage.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Giriş başarısız')
        return
      }

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('username', data.username)
      onLogin(data.access_token, data.role)

      if (data.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/app')
      }
    } catch {
      setError('Sunucuya bağlanılamadı. API çalışıyor mu?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo" onClick={() => window.location.reload()}>SubTrack</Link>
        <h2 className="auth-title">Hesabına Giriş Yap</h2>
        <p className="auth-subtitle">Demo: admin_rojhat / admin123</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Kullanıcı Adı</label>
            <input
              type="text"
              placeholder="kullanıcı adı"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="auth-field">
            <label>Şifre</label>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="auth-switch">
          Hesabın yok mu? <Link to="/register">Kayıt Ol</Link>
        </p>

        <div className="auth-demo-accounts">
          <p className="demo-label">Demo Hesaplar</p>
          <div className="demo-rows">
            <div className="demo-row" onClick={() => { setUsername('admin_rojhat'); setPassword('admin123') }}>
              <span className="role-badge role-admin">Admin</span>
              <span>admin_rojhat / admin123</span>
            </div>
            <div className="demo-row" onClick={() => { setUsername('demo_user'); setPassword('user123') }}>
              <span className="role-badge role-user">User</span>
              <span>demo_user / user123</span>
            </div>
            <div className="demo-row" onClick={() => { setUsername('demo_viewer'); setPassword('viewer123') }}>
              <span className="role-badge role-viewer">Viewer</span>
              <span>demo_viewer / viewer123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
