import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

const FEATURES = [
  {
    icon: '📊',
    title: 'Tek Panelden Takip',
    desc: 'Netflix, Spotify, AWS — tüm aboneliklerinizi tek yerde görün. Hiçbir ödeme sizi haberdar etmeden geçmesin.',
  },
  {
    icon: '🔔',
    title: 'Yenileme Hatırlatıcıları',
    desc: 'Ödeme tarihinden önce otomatik hatırlatma alın. İstemediğiniz aboneliği zamanında iptal edin.',
  },
  {
    icon: '💳',
    title: 'Ödeme Yöntemi Takibi',
    desc: 'Hangi kart hangi servise bağlı? Kart değiştirdiğinizde neleri güncellemeniz gerektiğini anında görün.',
  },
  {
    icon: '📈',
    title: 'Harcama Analitiği',
    desc: 'Aylık ve yıllık harcamalarınızı kategori bazlı analiz edin. Tasarruf fırsatlarını kaçırmayın.',
  },
]

const STEPS = [
  { num: '01', title: 'Hesap Oluştur', desc: 'Birkaç saniyede kayıt olun, kredi kartı gerekmez.' },
  { num: '02', title: 'Aboneliklerini Ekle', desc: 'Servis adı, tutar ve yenileme tarihi girin.' },
  { num: '03', title: 'Kontrol Edin', desc: 'Dashboard\'unuzda tüm abonelikleri takip edin.' },
]

const PLANS = [
  {
    name: 'Ücretsiz',
    price: '₺0',
    period: '/ ay',
    features: ['10 aboneliğe kadar', 'Temel analizler', 'E-posta hatırlatıcı', '1 ödeme yöntemi'],
    cta: 'Hemen Başla',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₺49',
    period: '/ ay',
    features: ['Sınırsız abonelik', 'Gelişmiş analizler', 'Öncelikli destek', 'Sınırsız ödeme yöntemi', 'CSV / PDF dışa aktarma'],
    cta: 'Pro\'ya Geç',
    highlight: true,
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* NAVBAR */}
      <nav className="landing-nav">
        <span className="landing-logo" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>SubTrack</span>
        <div className="landing-nav-actions">
          <button className="btn-ghost" onClick={() => navigate('/login')}>Giriş Yap</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Ücretsiz Başla</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero">
        <div className="hero-badge">Abonelik Yönetimi Artık Kolay</div>
        <h1 className="hero-title">
          Aboneliklerinizi <span className="hero-accent">Kontrol Altında</span> Tutun
        </h1>
        <p className="hero-subtitle">
          Tüm dijital aboneliklerinizi tek platformda takip edin. Gereksiz harcamaları keşfedin, yenilemeleri kaçırmayın.
        </p>
        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={() => navigate('/register')}>Ücretsiz Başla</button>
          <button className="btn-hero-secondary" onClick={() => navigate('/login')}>Giriş Yap</button>
        </div>
        <div className="hero-stats">
          <div className="stat"><strong>10K+</strong><span>Aktif Kullanıcı</span></div>
          <div className="stat-divider" />
          <div className="stat"><strong>500K+</strong><span>Takip Edilen Abonelik</span></div>
          <div className="stat-divider" />
          <div className="stat"><strong>%99.9</strong><span>Uptime</span></div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="landing-section" id="features">
        <div className="section-label">Özellikler</div>
        <h2 className="section-title">Neden SubTrack?</h2>
        <p className="section-subtitle">Abonelik kaosuna son verin.</p>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-section--alt" id="how">
        <div className="section-inner">
          <div className="section-label">Nasıl Çalışır?</div>
          <h2 className="section-title">3 Adımda Başlayın</h2>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.num} className="step-card">
                <span className="step-num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="landing-section" id="pricing">
        <div className="section-label">Fiyatlandırma</div>
        <h2 className="section-title">Basit ve Şeffaf</h2>
        <p className="section-subtitle">Gizli ücret yok, istediğinizde iptal edin.</p>
        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`pricing-card${plan.highlight ? ' pricing-card--highlight' : ''}`}>
              {plan.highlight && <div className="pricing-badge">En Popüler</div>}
              <div className="pricing-name">{plan.name}</div>
              <div className="pricing-price">
                {plan.price}<span className="pricing-period">{plan.period}</span>
              </div>
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}><span className="check">✓</span>{f}</li>
                ))}
              </ul>
              <button
                className={plan.highlight ? 'btn-primary pricing-btn' : 'btn-outline pricing-btn'}
                onClick={() => navigate('/register')}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <span className="landing-logo" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>SubTrack</span>
        <p className="footer-copy">&copy; 2026 SubTrack. Tüm hakları saklıdır.</p>
        <div className="footer-links">
          <a href="#features">Özellikler</a>
          <a href="#how">Nasıl Çalışır</a>
          <a href="#pricing">Fiyatlandırma</a>
        </div>
      </footer>
    </div>
  )
}
