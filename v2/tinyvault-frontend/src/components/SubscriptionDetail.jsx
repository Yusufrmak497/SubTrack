import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'

function SubscriptionDetail({ subscription, onClose }) {
  const [audits, setAudits] = useState([])
  const [loadingAudits, setLoadingAudits] = useState(false)
  const [auditError, setAuditError] = useState(null)
  const modalRef = useRef(null)

  useGSAP(() => {
    if (subscription && modalRef.current) {
      gsap.from(modalRef.current, {
        scale: 0.85,
        opacity: 0,
        y: 20,
        ease: 'back.out(1.4)',
        duration: 0.45,
        clearProps: 'all'
      })
    }
  }, { dependencies: [subscription] })

  useEffect(() => {
    if (!subscription) {
      setAudits([])
      setAuditError(null)
      return
    }

    let cancelled = false
    const fetchAudits = async () => {
      setLoadingAudits(true)
      setAuditError(null)

      try {
        const response = await fetch(`http://localhost:8000/subscriptions/${subscription.id}/audits`)
        if (!response.ok) {
          throw new Error('Could not load history.')
        }
        const data = await response.json()
        if (!cancelled) setAudits(data)
      } catch (error) {
        if (!cancelled) {
          setAuditError(error.message)
          setAudits([])
        }
      } finally {
        if (!cancelled) setLoadingAudits(false)
      }
    }

    fetchAudits()
    return () => { cancelled = true }
  }, [subscription])

  const formatDateTime = (value) => new Date(value).toLocaleString()

  if (!subscription) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div className="detail-card premium-glass" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <h3>{subscription.service_name}</h3>
          <span className={`status-badge ${subscription.is_active ? 'active' : 'inactive'}`}>
            {subscription.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Category</span>
            <span className="detail-val">{subscription.category}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Billing</span>
            <span className="detail-val">{subscription.billing_cycle}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Amount</span>
            <span className="detail-val">${subscription.amount.toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Monthly Est.</span>
            <span className="detail-val str-val">${subscription.estimated_monthly_amount.toFixed(2)}</span>
          </div>
          <div className="detail-item full-width">
            <span className="detail-label">Next Payment</span>
            <span className="detail-val">{subscription.next_payment_date}</span>
          </div>
        </div>

        <div className="history-section">
          <h4>SubTrack History</h4>
          <hr className="subtle-hr" />
          {loadingAudits ? <p className="audit-state">Loading history...</p> : null}
          {auditError ? <p className="audit-state audit-error">{auditError}</p> : null}
          {!loadingAudits && !auditError && audits.length === 0 ? (
            <p className="audit-state">No history yet for this subscription.</p>
          ) : null}
          {!loadingAudits && !auditError && audits.length > 0 ? (
            <ul className="audit-list">
              {audits.map((audit) => (
                <li key={audit.id}>
                  <div className="audit-act"><strong>{audit.action}</strong></div>
                  <div className="audit-note">{audit.note || 'No note provided'}</div>
                  <div className="audit-time">{formatDateTime(audit.created_at)}</div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="action-buttons mt-main" style={{ display: 'flex', gap: '1rem' }}>
          <a
            href={`http://localhost:8000/subscriptions/${subscription.id}/calendar`}
            download
            style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '0.8rem', borderRadius: '10px', background: '#f8fafc', color: '#475569', fontWeight: '600', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            onClick={() => {
              toast.success("Calendar reminder generated! Check your downloads.")
            }}
          >
            📅 Sync to Calendar
          </a>
          <button className="primary-btn" style={{ flex: 1 }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionDetail
