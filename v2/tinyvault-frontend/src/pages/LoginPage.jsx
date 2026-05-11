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
  const [availableMethods, setAvailableMethods] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState('totp')
  const [rememberDevice, setRememberDevice] = useState(false)
  const navigate = useNavigate()

  function handleLoginSuccess(data) {
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', data.role)
    localStorage.setItem('username', data.username)
    if (data.device_token) localStorage.setItem('device_token', data.device_token)
    onLogin(data.access_token, data.role)
    navigate(data.role === 'admin' ? '/admin' : '/app')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (step === 'login') {
        const deviceToken = localStorage.getItem('device_token')
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
        if (deviceToken) headers['x-device-token'] = deviceToken
        const res = await fetch(`${API}/auth/login`, { method: 'POST', headers, body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}` })
        const data = await res.json()
        if (res.status === 429) { setError('Too many failed attempts. Please wait 1 minute and try again.'); return }
        if (!res.ok) { setError(data.error || data.detail || 'Login failed'); return }
        if (data.requires_2fa) {
          setTempToken(data.temp_token)
          setAvailableMethods(data.methods)
          if (data.methods.totp) setSelectedMethod('totp')
          else if (data.methods.security_question) setSelectedMethod('security_question')
          else if (data.methods.recovery_code) setSelectedMethod('recovery_code')
          setStep('2fa')
          return
        }
        handleLoginSuccess(data)
      } else {
        const res = await fetch(`${API}/auth/2fa/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: twoFaCode, method: selectedMethod, temp_token: tempToken, remember_device: rememberDevice }) })
        const data = await res.json()
        if (!res.ok) { setError(data.detail || 'Invalid code'); return }
        handleLoginSuccess(data)
      }
    } catch { setError('Could not connect to server. Is the API running?') }
    finally { setLoading(false) }
  }

  const methodBtn = (method, label) => availableMethods?.[method] && (
    <button type="button" onClick={() => {setSelectedMethod(method); setTwoFaCode(''); setError('')}} style={{flex:1, padding:'0.5rem', background: selectedMethod === method ? '#0f766e' : '#f8fafc', color: selectedMethod === method ? 'white' : '#334155', border: selectedMethod === method ? '1px solid #0f766e' : '1px solid #cbd5e1', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600'}}>{label}</button>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">SubTrack</Link>
        <h2 className="auth-title">Sign In to Your Account</h2>
        <p className="auth-subtitle">Sign in to manage your subscriptions.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {step === 'login' ? (
            <>
              <div className="auth-field">
                <label>Username</label>
                <input type="text" placeholder="username" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <input type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
            </>
          ) : (
            <div className="auth-field">
              {availableMethods && (
                <div style={{display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap'}}>
                  {methodBtn('totp', 'Authenticator (TOTP)')}
                  {methodBtn('security_question', 'Security Question')}
                  {methodBtn('recovery_code', 'Recovery Code')}
                </div>
              )}
              {selectedMethod === 'totp' && (<><label>Two-Factor Authentication Code</label><input type="text" placeholder="123456" value={twoFaCode} onChange={e => setTwoFaCode(e.target.value)} required maxLength={6} autoComplete="one-time-code" /><p style={{fontSize:'0.8rem', color:'#64748b', marginTop:'0.5rem'}}>Enter the 6-digit code from your Google Authenticator app.</p></>)}
              {selectedMethod === 'security_question' && (<><label style={{color:'#334155'}}>Security Question:</label><p style={{fontWeight:'bold', marginBottom:'0.5rem', color:'#0f766e'}}>{availableMethods?.question_text}</p><input type="text" placeholder="Your answer" value={twoFaCode} onChange={e => setTwoFaCode(e.target.value)} required /></>)}
              {selectedMethod === 'recovery_code' && (<><label>Recovery Code</label><input type="text" placeholder="e.g. a1b2c3d4" value={twoFaCode} onChange={e => setTwoFaCode(e.target.value)} required /><p style={{fontSize:'0.8rem', color:'#64748b', marginTop:'0.5rem'}}>Enter one of the one-time recovery codes you previously generated.</p></>)}
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.5rem'}}>
                <input type="checkbox" id="rememberDevice" checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)} style={{width:'auto', padding:0}} />
                <label htmlFor="rememberDevice" style={{fontSize:'0.85rem', color:'#334155', cursor:'pointer'}}>Remember this device for 30 days</label>
              </div>
            </div>
          )}
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Processing...' : (step === 'login' ? 'Sign In' : 'Verify')}</button>
        </form>
        <p className="auth-switch">Don't have an account? <Link to="/register">Sign Up</Link></p>
        <div className="auth-divider"><span>or</span></div>
        <div className="social-buttons">
          <a href={`${API}/auth/google/login`} className="social-btn social-google"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Sign in with Google</a>
          <a href={`${API}/auth/github/login`} className="social-btn social-github"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>Sign in with GitHub</a>
          <a href={`${API}/auth/gitlab/login`} className="social-btn social-gitlab"><svg viewBox="0 0 24 24" width="18" height="18" fill="#FC6D26"><path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 00-.867 0L1.386 9.45.044 13.587a.924.924 0 00.331 1.023L12 23.054l11.625-8.443a.924.924 0 00.33-1.024"/></svg>Sign in with GitLab</a>
          <a href={`${API}/auth/discord/login`} className="social-btn social-discord"><svg viewBox="0 0 24 24" width="18" height="18" fill="#5865F2"><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23A.077.077 0 008.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 01-1.872-.878.074.074 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.074.074 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/></svg>Sign in with Discord</a>
        </div>
      </div>
    </div>
  )
}
