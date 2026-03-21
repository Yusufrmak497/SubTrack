function SubscriptionDetail({ subscription, onClose }) {
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

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export default SubscriptionDetail
