import { useState } from 'react'

const initialForm = {
  service_name: '',
  category: 'Entertainment',
  billing_cycle: 'Monthly',
  amount: '',
  next_payment_date: '',
}

function AddSubscriptionForm({ onCreate }) {
  const [formData, setFormData] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.service_name || !formData.category || !formData.amount || !formData.next_payment_date) {
      alert('Please fill all fields.')
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

      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add Subscription'}
      </button>
    </form>
  )
}

export default AddSubscriptionForm
