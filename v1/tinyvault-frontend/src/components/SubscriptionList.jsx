import { useEffect, useState } from 'react'

import SubscriptionCard from './SubscriptionCard'
import './SubscriptionList.css'

function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const response = await fetch('http://localhost:8000/subscriptions')
        if (!response.ok) {
          throw new Error('Failed to fetch subscriptions')
        }
        const data = await response.json()
        setSubscriptions(data)
      } catch (fetchError) {
        setError(fetchError.message)
      } finally {
        setLoading(false)
      }
    }

    loadSubscriptions()
  }, [])

  if (loading) {
    return <p className="state-text">Loading subscriptions...</p>
  }

  if (error) {
    return <p className="state-text error">{error}</p>
  }

  return (
    <section>
      <h2 className="section-title">Your Subscriptions</h2>
      <div className="grid">
        {subscriptions.map((subscription) => (
          <SubscriptionCard key={subscription.id} subscription={subscription} />
        ))}
      </div>
    </section>
  )
}

export default SubscriptionList
