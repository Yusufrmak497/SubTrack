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

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ALL_CATEGORIES = ['All', 'Entertainment', 'Music', 'Productivity', 'Cloud', 'Education', 'Finance']

function SubscriptionList({ token, role, onUnauthorized }) {
  const isViewer = role === 'viewer'
  const authHeader = () => ({ Authorization: `Bearer ${token}` })
  const [subscriptions, setSubscriptions] = useState([])
  const [convertedSummary, setConvertedSummary] = useState(null)
  const [currency, setCurrency] = useState('TRY')
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

      const response = await fetch(`${API}/subscriptions?${params.toString()}`, {
        headers: authHeader(),
      })
      if (response.status === 401) { onUnauthorized(); return; }
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

  const fetchConvertedSummary = async (targetCurrency) => {
    try {
      const response = await fetch(
        `${API}/subscriptions/summary/converted?currency=${targetCurrency}`,
        { headers: authHeader() },
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

  const handleCurrencyChange = async (newCurrency) => {
    setCurrency(newCurrency)
    fetchConvertedSummary(newCurrency)
    try {
      await fetch(`${API}/auth/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ currency: newCurrency }),
      })
    } catch {
      // preference save failure is non-critical
    }
  }

  useEffect(() => {
    fetchSubscriptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, sortBy, sortOrder])

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API}/auth/preferences`, { headers: authHeader() })
        if (res.ok) {
          const pref = await res.json()
          setCurrency(pref.currency)
          fetchConvertedSummary(pref.currency)
          return
        }
      } catch { /* fall through */ }
      fetchConvertedSummary('TRY')
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateSubscription = async (payload) => {
    const response = await fetch(`${API}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(payload),
    })

    if (response.status === 401) { onUnauthorized(); return; }
    if (!response.ok) {
      toast.error('Could not add subscription.')
      return
    }

    toast.success('Subscription added successfully!')
    fetchSubscriptions()
    fetchConvertedSummary(currency)
  }

  const handleDeleteSubscription = async (subscriptionId) => {
    const response = await fetch(`${API}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: authHeader(),
    })

    if (response.status === 401) { onUnauthorized(); return; }
    if (!response.ok) {
      toast.error('Could not delete subscription.')
      return
    }

    toast.success('Subscription removed.')
    fetchSubscriptions()
    fetchConvertedSummary(currency)

    if (selectedSubscription?.id === subscriptionId) {
      setSelectedSubscription(null)
    }
  }

  const handleUpdateSubscription = async (subscriptionId, payload) => {
    const response = await fetch(`${API}/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(payload),
    })

    if (response.status === 401) { onUnauthorized(); return; }
    if (!response.ok) {
      toast.error('Could not update subscription.')
      return
    }

    toast.success('Subscription updated!')
    fetchSubscriptions()
    fetchConvertedSummary(currency)
    
    // Refresh the selected subscription details
    const updatedSub = await response.json()
    setSelectedSubscription(updatedSub)
  }

  return (
    <section>
      {isViewer && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '10px', padding: '0.75rem 1.1rem', marginBottom: '1rem', fontSize: '0.88rem', color: '#713f12', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>👁</span>
          <strong>Viewer mode:</strong> You can view subscriptions but cannot make changes.
        </div>
      )}
      <SummaryCards subscriptions={subscriptions} convertedSummary={convertedSummary} currency={currency} onCurrencyChange={handleCurrencyChange} />

      {subscriptions.length > 0 && <CategoryChart subscriptions={subscriptions} />}

      <div className="layout-grid">
        {!isViewer && <AddSubscriptionForm onCreate={handleCreateSubscription} />}

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
              onDelete={isViewer ? null : handleDeleteSubscription}
              onSelect={setSelectedSubscription}
            />
          ))}
        </div>
      )}

      <SubscriptionDetail
        subscription={selectedSubscription}
        onUpdate={isViewer ? null : handleUpdateSubscription}
        onClose={() => setSelectedSubscription(null)}
        token={token}
      />
    </section>
  )
}

export default SubscriptionList
