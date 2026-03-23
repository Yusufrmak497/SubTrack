import { getCategoryColor } from '../constants/categoryColors'
import { getServiceLoginUrl } from '../constants/serviceLinks'

function SubscriptionCard({ subscription, onDelete, onSelect }) {
  const loginUrl = getServiceLoginUrl(subscription.service_name)
  const categoryLabel = subscription.category || 'Uncategorized'
  const categoryColor = getCategoryColor(subscription.category)

  return (
    <article
      className={`panel subscription-card ${subscription.upcoming_payment ? 'upcoming' : ''}`}
      onClick={() => onSelect(subscription)}
    >
      <div className="card-top">
        <div className="card-heading">
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
          <span
            className="category-pill"
            style={{ '--category-color': categoryColor }}
          >
            {categoryLabel}
          </span>
        </div>
        <button
          className="danger-btn"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(subscription.id)
          }}
        >
          Remove
        </button>
      </div>

      <p>{subscription.billing_cycle} - ${subscription.amount.toFixed(2)}</p>
      <p>Monthly estimate: ${subscription.estimated_monthly_amount.toFixed(2)}</p>
      <p>Next payment: {subscription.next_payment_date}</p>

      {subscription.upcoming_payment && (
        <span className="badge">Upcoming payment ({subscription.days_until_payment} day(s))</span>
      )}
    </article>
  )
}

export default SubscriptionCard
