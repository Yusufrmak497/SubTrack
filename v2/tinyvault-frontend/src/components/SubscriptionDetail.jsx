import { useEffect, useState } from 'react'

function SubscriptionDetail({ subscription, onClose }) {
  const [audits, setAudits] = useState([])
  const [loadingAudits, setLoadingAudits] = useState(false)
  const [auditError, setAuditError] = useState(null)

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
        const response = await fetch(
          `http://localhost:8000/subscriptions/${subscription.id}/audits`,
        )

        if (!response.ok) {
          throw new Error('Could not load history.')
        }

        const data = await response.json()
        if (!cancelled) {
          setAudits(data)
        }
      } catch (error) {
        if (!cancelled) {
          setAuditError(error.message)
          setAudits([])
        }
      } finally {
        if (!cancelled) {
          setLoadingAudits(false)
        }
      }
    }

    fetchAudits()

    return () => {
      cancelled = true
    }
  }, [subscription])

  const formatDateTime = (value) => {
    return new Date(value).toLocaleString()
  }

  if (!subscription) {
    return null
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="detail-card" onClick={(event) => event.stopPropagation()}>
        <h3>{subscription.service_name}</h3>
        <p><strong>Category:</strong> {subscription.category}</p>
        <p><strong>Billing:</strong> {subscription.billing_cycle}</p>
        <p><strong>Amount:</strong> ${subscription.amount.toFixed(2)}</p>
        <p><strong>Estimated Monthly:</strong> ${subscription.estimated_monthly_amount.toFixed(2)}</p>
        <p><strong>Next Payment Date:</strong> {subscription.next_payment_date}</p>
        <p><strong>Status:</strong> {subscription.is_active ? 'Active' : 'Inactive'}</p>

        <hr />
        <h4>History</h4>
        {loadingAudits && <p className="audit-state">Loading history...</p>}
        {auditError && <p className="audit-state audit-error">{auditError}</p>}
        {!loadingAudits && !auditError && audits.length === 0 && (
          <p className="audit-state">No history yet for this subscription.</p>
        )}
        {!loadingAudits && !auditError && audits.length > 0 && (
          <ul className="audit-list">
            {audits.map((audit) => (
              <li key={audit.id}>
                <strong>{audit.action}</strong> - {audit.note || 'No note'} <br />
                <small>{formatDateTime(audit.created_at)}</small>
              </li>
            ))}
          </ul>
        )}

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export default SubscriptionDetail
