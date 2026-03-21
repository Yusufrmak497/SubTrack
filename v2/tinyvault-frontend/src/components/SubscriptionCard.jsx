function SubscriptionCard({ subscription, onDelete, onSelect }) {
  return (
    <article
      className={`panel subscription-card ${subscription.upcoming_payment ? 'upcoming' : ''}`}
      onClick={() => onSelect(subscription)}
    >
      <div className="card-top">
        <h3>{subscription.service_name}</h3>
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

      <p className="muted">{subscription.category}</p>
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
