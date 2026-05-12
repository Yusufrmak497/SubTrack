/**
 * SubscriptionCard.test.jsx — Unit tests for SubscriptionCard component
 *
 * Tests:
 *  - Renders service name, category, billing cycle, amount
 *  - Renders monthly estimate
 *  - Renders next payment date
 *  - Tags rendered correctly (empty / with tags)
 *  - Upcoming badge shown when upcoming_payment is true
 *  - Inactive label shown when is_active is false
 *  - Remove button triggers onDelete with correct id
 *  - event.stopPropagation prevents card selection on delete
 *  - Card click triggers onSelect with subscription object
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import SubscriptionCard from '../../components/SubscriptionCard'

const BASE_SUB = {
  id: 42,
  service_name: 'Netflix',
  category: 'Entertainment',
  billing_cycle: 'Monthly',
  amount: 15.99,
  estimated_monthly_amount: 15.99,
  next_payment_date: '2026-05-15',
  is_active: true,
  upcoming_payment: true,
  days_until_payment: 5,
  tags: [],
}

function renderCard(overrides = {}, handlers = {}) {
  const sub = { ...BASE_SUB, ...overrides }
  const onDelete = handlers.onDelete ?? vi.fn()
  const onSelect = handlers.onSelect ?? vi.fn()
  return { sub, onDelete, onSelect, ...render(
    <SubscriptionCard subscription={sub} onDelete={onDelete} onSelect={onSelect} />,
  ) }
}

describe('SubscriptionCard', () => {
  it('renders the service name', () => {
    renderCard()
    expect(screen.getByText('Netflix')).toBeInTheDocument()
  })

  it('renders the category', () => {
    renderCard()
    expect(screen.getByText('Entertainment')).toBeInTheDocument()
  })

  it('renders billing cycle and amount', () => {
    renderCard()
    // Use getAllByText since 'Monthly' appears in both billing and monthly estimate
    const billingLine = screen.getAllByText((_, el) =>
      el?.tagName === 'P' && el.textContent.includes('Monthly') && el.textContent.includes('$15.99') && !el.textContent.includes('estimate')
    )
    expect(billingLine.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the estimated monthly amount', () => {
    renderCard()
    expect(screen.getByText(/Monthly estimate:/)).toBeInTheDocument()
  })

  it('renders the next payment date', () => {
    renderCard()
    expect(screen.getByText(/Next payment:/)).toBeInTheDocument()
    expect(screen.getByText(/2026-05-15/)).toBeInTheDocument()
  })

  it('renders a Remove button', () => {
    renderCard()
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  describe('Tags', () => {
    it('does not render tag section when tags array is empty', () => {
      renderCard({ tags: [] })
      expect(screen.queryByText(/^#/)).not.toBeInTheDocument()
    })

    it('renders tags as hash-prefixed spans', () => {
      renderCard({ tags: ['work', 'favorite'] })
      expect(screen.getByText('#work')).toBeInTheDocument()
      expect(screen.getByText('#favorite')).toBeInTheDocument()
    })
  })

  describe('Status indicators', () => {
    it('shows upcoming payment badge when upcoming_payment is true', () => {
      renderCard({ upcoming_payment: true, days_until_payment: 3, is_active: true })
      expect(screen.getByText(/Upcoming payment.*3 day/)).toBeInTheDocument()
    })

    it('does not show upcoming badge when upcoming_payment is false', () => {
      renderCard({ upcoming_payment: false, is_active: true })
      expect(screen.queryByText(/Upcoming payment/)).not.toBeInTheDocument()
    })

    it('shows Inactive label when is_active is false', () => {
      renderCard({ is_active: false })
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })

    it('does not show Inactive label when is_active is true', () => {
      renderCard({ is_active: true })
      expect(screen.queryByText('Inactive')).not.toBeInTheDocument()
    })

    it('does not show upcoming badge when subscription is inactive', () => {
      renderCard({ is_active: false, upcoming_payment: true, days_until_payment: 2 })
      expect(screen.queryByText(/Upcoming payment/)).not.toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('calls onDelete with subscription id when Remove is clicked', () => {
      const onDelete = vi.fn()
      renderCard({}, { onDelete })
      fireEvent.click(screen.getByRole('button', { name: /remove/i }))
      expect(onDelete).toHaveBeenCalledWith(42)
      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('calls onSelect with subscription when card is clicked', () => {
      const onSelect = vi.fn()
      const { sub } = renderCard({}, { onSelect })
      fireEvent.click(screen.getByRole('article'))
      expect(onSelect).toHaveBeenCalledWith(sub)
    })

    it('does not call onSelect when Remove button is clicked (stopPropagation)', () => {
      const onSelect = vi.fn()
      renderCard({}, { onSelect })
      fireEvent.click(screen.getByRole('button', { name: /remove/i }))
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('CSS class assignment', () => {
    it('applies "upcoming" class when upcoming_payment is true', () => {
      renderCard({ upcoming_payment: true, is_active: true })
      const article = screen.getByRole('article')
      expect(article.className).toContain('upcoming')
    })

    it('applies "inactive-card" class when is_active is false', () => {
      renderCard({ is_active: false })
      const article = screen.getByRole('article')
      expect(article.className).toContain('inactive-card')
    })
  })
})
