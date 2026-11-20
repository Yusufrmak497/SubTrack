import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

const FEATURES = [
  {
    icon: '📊',
    title: 'Single Dashboard',
    desc: 'Netflix, Spotify, AWS — view all your subscriptions in one place. Never let a payment slip by unnoticed.',
  },
  {
    icon: '🔔',
    title: 'Renewal Reminders',
    desc: 'Get automatic reminders before payment dates. Cancel unwanted subscriptions on time.',
  },
  {
    icon: '💳',
    title: 'Payment Method Tracking',
    desc: 'Which card is linked to which service? Instantly see what needs updating when you change cards.',
  },
  {
    icon: '📈',
    title: 'Spending Analytics',
    desc: 'Analyze your monthly and yearly spending by category. Never miss a savings opportunity.',
  },
]

const STEPS = [
  { num: '01', title: 'Create Account', desc: 'Sign up in seconds, no credit card required.' },
  { num: '02', title: 'Add Subscriptions', desc: 'Enter service name, amount, and renewal date.' },
  { num: '03', title: 'Take Control', desc: 'Track all your subscriptions from your dashboard.' },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/ mo',
    features: ['Up to 10 subscriptions', 'Basic analytics', 'Email reminders', '1 payment method'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$4.99',
    period: '/ mo',
    features: ['Unlimited subscriptions', 'Advanced analytics', 'Priority support', 'Unlimited payment methods', 'CSV / PDF export'],
    cta: 'Upgrade to Pro',
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
          <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get Started Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero">
        <div className="hero-badge">Subscription Management Made Easy</div>
        <h1 className="hero-title">
          Keep Your Subscriptions <span className="hero-accent">Under Control</span>
        </h1>
        <p className="hero-subtitle">
          Track all your digital subscriptions on a single platform. Discover unnecessary spending and never miss a renewal.
        </p>
        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={() => navigate('/register')}>Get Started Free</button>
          <button className="btn-hero-secondary" onClick={() => navigate('/login')}>Sign In</button>
        </div>
        <div className="hero-stats">
          <div className="stat"><strong>10K+</strong><span>Active Users</span></div>
          <div className="stat-divider" />
          <div className="stat"><strong>500K+</strong><span>Tracked Subscriptions</span></div>
          <div className="stat-divider" />
          <div className="stat"><strong>99.9%</strong><span>Uptime</span></div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="landing-section" id="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">Why SubTrack?</h2>
        <p className="section-subtitle">Put an end to subscription chaos.</p>
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
          <div className="section-label">How It Works</div>
          <h2 className="section-title">Get Started in 3 Steps</h2>
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
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Simple & Transparent</h2>
        <p className="section-subtitle">No hidden fees, cancel anytime.</p>
        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`pricing-card${plan.highlight ? ' pricing-card--highlight' : ''}`}>
              {plan.highlight && <div className="pricing-badge">Most Popular</div>}
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
        <p className="footer-copy">&copy; 2026 SubTrack. All rights reserved.</p>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#pricing">Pricing</a>
        </div>
      </footer>
    </div>
  )
}
