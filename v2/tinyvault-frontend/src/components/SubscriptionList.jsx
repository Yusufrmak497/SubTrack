import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

import AddSubscriptionForm from './AddSubscriptionForm'
import SubscriptionCard from './SubscriptionCard'
import SubscriptionDetail from './SubscriptionDetail'
import SummaryCards from './SummaryCards'
import CategoryChart from './CategoryChart'
import './SubscriptionList.css'

const ALL_CATEGORIES = ['All', 'Entertainment', 'Music', 'Productivity', 'Cloud', 'Education', 'Finance']

function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState([])
  const [convertedSummary, setConvertedSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('service_name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selectedSubscription, setSelectedSubscription] = useState(null)
  const containerRef = useRef(null)

  useGSAP(() => {
    if (subscriptions.length > 0) {
      gsap.from(".subscription-card", {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "power2.out",
        clearProps: "all"
      })
    }
  }, { scope: containerRef, dependencies: [subscriptions] })

  const fetchSubscriptions = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory !== 'All') params.append('category', selectedCategory)
      params.append('sort_by', sortBy)
      params.append('sort_order', sortOrder)

      const response = await fetch(`http://localhost:8000/subscriptions?${params.toString()}`)
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
    // Re-fetch when sorting/filtering changes
    fetchSubscriptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, sortBy, sortOrder])

  useEffect(() => {
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
      toast.error('Could not add subscription.')
      return
    }

    toast.success('Subscription added successfully!')
    fetchSubscriptions()
    fetchConvertedSummary()
  }

  const handleDeleteSubscription = async (subscriptionId) => {
    const response = await fetch(`http://localhost:8000/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      toast.error('Could not delete subscription.')
      return
    }

    toast.success('Subscription removed.')
    fetchSubscriptions()
    fetchConvertedSummary()

    if (selectedSubscription?.id === subscriptionId) {
      setSelectedSubscription(null)
    }
  }

  const handleUpdateSubscription = async (subscriptionId, payload) => {
    const response = await fetch(`http://localhost:8000/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      toast.error('Could not update subscription.')
      return
    }

    toast.success('Subscription updated!')
    fetchSubscriptions()
    fetchConvertedSummary()
    
    // Refresh the selected subscription details
    const updatedSub = await response.json()
    setSelectedSubscription(updatedSub)
  }

  return (
    <section>
      <SummaryCards subscriptions={subscriptions} convertedSummary={convertedSummary} />

      {subscriptions.length > 0 && <CategoryChart subscriptions={subscriptions} />}

      <div className="layout-grid">
        <AddSubscriptionForm onCreate={handleCreateSubscription} />

        <div className="panel">
          <h3>Filters & Sorting</h3>
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
              {ALL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filters" style={{ marginTop: '0.8rem' }}>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="service_name">Sort by Name</option>
              <option value="amount">Sort by Price</option>
              <option value="next_payment_date">Sort by Next Payment</option>
              <option value="created_at">Sort by Created Date</option>
            </select>

            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="asc">Ascending order</option>
              <option value="desc">Descending order</option>
            </select>
          </div>
        </div>
      </div>

      {loading && subscriptions.length === 0 ? (
        <p className="state-text">Loading subscriptions...</p>
      ) : error ? (
        <div className="panel state-error">
          <p>{error}</p>
          <button onClick={fetchSubscriptions}>Retry</button>
        </div>
      ) : subscriptions.length === 0 ? (
        <p className="state-text">No subscriptions found.</p>
      ) : (
        <div className="subscription-grid" ref={containerRef}>
          {subscriptions.map((subscription) => (
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
        onUpdate={handleUpdateSubscription}
        onClose={() => setSelectedSubscription(null)}
      />
    </section>
  )
}

export default SubscriptionList
