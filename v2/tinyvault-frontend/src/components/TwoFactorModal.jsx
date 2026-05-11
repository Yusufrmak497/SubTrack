import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function TwoFactorModal({ onClose, token }) {
  const [activeTab, setActiveTab] = useState('totp') // 'totp' | 'recovery' | 'question'

  // TOTP States
  const [step, setStep] = useState('initial')
  const [qrData, setQrData] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  // Recovery Codes States
  const [recoveryStep, setRecoveryStep] = useState('initial')
  const [recoveryCodes, setRecoveryCodes] = useState([])
  const [recoveryError, setRecoveryError] = useState('')

  // Security Question States
  const [questionStep, setQuestionStep] = useState('initial')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [questionError, setQuestionError] = useState('')

  // Trusted Devices States
  const [devices, setDevices] = useState([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [devicesError, setDevicesError] = useState('')

  useEffect(() => {
    if (activeTab === 'devices') {
      fetchDevices()
    }
  }, [activeTab])

  async function fetchDevices() {
    setDevicesLoading(true)
    try {
      const res = await fetch(`${API}/auth/devices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setDevices(data)
      else setDevicesError(data.detail || 'Cihazlar yüklenemedi')
    } catch {
      setDevicesError('Sunucu hatası')
    } finally {
      setDevicesLoading(false)
    }
  }

  async function handleRevokeDevice(id) {
    try {
      const res = await fetch(`${API}/auth/devices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setDevices(devices.filter(d => d.id !== id))
      }
    } catch {
      setDevicesError('Cihaz kaldırılamadı')
    }
  }

  // --- TOTP Functions ---
  async function handleSetup() {
    try {
      const res = await fetch(`${API}/auth/2fa/setup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        const errMsg = data.error || data.detail || '';
        if (errMsg.includes('already enabled')) {
          setStep('already_enabled')
        } else {
          setError(errMsg || 'Kurulum başarısız.')
        }
        return
      }
      setQrData(data)
      setStep('qr')
      setError('')
    } catch {
      setError('Sunucu hatası')
    }
  }

  async function handleDisable() {
    try {
      const res = await fetch(`${API}/auth/2fa/disable`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setStep('disabled')
      } else {
        setError('Devre dışı bırakılamadı.')
      }
    } catch {
      setError('Sunucu hatası')
    }
  }

  async function handleVerify() {
    try {
      const res = await fetch(`${API}/auth/2fa/verify`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ code, method: 'totp' })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || data.detail || 'Hatalı kod')
        return
      }
      setStep('success')
    } catch {
      setError('Sunucu hatası')
    }
  }

  // --- Recovery Codes Functions ---
  async function handleGenerateRecovery() {
    try {
      const res = await fetch(`${API}/auth/2fa/recovery-codes/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setRecoveryError(data.error || data.detail || 'Kodlar üretilemedi.')
        return
      }
      setRecoveryCodes(data.codes)
      setRecoveryStep('generated')
      setRecoveryError('')
    } catch {
      setRecoveryError('Sunucu hatası')
    }
  }

  // --- Security Question Functions ---
  async function handleSetupQuestion() {
    if (question.trim().length < 5) {
      setQuestionError('Soru en az 5 karakter olmalıdır.')
      return
    }
    if (answer.trim().length < 1) {
      setQuestionError('Cevap boş olamaz.')
      return
    }
    try {
      const res = await fetch(`${API}/auth/2fa/security-question/setup`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ question: question.trim(), answer: answer.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        setQuestionError(data.error || data.detail || 'Soru ayarlanamadı.')
        return
      }
      setQuestionStep('success')
      setQuestionError('')
    } catch {
      setQuestionError('Sunucu hatası')
    }
  }

  return (
    <div className="modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'var(--overlay-bg)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000}}>
      <div className="modal-content" style={{background:'var(--panel-bg)', padding:'2rem', borderRadius:'12px', maxWidth:'450px', width:'100%', position:'relative', color:'var(--text)', boxShadow:'var(--panel-shadow)', border: '1px solid var(--panel-border)'}}>
        <button onClick={onClose} style={{position:'absolute', top:'15px', right:'15px', background:'transparent', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'var(--muted)'}}>✕</button>
        <h2 style={{marginTop: 0, marginBottom: '1.5rem'}}>İki Aşamalı Doğrulama</h2>
        
        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--panel-border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
          <button 
            onClick={() => setActiveTab('totp')} 
            style={{flex:1, minWidth:'90px', padding:'0.5rem', background:'transparent', border:'none', borderBottom: activeTab === 'totp' ? '2px solid var(--primary)' : 'none', color: activeTab === 'totp' ? 'var(--primary)' : 'var(--muted)', cursor:'pointer', fontWeight: activeTab === 'totp' ? 'bold' : 'normal'}}>
            Uygulama
          </button>
          <button 
            onClick={() => setActiveTab('recovery')} 
            style={{flex:1, minWidth:'90px', padding:'0.5rem', background:'transparent', border:'none', borderBottom: activeTab === 'recovery' ? '2px solid var(--primary)' : 'none', color: activeTab === 'recovery' ? 'var(--primary)' : 'var(--muted)', cursor:'pointer', fontWeight: activeTab === 'recovery' ? 'bold' : 'normal'}}>
            Yedek Kodlar
          </button>
          <button 
            onClick={() => setActiveTab('question')} 
            style={{flex:1, minWidth:'90px', padding:'0.5rem', background:'transparent', border:'none', borderBottom: activeTab === 'question' ? '2px solid var(--primary)' : 'none', color: activeTab === 'question' ? 'var(--primary)' : 'var(--muted)', cursor:'pointer', fontWeight: activeTab === 'question' ? 'bold' : 'normal'}}>
            Soru
          </button>
          <button 
            onClick={() => setActiveTab('devices')} 
            style={{flex:1, minWidth:'90px', padding:'0.5rem', background:'transparent', border:'none', borderBottom: activeTab === 'devices' ? '2px solid var(--primary)' : 'none', color: activeTab === 'devices' ? 'var(--primary)' : 'var(--muted)', cursor:'pointer', fontWeight: activeTab === 'devices' ? 'bold' : 'normal'}}>
            Cihazlar
          </button>
        </div>

        {/* TOTP TAB */}
        {activeTab === 'totp' && (
          <div>
            {step === 'initial' && (
              <div>
                <p>Hesabınızın güvenliğini artırmak için Google Authenticator ile 2FA kurun.</p>
                {error && <p style={{color:'var(--error)'}}>{error}</p>}
                <button onClick={handleSetup} style={{background:'var(--primary)', color:'#fff', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width: '100%', marginTop: '1rem', fontWeight:'bold'}}>Kurulumu Başlat / Kontrol Et</button>
              </div>
            )}

            {step === 'already_enabled' && (
              <div>
                <p style={{color:'#10b981', fontWeight:'bold'}}>✅ Google Authenticator (TOTP) zaten aktif.</p>
                <p>Eğer iptal etmek istiyorsanız aşağıdaki butonu kullanabilirsiniz.</p>
                {error && <p style={{color:'var(--error)'}}>{error}</p>}
                <button onClick={handleDisable} style={{background:'var(--danger)', color:'#fff', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width: '100%', marginTop: '1rem', fontWeight:'bold'}}>2FA'yı Kapat</button>
              </div>
            )}

            {step === 'disabled' && (
              <div style={{textAlign: 'center'}}>
                <p style={{color:'var(--danger)', fontWeight:'bold', fontSize: '1.2rem'}}>⚠️ 2FA Kapatıldı!</p>
                <button onClick={onClose} style={{background:'var(--panel-border)', color:'var(--text)', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width: '100%', marginTop:'1.5rem', fontWeight:'bold'}}>Kapat</button>
              </div>
            )}

            {step === 'qr' && qrData && (
              <div style={{textAlign:'center'}}>
                <p>Google Authenticator uygulamasını açın ve bu QR kodu okutun:</p>
                <div style={{background:'#fff', padding:'1rem', display:'inline-block', borderRadius:'8px', marginBottom: '1rem', border: '1px solid #e2e8f0'}}>
                  <QRCodeSVG value={qrData.provisioning_uri} size={200} />
                </div>
                <p style={{fontSize: '0.9rem', marginBottom: '1rem', background:'var(--input-bg)', padding:'0.5rem', borderRadius:'4px', border: '1px solid var(--panel-border)'}}>Gizli Anahtar: <strong>{qrData.secret}</strong></p>
                
                <input 
                  type="text" 
                  placeholder="6 Haneli Kodu Girin" 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  maxLength={6}
                  style={{width:'100%', padding:'0.8rem', marginTop:'0.5rem', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize:'1rem', textAlign:'center', letterSpacing:'0.2rem'}}
                />
                {error && <p style={{color:'var(--error)', marginTop: '0.5rem'}}>{error}</p>}
                <button onClick={handleVerify} style={{background:'#10b981', color:'#fff', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width: '100%', marginTop:'1rem', fontWeight:'bold'}}>Doğrula ve Etkinleştir</button>
              </div>
            )}

            {step === 'success' && (
              <div style={{textAlign: 'center'}}>
                <p style={{color:'#10b981', fontWeight:'bold', fontSize: '1.2rem'}}>✅ Başarıyla Etkinleştirildi!</p>
                <button onClick={onClose} style={{background:'var(--panel-border)', color:'var(--text)', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width: '100%', marginTop:'1.5rem', fontWeight:'bold'}}>Kapat</button>
              </div>
            )}
          </div>
        )}

        {/* RECOVERY CODES TAB */}
        {activeTab === 'recovery' && (
          <div>
            {recoveryStep === 'initial' && (
              <div>
                <p>Telefonunuza erişiminizi kaybederseniz hesabınıza girmek için <strong>tek kullanımlık kurtarma kodları</strong> üretebilirsiniz.</p>
                {recoveryError && <p style={{color:'var(--error)'}}>{recoveryError}</p>}
                <button onClick={handleGenerateRecovery} style={{background:'var(--primary)', color:'#fff', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width: '100%', marginTop: '1rem', fontWeight:'bold'}}>Yeni Kodlar Üret</button>
                <p style={{fontSize:'0.8rem', color:'var(--muted)', marginTop:'1rem'}}>Not: Yeni kodlar ürettiğinizde eski kodlarınız iptal olur.</p>
              </div>
            )}

            {recoveryStep === 'generated' && (
              <div style={{textAlign:'center'}}>
                <p style={{color:'#10b981', fontWeight:'bold'}}>✅ Kodlar Üretildi!</p>
                <p style={{fontSize:'0.9rem'}}>Lütfen bu kodları güvenli bir yere kopyalayın. Her kod sadece <strong>bir kez</strong> kullanılabilir.</p>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginTop:'1rem', background:'var(--input-bg)', padding:'1rem', borderRadius:'6px', border:'1px solid var(--panel-border)'}}>
                  {recoveryCodes.map((c, i) => (
                    <code key={i} style={{fontFamily:'monospace', fontSize:'1.1rem', padding:'0.3rem', background:'var(--panel-bg)', borderRadius:'4px', border: '1px solid var(--panel-border)'}}>{c}</code>
                  ))}
                </div>

                <button onClick={onClose} style={{background:'var(--panel-border)', color:'var(--text)', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width: '100%', marginTop:'1.5rem', fontWeight:'bold'}}>Kopyaladım, Kapat</button>
              </div>
            )}
          </div>
        )}

        {/* SECURITY QUESTION TAB */}
        {activeTab === 'question' && (
          <div>
            {questionStep === 'initial' && (
              <div>
                <p>Ekstra bir güvenlik katmanı olarak kendi belirlediğiniz bir soruyu ve cevabını ekleyebilirsiniz.</p>
                
                <div style={{marginTop:'1rem'}}>
                  <label style={{display:'block', marginBottom:'0.5rem', fontSize:'0.9rem', color:'var(--muted)'}}>Güvenlik Sorunuz</label>
                  <input 
                    type="text" 
                    placeholder="Örn: İlkokul öğretmeninizin adı nedir?" 
                    value={question} 
                    onChange={e => setQuestion(e.target.value)} 
                    style={{width:'100%', padding:'0.8rem', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize:'1rem', marginBottom:'1rem'}}
                  />

                  <label style={{display:'block', marginBottom:'0.5rem', fontSize:'0.9rem', color:'var(--muted)'}}>Cevabınız</label>
                  <input 
                    type="text" 
                    placeholder="Gizli cevap..." 
                    value={answer} 
                    onChange={e => setAnswer(e.target.value)} 
                    style={{width:'100%', padding:'0.8rem', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize:'1rem'}}
                  />
                </div>

                {questionError && <p style={{color:'var(--error)', marginTop: '0.5rem'}}>{questionError}</p>}
                
                <button onClick={handleSetupQuestion} style={{background:'var(--primary)', color:'#fff', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width: '100%', marginTop: '1.5rem', fontWeight:'bold'}}>Soruyu Kaydet</button>
              </div>
            )}

            {questionStep === 'success' && (
              <div style={{textAlign: 'center'}}>
                <p style={{color:'#10b981', fontWeight:'bold', fontSize: '1.2rem'}}>✅ Başarıyla Kaydedildi!</p>
                <p>Giriş yaparken 2FA kodu yerine güvenlik sorunuzu da kullanabilirsiniz.</p>
                <button onClick={onClose} style={{background:'var(--panel-border)', color:'var(--text)', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width: '100%', marginTop:'1.5rem', fontWeight:'bold'}}>Kapat</button>
              </div>
            )}
          </div>
        )}

        {/* DEVICES TAB */}
        {activeTab === 'devices' && (
          <div>
            <p>2FA (İki Aşamalı Doğrulama) sorulmadan direkt giriş yapabilen güvenilir cihazlarınız:</p>
            {devicesError && <p style={{color:'var(--error)'}}>{devicesError}</p>}
            
            {devicesLoading ? (
              <p>Yükleniyor...</p>
            ) : devices.length === 0 ? (
              <div style={{textAlign:'center', padding:'2rem', background:'var(--input-bg)', borderRadius:'8px', marginTop:'1rem', border:'1px solid var(--panel-border)'}}>
                <p style={{color:'var(--muted)', margin:0}}>Kayıtlı güvenilir cihazınız bulunmuyor.</p>
              </div>
            ) : (
              <div style={{marginTop:'1rem', maxHeight:'250px', overflowY:'auto'}}>
                {devices.map(device => (
                  <div key={device.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem', background:'var(--input-bg)', borderRadius:'8px', marginBottom:'0.5rem', border:'1px solid var(--panel-border)'}}>
                    <div style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      <p style={{margin:0, fontWeight:'bold', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={device.device_name}>{device.device_name || 'Bilinmeyen Cihaz'}</p>
                      <p style={{margin:0, fontSize:'0.8rem', color:'var(--muted)'}}>Bitiş: {new Date(device.expires_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleRevokeDevice(device.id)} style={{background:'var(--danger)', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem', marginLeft:'0.5rem'}}>
                      Kaldır
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button onClick={onClose} style={{background:'var(--panel-border)', color:'var(--text)', padding:'0.8rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', width: '100%', marginTop:'1.5rem', fontWeight:'bold'}}>Kapat</button>
          </div>
        )}

      </div>
    </div>
  )
}
