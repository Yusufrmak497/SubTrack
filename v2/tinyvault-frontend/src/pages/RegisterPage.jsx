import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './AuthPage.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function RegisterPage({ onLogin }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Kayıt başarısız')
        return
      }

      // Auto-login after register
      const loginRes = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(form.username)}&password=${encodeURIComponent(form.password)}`,
      })
      const loginData = await loginRes.json()

      if (loginRes.ok) {
        localStorage.setItem('token', loginData.access_token)
        localStorage.setItem('role', loginData.role)
        localStorage.setItem('username', loginData.username)
        onLogin(loginData.access_token, loginData.role)
        navigate('/app')
      } else {
        navigate('/login')
      }
    } catch {
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo" onClick={() => window.location.reload()}>SubTrack</Link>
        <h2 className="auth-title">Hesap Oluştur</h2>
        <p className="auth-subtitle">Ücretsiz başlayın, kredi kartı gerekmez.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Kullanıcı Adı</label>
            <input
              type="text"
              placeholder="kullanıcı adı (min 3 karakter)"
              value={form.username}
              onChange={update('username')}
              required
              minLength={3}
              autoComplete="username"
            />
          </div>
          <div className="auth-field">
            <label>E-posta</label>
            <input
              type="email"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={update('email')}
              required
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label>Şifre</label>
            <input
              type="password"
              placeholder="min 6 karakter"
              value={form.password}
              onChange={update('password')}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="auth-switch">
          Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link>
        </p>

        <div className="auth-divider"><span>veya sosyal hesabınla başla</span></div>

        <div className="social-buttons">
          <a href={`${API}/auth/google/login`} className="social-btn social-google">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google ile Devam Et
          </a>
          <a href={`${API}/auth/github/login`} className="social-btn social-github">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
            GitHub ile Devam Et
          </a>
          <a href={`${API}/auth/gitlab/login`} className="social-btn social-gitlab">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#FC6D26"><path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 00-.867 0L1.386 9.45.044 13.587a.924.924 0 00.331 1.023L12 23.054l11.625-8.443a.924.924 0 00.33-1.024"/></svg>
            GitLab ile Devam Et
          </a>
        </div>
      </div>
    </div>
  )
}
