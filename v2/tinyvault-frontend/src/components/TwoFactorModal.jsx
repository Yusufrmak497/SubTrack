import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function TwoFactorModal({ onClose, token }) {
  const [activeTab, setActiveTab] = useState('totp')
  const [step, setStep] = useState('initial')
  const [qrData, setQrData] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [recoveryStep, setRecoveryStep] = useState('initial')
  const [recoveryCodes, setRecoveryCodes] = useState([])
  const [recoveryError, setRecoveryError] = useState('')
  const [questionStep, setQuestionStep] = useState('initial')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [questionError, setQuestionError] = useState('')
  const [devices, setDevices] = useState([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [devicesError, setDevicesError] = useState('')

  useEffect(() => { if (activeTab === 'devices') fetchDevices() }, [activeTab])

  async function fetchDevices() {
    setDevicesLoading(true)
    try {
      const res = await fetch(`${API}/auth/devices`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setDevices(data)
      else setDevicesError(data.detail || 'Failed to load devices')
    } catch { setDevicesError('Server error') }
    finally { setDevicesLoading(false) }
  }

  async function handleRevokeDevice(id) {
    try {
      const res = await fetch(`${API}/auth/devices/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) setDevices(devices.filter(d => d.id !== id))
    } catch { setDevicesError('Failed to remove device') }
  }

  async function handleSetup() {
    try {
      const res = await fetch(`${API}/auth/2fa/setup`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) {
        const errMsg = data.error || data.detail || ''
        if (errMsg.includes('already enabled')) { setStep('already_enabled') }
        else { setError(errMsg || 'Setup failed.') }
        return
      }
      setQrData(data); setStep('qr'); setError('')
    } catch { setError('Server error') }
  }

  async function handleDisable() {
    try {
      const res = await fetch(`${API}/auth/2fa/disable`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) setStep('disabled')
      else setError('Could not disable 2FA.')
    } catch { setError('Server error') }
  }

  async function handleVerify() {
    try {
      const res = await fetch(`${API}/auth/2fa/verify`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ code, method: 'totp' }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || data.detail || 'Invalid code'); return }
      setStep('success')
    } catch { setError('Server error') }
  }

  async function handleGenerateRecovery() {
    try {
      const res = await fetch(`${API}/auth/2fa/recovery-codes/generate`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) { setRecoveryError(data.error || data.detail || 'Could not generate codes.'); return }
      setRecoveryCodes(data.codes); setRecoveryStep('generated'); setRecoveryError('')
    } catch { setRecoveryError('Server error') }
  }

  async function handleSetupQuestion() {
    if (question.trim().length < 5) { setQuestionError('Question must be at least 5 characters.'); return }
    if (answer.trim().length < 1) { setQuestionError('Answer cannot be empty.'); return }
    try {
      const res = await fetch(`${API}/auth/2fa/security-question/setup`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ question: question.trim(), answer: answer.trim() }) })
      const data = await res.json()
      if (!res.ok) { setQuestionError(data.error || data.detail || 'Could not save question.'); return }
      setQuestionStep('success'); setQuestionError('')
    } catch { setQuestionError('Server error') }
  }

  const tabStyle = (tab) => ({flex:1, minWidth:'90px', padding:'0.5rem', background:'transparent', border:'none', borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none', color: activeTab === tab ? 'var(--primary)' : 'var(--muted)', cursor:'pointer', fontWeight: activeTab === tab ? 'bold' : 'normal'})
  const btnPrimary = {background:'var(--primary)', color:'#fff', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width:'100%', marginTop:'1rem', fontWeight:'bold'}
  const btnClose = {background:'var(--panel-border)', color:'var(--text)', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width:'100%', marginTop:'1.5rem', fontWeight:'bold'}

  return (
    <div className="modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'var(--overlay-bg)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000}}>
      <div className="modal-content" style={{background:'var(--panel-bg)', padding:'2rem', borderRadius:'12px', maxWidth:'450px', width:'100%', position:'relative', color:'var(--text)', boxShadow:'var(--panel-shadow)', border: '1px solid var(--panel-border)'}}>
        <button onClick={onClose} style={{position:'absolute', top:'15px', right:'15px', background:'transparent', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'var(--muted)'}}>✕</button>
        <h2 style={{marginTop: 0, marginBottom: '1.5rem'}}>Two-Factor Authentication</h2>
        
        <div style={{ display: 'flex', borderBottom: '1px solid var(--panel-border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
          <button onClick={() => setActiveTab('totp')} style={tabStyle('totp')}>Authenticator</button>
          <button onClick={() => setActiveTab('recovery')} style={tabStyle('recovery')}>Recovery Codes</button>
          <button onClick={() => setActiveTab('question')} style={tabStyle('question')}>Question</button>
          <button onClick={() => setActiveTab('devices')} style={tabStyle('devices')}>Devices</button>
        </div>

        {/* TOTP TAB */}
        {activeTab === 'totp' && (<div>
          {step === 'initial' && (<div><p>Set up 2FA with Google Authenticator to enhance your account security.</p>{error && <p style={{color:'var(--error)'}}>{error}</p>}<button onClick={handleSetup} style={btnPrimary}>Start Setup / Check Status</button></div>)}
          {step === 'already_enabled' && (<div><p style={{color:'#10b981', fontWeight:'bold'}}>✅ Google Authenticator (TOTP) is already active.</p><p>If you want to disable it, use the button below.</p>{error && <p style={{color:'var(--error)'}}>{error}</p>}<button onClick={handleDisable} style={{...btnPrimary, background:'var(--danger)'}}>Disable 2FA</button></div>)}
          {step === 'disabled' && (<div style={{textAlign:'center'}}><p style={{color:'var(--danger)', fontWeight:'bold', fontSize:'1.2rem'}}>⚠️ 2FA Disabled!</p><button onClick={onClose} style={btnClose}>Close</button></div>)}
          {step === 'qr' && qrData && (<div style={{textAlign:'center'}}><p>Open Google Authenticator and scan this QR code:</p><div style={{background:'#fff', padding:'1rem', display:'inline-block', borderRadius:'8px', marginBottom:'1rem', border:'1px solid #e2e8f0'}}><QRCodeSVG value={qrData.provisioning_uri} size={200} /></div><p style={{fontSize:'0.9rem', marginBottom:'1rem', background:'var(--input-bg)', padding:'0.5rem', borderRadius:'4px', border:'1px solid var(--panel-border)'}}>Secret Key: <strong>{qrData.secret}</strong></p><input type="text" placeholder="Enter 6-Digit Code" value={code} onChange={e => setCode(e.target.value)} maxLength={6} style={{width:'100%', padding:'0.8rem', marginTop:'0.5rem', borderRadius:'6px', border:'1px solid var(--input-border)', background:'var(--input-bg)', color:'var(--text)', fontSize:'1rem', textAlign:'center', letterSpacing:'0.2rem'}} />{error && <p style={{color:'var(--error)', marginTop:'0.5rem'}}>{error}</p>}<button onClick={handleVerify} style={{...btnPrimary, background:'#10b981'}}>Verify & Enable</button></div>)}
          {step === 'success' && (<div style={{textAlign:'center'}}><p style={{color:'#10b981', fontWeight:'bold', fontSize:'1.2rem'}}>✅ Successfully Enabled!</p><button onClick={onClose} style={btnClose}>Close</button></div>)}
        </div>)}

        {/* RECOVERY CODES TAB */}
        {activeTab === 'recovery' && (<div>
          {recoveryStep === 'initial' && (<div><p>Generate <strong>one-time recovery codes</strong> to access your account if you lose your phone.</p>{recoveryError && <p style={{color:'var(--error)'}}>{recoveryError}</p>}<button onClick={handleGenerateRecovery} style={btnPrimary}>Generate New Codes</button><p style={{fontSize:'0.8rem', color:'var(--muted)', marginTop:'1rem'}}>Note: Generating new codes will invalidate your old codes.</p></div>)}
          {recoveryStep === 'generated' && (<div style={{textAlign:'center'}}><p style={{color:'#10b981', fontWeight:'bold'}}>✅ Codes Generated!</p><p style={{fontSize:'0.9rem'}}>Please copy these codes to a safe place. Each code can only be used <strong>once</strong>.</p><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginTop:'1rem', background:'var(--input-bg)', padding:'1rem', borderRadius:'6px', border:'1px solid var(--panel-border)'}}>{recoveryCodes.map((c, i) => (<code key={i} style={{fontFamily:'monospace', fontSize:'1.1rem', padding:'0.3rem', background:'var(--panel-bg)', borderRadius:'4px', border:'1px solid var(--panel-border)'}}>{c}</code>))}</div><button onClick={onClose} style={btnClose}>I've Copied Them, Close</button></div>)}
        </div>)}

        {/* SECURITY QUESTION TAB */}
        {activeTab === 'question' && (<div>
          {questionStep === 'initial' && (<div><p>Add an extra layer of security by setting up your own security question and answer.</p><div style={{marginTop:'1rem'}}><label style={{display:'block', marginBottom:'0.5rem', fontSize:'0.9rem', color:'var(--muted)'}}>Your Security Question</label><input type="text" placeholder="e.g. What was your first pet's name?" value={question} onChange={e => setQuestion(e.target.value)} style={{width:'100%', padding:'0.8rem', borderRadius:'6px', border:'1px solid var(--input-border)', background:'var(--input-bg)', color:'var(--text)', fontSize:'1rem', marginBottom:'1rem'}} /><label style={{display:'block', marginBottom:'0.5rem', fontSize:'0.9rem', color:'var(--muted)'}}>Your Answer</label><input type="text" placeholder="Secret answer..." value={answer} onChange={e => setAnswer(e.target.value)} style={{width:'100%', padding:'0.8rem', borderRadius:'6px', border:'1px solid var(--input-border)', background:'var(--input-bg)', color:'var(--text)', fontSize:'1rem'}} /></div>{questionError && <p style={{color:'var(--error)', marginTop:'0.5rem'}}>{questionError}</p>}<button onClick={handleSetupQuestion} style={{...btnPrimary, marginTop:'1.5rem'}}>Save Question</button></div>)}
          {questionStep === 'success' && (<div style={{textAlign:'center'}}><p style={{color:'#10b981', fontWeight:'bold', fontSize:'1.2rem'}}>✅ Successfully Saved!</p><p>You can now use your security question as a 2FA method during login.</p><button onClick={onClose} style={btnClose}>Close</button></div>)}
        </div>)}

        {/* DEVICES TAB */}
        {activeTab === 'devices' && (<div>
          <p>Trusted devices that can sign in without 2FA verification:</p>
          {devicesError && <p style={{color:'var(--error)'}}>{devicesError}</p>}
          {devicesLoading ? (<p>Loading...</p>) : devices.length === 0 ? (
            <div style={{textAlign:'center', padding:'2rem', background:'var(--input-bg)', borderRadius:'8px', marginTop:'1rem', border:'1px solid var(--panel-border)'}}><p style={{color:'var(--muted)', margin:0}}>No trusted devices found.</p></div>
          ) : (
            <div style={{marginTop:'1rem', maxHeight:'250px', overflowY:'auto'}}>
              {devices.map(device => (
                <div key={device.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem', background:'var(--input-bg)', borderRadius:'8px', marginBottom:'0.5rem', border:'1px solid var(--panel-border)'}}>
                  <div style={{overflow:'hidden', textOverflow:'ellipsis'}}>
                    <p style={{margin:0, fontWeight:'bold', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={device.device_name}>{device.device_name || 'Unknown Device'}</p>
                    <p style={{margin:0, fontSize:'0.8rem', color:'var(--muted)'}}>Expires: {new Date(device.expires_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleRevokeDevice(device.id)} style={{background:'var(--danger)', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem', marginLeft:'0.5rem'}}>Remove</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={onClose} style={btnClose}>Close</button>
        </div>)}

      </div>
    </div>
  )
}
