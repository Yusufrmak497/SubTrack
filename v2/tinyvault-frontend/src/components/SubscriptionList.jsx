import { useEffect, useMemo, useState } from 'react'

import AddSubscriptionForm from './AddSubscriptionForm'
import SubscriptionCard from './SubscriptionCard'
import SubscriptionDetail from './SubscriptionDetail'
import SummaryCards from './SummaryCards'
import './SubscriptionList.css'

function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState([])
  const [convertedSummary, setConvertedSummary] = useState(null)
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

  const fetchConvertedSummary = async () => {
    try {
      const response = await fetch(
        'http://localhost:8000/subscriptions/summary/converted?currency=TRY',
      )
      if (!response.ok) {
        setConvertedSummary(null)
        return
      }
      const data = await response.json()
      setConvertedSummary(data)
    } catch {
      setConvertedSummary(null)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
    fetchConvertedSummary()
  }, [])

  const handleCreateSubscription = async (payload) => {
    const response = await fetch('http://localhost:8000/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      alert('Could not add subscription.')
      return
    }

    const newSubscription = await response.json()
    setSubscriptions((prev) => [newSubscription, ...prev])
    fetchConvertedSummary()
  }

  const handleDeleteSubscription = async (subscriptionId) => {
    const response = await fetch(`http://localhost:8000/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      alert('Could not delete subscription.')
      return
    }

    setSubscriptions((prev) => prev.filter((subscription) => subscription.id !== subscriptionId))
    fetchConvertedSummary()

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
      <SummaryCards subscriptions={subscriptions} convertedSummary={convertedSummary} />

      <div className="layout-grid">
        <AddSubscriptionForm onCreate={handleCreateSubscription} />

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
