import './SubscriptionCard.css'

function SubscriptionCard({ subscription }) {
  return (
    <article className={`card ${subscription.upcoming_payment ? 'upcoming' : ''}`}>
      <h3>{subscription.service_name}</h3>
      <p className="muted">{subscription.category}</p>
      <p>
        {subscription.billing_cycle} - ${subscription.amount.toFixed(2)}
      </p>
      <p>Monthly estimate: ${subscription.estimated_monthly_amount.toFixed(2)}</p>
      <p>Next payment: {subscription.next_payment_date}</p>
      {subscription.upcoming_payment && (
        <span className="badge">Due in {subscription.days_until_payment} day(s)</span>
      )}
    </article>
  )
}

export default SubscriptionCard
