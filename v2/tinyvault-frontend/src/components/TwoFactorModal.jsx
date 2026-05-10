import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function TwoFactorModal({ onClose, token }) {
  const [step, setStep] = useState('initial') // initial | qr | success
  const [qrData, setQrData] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  async function handleSetup() {
    try {
      const res = await fetch(`${API}/auth/2fa/setup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Kurulum başarısız. 2FA zaten açık olabilir.')
        return
      }
      setQrData(data)
      setStep('qr')
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
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Hatalı kod')
        return
      }
      setStep('success')
    } catch {
      setError('Sunucu hatası')
    }
  }

  return (
    <div className="modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000}}>
      <div className="modal-content" style={{background:'var(--bg-card)', padding:'2rem', borderRadius:'8px', maxWidth:'400px', width:'100%', position:'relative', color:'var(--text-primary)'}}>
        <button onClick={onClose} style={{position:'absolute', top:'10px', right:'10px', background:'transparent', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'var(--text-light)'}}>✕</button>
        <h2 style={{marginTop: 0}}>2FA Ayarları</h2>
        
        {step === 'initial' && (
          <div>
            <p>Hesabınızın güvenliğini artırmak için İki Aşamalı Doğrulamayı (2FA) etkinleştirin.</p>
            {error && <p style={{color:'red'}}>{error}</p>}
            <button onClick={handleSetup} style={{background:'var(--accent-primary)', color:'white', padding:'0.5rem 1rem', border:'none', borderRadius:'4px', cursor:'pointer', width: '100%', marginTop: '1rem'}}>2FA Kurulumunu Başlat</button>
          </div>
        )}

        {step === 'qr' && qrData && (
          <div style={{textAlign:'center'}}>
            <p>Google Authenticator uygulamasını açın ve bu QR kodu okutun:</p>
            <div style={{background:'white', padding:'1rem', display:'inline-block', borderRadius:'8px', marginBottom: '1rem'}}>
              <QRCodeSVG value={qrData.provisioning_uri} size={200} />
            </div>
            <p style={{fontSize: '0.9rem', marginBottom: '1rem'}}>Gizli Anahtar: <strong>{qrData.secret}</strong></p>
            
            <input 
              type="text" 
              placeholder="6 Haneli Kodu Girin" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              maxLength={6}
              style={{width:'100%', padding:'0.8rem', marginTop:'0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)'}}
            />
            {error && <p style={{color:'red', marginTop: '0.5rem'}}>{error}</p>}
            <button onClick={handleVerify} style={{background:'var(--accent-primary)', color:'white', padding:'0.8rem 1rem', border:'none', borderRadius:'4px', cursor:'pointer', width: '100%', marginTop:'1rem'}}>Doğrula ve Etkinleştir</button>
          </div>
        )}

        {step === 'success' && (
          <div style={{textAlign: 'center'}}>
            <p style={{color:'var(--accent-success)', fontWeight:'bold', fontSize: '1.2rem'}}>✅ Başarıyla Etkinleştirildi!</p>
            <p>Bir sonraki girişinizde Authenticator uygulamanızdaki koda ihtiyacınız olacak.</p>
            <button onClick={onClose} style={{background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'0.8rem 1rem', border:'none', borderRadius:'4px', cursor:'pointer', width: '100%', marginTop:'1.5rem'}}>Kapat</button>
          </div>
        )}
      </div>
    </div>
  )
}
