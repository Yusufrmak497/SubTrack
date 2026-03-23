import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function SubscriptionDetail({ subscription, onUpdate, onClose }) {
  const [audits, setAudits] = useState([])
  const [loadingAudits, setLoadingAudits] = useState(false)
  const [auditError, setAuditError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    service_name: '',
    category: '',
    billing_cycle: '',
    amount: 0,
    next_payment_date: '',
    is_active: true
  })
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
    if (subscription) {
      setEditForm({
        service_name: subscription.service_name,
        category: subscription.category,
        billing_cycle: subscription.billing_cycle,
        amount: subscription.amount,
        next_payment_date: subscription.next_payment_date,
        is_active: subscription.is_active
      })
    }
    setIsEditing(false)
  }, [subscription])

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
        const response = await fetch(`${API_BASE_URL}/subscriptions/${subscription.id}/audits`)
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

  const handleSave = async () => {
    await onUpdate(subscription.id, editForm)
    setIsEditing(false)
  }

  const handleToggleActive = async () => {
    await onUpdate(subscription.id, { is_active: !subscription.is_active })
  }

  const formatDateTime = (value) => new Date(value).toLocaleString()

  if (!subscription) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div className="detail-card premium-glass" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          {isEditing ? (
            <input 
              type="text" 
              className="edit-input-heading"
              value={editForm.service_name}
              onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
            />
          ) : (
            <h3>{subscription.service_name}</h3>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isEditing ? (
               <select 
                className="edit-select-badge"
                value={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            ) : (
              <span className={`status-badge ${subscription.is_active ? 'active' : 'inactive'}`}>
                {subscription.is_active ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>
        
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Category</span>
            {isEditing ? (
              <input 
                type="text" 
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            ) : (
              <span className="detail-val">{subscription.category}</span>
            )}
          </div>
          <div className="detail-item">
            <span className="detail-label">Billing</span>
            {isEditing ? (
              <select 
                value={editForm.billing_cycle}
                onChange={(e) => setEditForm(prev => ({ ...prev, billing_cycle: e.target.value }))}
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            ) : (
              <span className="detail-val">{subscription.billing_cycle}</span>
            )}
          </div>
          <div className="detail-item">
            <span className="detail-label">Amount</span>
            {isEditing ? (
              <input 
                type="number" 
                step="0.01" 
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
              />
            ) : (
              <span className="detail-val">${subscription.amount.toFixed(2)}</span>
            )}
          </div>
          <div className="detail-item">
            <span className="detail-label">Monthly Est.</span>
            <span className="detail-val str-val">${subscription.estimated_monthly_amount.toFixed(2)}</span>
          </div>
          <div className="detail-item full-width">
            <span className="detail-label">Next Payment</span>
            {isEditing ? (
              <input 
                type="date" 
                value={editForm.next_payment_date}
                onChange={(e) => setEditForm({ ...editForm, next_payment_date: e.target.value })}
              />
            ) : (
              <span className="detail-val">{subscription.next_payment_date}</span>
            )}
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

        <div className="action-buttons mt-main" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {isEditing ? (
            <>
            <button className="primary-btn" style={{ flex: 1 }} onClick={handleSave}>Save Changes</button>
              <button className="secondary-btn" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button 
                className={subscription.is_active ? "secondary-btn pause-btn" : "secondary-btn resume-btn"} 
                style={{ flex: 1 }} 
                onClick={handleToggleActive}
              >
                {subscription.is_active ? '⏸ Pause' : '▶️ Resume'}
              </button>
              <button className="secondary-btn" style={{ flex: 1 }} onClick={() => setIsEditing(true)}>✏️ Edit</button>
              <a
                href={`${API_BASE_URL}/subscriptions/${subscription.id}/calendar`}
                download
                className="calendar-btn"
                onClick={() => toast.success("Calendar reminder generated!")}
              >
                📅 Calendar
              </a>
              <button className="primary-btn" style={{ flex: 1 }} onClick={onClose}>Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubscriptionDetail
