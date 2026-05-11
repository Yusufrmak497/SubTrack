import { useState } from 'react'
import toast from 'react-hot-toast'

const initialForm = {
  service_name: '',
  category: 'Entertainment',
  billing_cycle: 'Monthly',
  amount: '',
  next_payment_date: '',
  tags: [],
}

function AddSubscriptionForm({ onCreate }) {
  const [formData, setFormData] = useState(initialForm)
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.service_name || !formData.category || !formData.amount || !formData.next_payment_date) {
      toast.error('Please fill all fields.')
      return
    }

    setSubmitting(true)
    await onCreate({
      ...formData,
      amount: Number(formData.amount),
      is_active: true,
    })
    setSubmitting(false)
    setFormData(initialForm)
    setTagInput('')
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (tag && !formData.tags.includes(tag)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  return (
    <form className="panel add-form" onSubmit={handleSubmit}>
      <div className="add-form-header">
        <span className="add-form-icon">＋</span>
        <h3>New Subscription</h3>
      </div>

      <div className="add-form-field full">
        <label>Service Name</label>
        <input
          name="service_name"
          placeholder="e.g. Netflix, Spotify…"
          value={formData.service_name}
          onChange={handleChange}
        />
      </div>

      <div className="add-form-row">
        <div className="add-form-field">
          <label>Category</label>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option>Entertainment</option>
            <option>Music</option>
            <option>Productivity</option>
            <option>Cloud</option>
            <option>Education</option>
            <option>Finance</option>
          </select>
        </div>

        <div className="add-form-field">
          <label>Billing Cycle</label>
          <select name="billing_cycle" value={formData.billing_cycle} onChange={handleChange}>
            <option>Monthly</option>
            <option>Yearly</option>
          </select>
        </div>
      </div>

      <div className="add-form-row">
        <div className="add-form-field">
          <label>Amount ($)</label>
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
          />
        </div>

        <div className="add-form-field">
          <label>Next Payment</label>
          <input
            name="next_payment_date"
            type="date"
            value={formData.next_payment_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="add-form-field full">
        <label>Tags <span className="add-form-hint">Enter or comma to add</span></label>
        {formData.tags.length > 0 && (
          <div className="tag-chips">
            {formData.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
          </div>
        )}
        <input
          placeholder="work, personal…"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
        />
      </div>

      <button type="submit" className="primary-btn" disabled={submitting}>
        {submitting ? 'Adding…' : 'Add Subscription'}
      </button>
    </form>
  )
}

export default AddSubscriptionForm
