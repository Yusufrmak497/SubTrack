import { getCategoryColor } from '../constants/categoryColors'
import { getServiceLoginUrl } from '../constants/serviceLinks'

function SubscriptionCard({ subscription, onDelete, onSelect }) {
  const loginUrl = getServiceLoginUrl(subscription.service_name)
  const categoryLabel = subscription.category || 'Uncategorized'
  const categoryColor = getCategoryColor(subscription.category)

  return (
    <article
      className={`panel subscription-card ${subscription.upcoming_payment ? 'upcoming' : ''} ${!subscription.is_active ? 'inactive-card' : ''}`}
      onClick={() => onSelect(subscription)}
    >
      <div className="card-top">
        <div className="card-heading" style={{ flex: 1, minWidth: 0 }}>
          <h3>
            {loginUrl ? (
              <a
                className="service-link"
                href={loginUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                {subscription.service_name}
              </a>
            ) : (
              subscription.service_name
            )}
          </h3>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="category-pill" style={{ '--category-color': categoryColor }}>{categoryLabel}</span>
            {!subscription.is_active && <span className="status-label-small">Inactive</span>}
          </div>
        </div>
        {onDelete && (
          <button
            className="danger-btn"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(subscription.id)
            }}
          >
            Remove
          </button>
        )}
      </div>

      {subscription.tags && subscription.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {subscription.tags.map(tag => (
            <span key={tag} style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>#{tag}</span>
          ))}
        </div>
      )}
      <p>{subscription.billing_cycle} — ${subscription.amount.toFixed(2)}</p>
      <p>Monthly estimate: ${subscription.estimated_monthly_amount.toFixed(2)}</p>
      <p>Next payment: {subscription.next_payment_date}</p>

      {subscription.is_active && subscription.upcoming_payment && (
        <span className="badge">Upcoming payment ({subscription.days_until_payment} day(s))</span>
      )}
    </article>
  )
}

export default SubscriptionCard
