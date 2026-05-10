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
      </div>
    </div>
  )
}
