/**
 * SummaryCards.test.jsx — Unit tests for SummaryCards component
 *
 * Tests:
 *  - Renders 4 summary panels
 *  - Active subscription count is correctly displayed
 *  - Monthly total is correctly calculated (Monthly + Yearly mix)
 *  - Upcoming payment count is correct
 *  - Converted total shown when available
 *  - "Unavailable" shown when convertedSummary is null
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import SummaryCards from '../../components/SummaryCards'

const MONTHLY_SUB = {
  id: 1,
  service_name: 'Netflix',
  billing_cycle: 'Monthly',
  amount: 15.99,
  is_active: true,
  upcoming_payment: true,
}

const YEARLY_SUB = {
  id: 2,
  service_name: 'Adobe',
  billing_cycle: 'Yearly',
  amount: 120.0,
  is_active: true,
  upcoming_payment: false,
}

const INACTIVE_SUB = {
  id: 3,
  service_name: 'Paused',
  billing_cycle: 'Monthly',
  amount: 5.0,
  is_active: false,
  upcoming_payment: false,
}

const CONVERTED_SUMMARY = {
  target_currency: 'TRY',
  estimated_monthly_total_converted: 844.35,
}

describe('SummaryCards', () => {
  it('renders all four summary panels', () => {
    render(<SummaryCards subscriptions={[]} convertedSummary={null} />)
    expect(screen.getByText('Active Subscriptions')).toBeInTheDocument()
    expect(screen.getByText('Estimated Monthly Total')).toBeInTheDocument()
    expect(screen.getByText('Due in Next 7 Days')).toBeInTheDocument()
    expect(screen.getByText('Converted Total')).toBeInTheDocument()
  })

  it('shows 0 active subscriptions when list is empty', () => {
    render(<SummaryCards subscriptions={[]} convertedSummary={null} />)
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(1)
  })

  it('counts only active subscriptions', () => {
    render(
      <SummaryCards
        subscriptions={[MONTHLY_SUB, INACTIVE_SUB]}
        convertedSummary={null}
      />,
    )
    // 1 active, 1 inactive → active count card strong should be "1"
    const activeCard = screen.getByText('Active Subscriptions').closest('article')
    expect(activeCard.querySelector('strong').textContent).toBe('1')
  })

  it('calculates monthly total from monthly subscriptions correctly', () => {
    render(
      <SummaryCards subscriptions={[MONTHLY_SUB]} convertedSummary={null} />,
    )
    expect(screen.getByText('$15.99')).toBeInTheDocument()
  })

  it('calculates monthly total dividing yearly by 12', () => {
    // 120.0 / 12 = 10.00
    render(
      <SummaryCards subscriptions={[YEARLY_SUB]} convertedSummary={null} />,
    )
    expect(screen.getByText('$10.00')).toBeInTheDocument()
  })

  it('calculates combined monthly total for mixed billing cycles', () => {
    // 15.99 (monthly) + 120/12=10.00 (yearly) = 25.99
    render(
      <SummaryCards
        subscriptions={[MONTHLY_SUB, YEARLY_SUB]}
        convertedSummary={null}
      />,
    )
    expect(screen.getByText('$25.99')).toBeInTheDocument()
  })

  it('excludes inactive subscriptions from monthly total', () => {
    render(
      <SummaryCards
        subscriptions={[MONTHLY_SUB, INACTIVE_SUB]}
        convertedSummary={null}
      />,
    )
    // Only MONTHLY_SUB (15.99) should be counted
    expect(screen.getByText('$15.99')).toBeInTheDocument()
  })

  it('counts upcoming payments (upcoming_payment: true)', () => {
    render(
      <SummaryCards
        subscriptions={[MONTHLY_SUB, YEARLY_SUB]}
        convertedSummary={null}
      />,
    )
    // MONTHLY_SUB has upcoming_payment: true → Due in Next 7 Days = 1
    const dueCard = screen.getByText('Due in Next 7 Days').closest('article')
    expect(dueCard.querySelector('strong').textContent).toBe('1')
  })

  it('shows Unavailable when convertedSummary is null', () => {
    render(<SummaryCards subscriptions={[]} convertedSummary={null} />)
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })

  it('shows converted total when convertedSummary is provided', () => {
    render(
      <SummaryCards
        subscriptions={[]}
        convertedSummary={CONVERTED_SUMMARY}
      />,
    )
    expect(screen.getByText('TRY 844.35')).toBeInTheDocument()
  })
})
