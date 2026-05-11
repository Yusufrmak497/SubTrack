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
    <form className="panel form" onSubmit={handleSubmit}>
      <h3>Add New Subscription</h3>

      <input
        name="service_name"
        placeholder="Service name"
        value={formData.service_name}
        onChange={handleChange}
      />

      <select name="category" value={formData.category} onChange={handleChange}>
        <option>Entertainment</option>
        <option>Music</option>
        <option>Productivity</option>
        <option>Cloud</option>
        <option>Education</option>
        <option>Finance</option>
      </select>

      <select name="billing_cycle" value={formData.billing_cycle} onChange={handleChange}>
        <option>Monthly</option>
        <option>Yearly</option>
      </select>

      <input
        name="amount"
        type="number"
        min="0"
        step="0.01"
        placeholder="Amount"
        value={formData.amount}
        onChange={handleChange}
      />

      <input
        name="next_payment_date"
        type="date"
        value={formData.next_payment_date}
        onChange={handleChange}
      />

      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: formData.tags.length ? '0.4rem' : 0 }}>
          {formData.tags.map((tag) => (
            <span key={tag} style={{ background: 'rgba(79,70,229,0.12)', color: 'var(--primary)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              #{tag}
              <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, fontSize: '0.85rem' }}>×</button>
            </span>
          ))}
        </div>
        <input
          placeholder="Add tag, press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
        />
      </div>

      <button type="submit" className="primary-btn" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add Subscription'}
      </button>
    </form>
  )
}

export default AddSubscriptionForm
