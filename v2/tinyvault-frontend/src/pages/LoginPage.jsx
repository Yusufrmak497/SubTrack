import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './AuthPage.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('login')
  const [twoFaCode, setTwoFaCode] = useState('')
  const [tempToken, setTempToken] = useState('')
  const navigate = useNavigate()

  function handleLoginSuccess(data) {
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', data.role)
    localStorage.setItem('username', data.username)
    onLogin(data.access_token, data.role)

    if (data.role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/app')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (step === 'login') {
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

        if (data.requires_2fa) {
          setTempToken(data.temp_token)
          setStep('2fa')
          return
        }

        handleLoginSuccess(data)
      } else {
        const res = await fetch(`${API}/auth/2fa/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: twoFaCode, temp_token: tempToken })
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.detail || 'Hatalı kod')
          return
        }
        handleLoginSuccess(data)
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
          {step === 'login' ? (
            <>
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
            </>
          ) : (
            <div className="auth-field">
              <label>2 Adımlı Doğrulama Kodu</label>
              <input
                type="text"
                placeholder="123456"
                value={twoFaCode}
                onChange={e => setTwoFaCode(e.target.value)}
                required
                maxLength={6}
                autoComplete="one-time-code"
              />
              <p style={{fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem'}}>
                Google Authenticator uygulamasındaki 6 haneli kodu giriniz.
              </p>
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'İşleniyor...' : (step === 'login' ? 'Giriş Yap' : 'Doğrula')}
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
