function SummaryCards({ subscriptions }) {
  const activeSubscriptions = subscriptions.filter((sub) => sub.is_active)
  const monthlyTotal = activeSubscriptions
    .reduce((total, sub) => total + (sub.billing_cycle === 'Yearly' ? sub.amount / 12 : sub.amount), 0)
    .toFixed(2)

  const upcomingCount = activeSubscriptions.filter((sub) => sub.upcoming_payment).length

  return (
    <section className="summary-grid">
      <article className="panel summary-card">
        <h4>Active Subscriptions</h4>
        <strong>{activeSubscriptions.length}</strong>
      </article>

      <article className="panel summary-card">
        <h4>Estimated Monthly Total</h4>
        <strong>${monthlyTotal}</strong>
      </article>

      <article className="panel summary-card">
        <h4>Due in Next 7 Days</h4>
        <strong>{upcomingCount}</strong>
      </article>
    </section>
  )
}

export default SummaryCards
