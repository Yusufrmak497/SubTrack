import { useEffect, useMemo, useState } from 'react'

import SubscriptionCard from './SubscriptionCard'
import SubscriptionDetail from './SubscriptionDetail'
import SummaryCards from './SummaryCards'
import './SubscriptionList.css'

function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSubscription, setSelectedSubscription] = useState(null)

  const fetchSubscriptions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/subscriptions')
      if (!response.ok) {
        throw new Error('Failed to load subscriptions. Is API running?')
      }

      const data = await response.json()
      setSubscriptions(data)
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const handleDeleteSubscription = async (subscriptionId) => {
    const response = await fetch(`http://localhost:8000/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      alert('Could not delete subscription.')
      return
    }

    setSubscriptions((prev) => prev.filter((subscription) => subscription.id !== subscriptionId))

    if (selectedSubscription?.id === subscriptionId) {
      setSelectedSubscription(null)
    }
  }

  const categories = useMemo(() => {
    return ['All', ...new Set(subscriptions.map((subscription) => subscription.category))]
  }, [subscriptions])

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      const matchesSearch = subscription.service_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === 'All' || subscription.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [subscriptions, searchTerm, selectedCategory])

  if (loading) {
    return <p className="state-text">Loading subscriptions...</p>
  }

  if (error) {
    return (
      <div className="panel state-error">
        <p>{error}</p>
        <button onClick={fetchSubscriptions}>Retry</button>
      </div>
    )
  }

  return (
    <section>
      <SummaryCards subscriptions={subscriptions} />

      <div className="layout-grid">
        <div className="panel">
          <h3>Filters</h3>
          <div className="filters">
            <input
              type="text"
              placeholder="Search by service name"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="panel">
          <h3>Midterm Scope Note</h3>
          <p className="scope-note">
            This version focuses on read, filter, analytics, detail view, and deletion flows.
            Form-based create/update screens are intentionally reserved for the next week.
          </p>
        </div>
      </div>

      {filteredSubscriptions.length === 0 ? (
        <p className="state-text">No subscriptions found.</p>
      ) : (
        <div className="subscription-grid">
          {filteredSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onDelete={handleDeleteSubscription}
              onSelect={setSelectedSubscription}
            />
          ))}
        </div>
      )}

      <SubscriptionDetail
        subscription={selectedSubscription}
        onClose={() => setSelectedSubscription(null)}
      />
    </section>
  )
}

export default SubscriptionList
