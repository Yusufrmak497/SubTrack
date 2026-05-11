/**
 * SubscriptionList.test.jsx — Integration tests for SubscriptionList
 *
 * These are integration tests because SubscriptionList fetches from the API,
 * manages multiple child components, and handles complex state transitions.
 *
 * API calls are intercepted by MSW (configured in setup/msw-handlers.js).
 *
 * Tests:
 *  - Loading state on initial render
 *  - Subscription cards rendered after data loads
 *  - Error state when API fails
 *  - 401 triggers onUnauthorized callback
 *  - Search input triggers re-fetch
 *  - Category filter triggers re-fetch
 *  - Sort controls trigger re-fetch
 *  - Add form onCreate creates a subscription
 *  - Delete removes a card
 *  - Clicking card opens detail modal
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import SubscriptionList from '../../components/SubscriptionList'
import { server, MOCK_TOKEN, MOCK_SUBSCRIPTIONS } from '../setup/msw-handlers.js'
import toast from 'react-hot-toast'

function renderList(tokenOverride = MOCK_TOKEN, onUnauthorized = vi.fn()) {
  return render(
    <SubscriptionList token={tokenOverride} onUnauthorized={onUnauthorized} />,
  )
}

describe('SubscriptionList', () => {
  describe('Initial load', () => {
    it('shows loading state before data arrives', async () => {
      server.use(
        http.get('http://localhost:8000/subscriptions', async () => {
          await new Promise((r) => setTimeout(r, 100))
          return HttpResponse.json([])
        }),
      )
      renderList()
      expect(screen.getByText(/loading subscriptions/i)).toBeInTheDocument()
    })

    it('renders subscription cards after data loads', async () => {
      renderList()
      await waitFor(() => {
        expect(screen.getByText('Netflix')).toBeInTheDocument()
        expect(screen.getByText('Spotify')).toBeInTheDocument()
      })
    })

    it('shows no subscriptions message when list is empty', async () => {
      server.use(
        http.get('http://localhost:8000/subscriptions', () =>
          HttpResponse.json([]),
        ),
      )
      renderList()
      await waitFor(() => {
        expect(screen.getByText(/no subscriptions found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error handling', () => {
    it('shows error panel when API fails', async () => {
      server.use(
        http.get('http://localhost:8000/subscriptions', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 }),
        ),
      )
      renderList()
      await waitFor(() => {
        expect(screen.getByText(/failed to load|is API running/i)).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      server.use(
        http.get('http://localhost:8000/subscriptions', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 }),
        ),
      )
      renderList()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('calls onUnauthorized when 401 is returned', async () => {
      const onUnauthorized = vi.fn()
      server.use(
        http.get('http://localhost:8000/subscriptions', () =>
          HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        ),
      )
      renderList(MOCK_TOKEN, onUnauthorized)
      await waitFor(() => {
        expect(onUnauthorized).toHaveBeenCalled()
      })
    })
  })

  describe('Filters and sorting UI', () => {
    it('renders search input', async () => {
      renderList()
      await waitFor(() => screen.getByText('Netflix'))
      expect(
        screen.getByPlaceholderText(/search subscriptions/i),
      ).toBeInTheDocument()
    })

    it('renders category filter chips', async () => {
      renderList()
      await waitFor(() => screen.getByText('Netflix'))
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'Entertainment' }).length).toBeGreaterThan(0)
    })

    it('renders sort by chips', async () => {
      renderList()
      await waitFor(() => screen.getByText('Netflix'))
      expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Price' })).toBeInTheDocument()
    })

    it('triggers re-fetch when search term changes', async () => {
      const user = userEvent.setup()
      let fetchCount = 0

      server.use(
        http.get('http://localhost:8000/subscriptions', () => {
          fetchCount++
          return HttpResponse.json(MOCK_SUBSCRIPTIONS)
        }),
      )

      renderList()
      await waitFor(() => screen.getByText('Netflix'))

      const initialCount = fetchCount
      await user.type(
        screen.getByPlaceholderText(/search subscriptions/i),
        'Netflix',
      )

      await waitFor(() => {
        expect(fetchCount).toBeGreaterThan(initialCount)
      })
    })

    it('triggers re-fetch when category is changed', async () => {
      const user = userEvent.setup()
      let fetchCount = 0

      server.use(
        http.get('http://localhost:8000/subscriptions', () => {
          fetchCount++
          return HttpResponse.json(MOCK_SUBSCRIPTIONS)
        }),
      )

      renderList()
      await waitFor(() => screen.getByText('Netflix'))

      const initialCount = fetchCount
      // 'All' button only exists in the filter panel — use its parent to scope
      const filterChips = screen.getByRole('button', { name: 'All' }).closest('.category-chips')
      await user.click(within(filterChips).getByRole('button', { name: 'Entertainment' }))

      await waitFor(() => {
        expect(fetchCount).toBeGreaterThan(initialCount)
      })
    })
  })

  describe('SummaryCards integration', () => {
    it('renders summary cards section', async () => {
      renderList()
      await waitFor(() => {
        expect(screen.getByText('Active Subscriptions')).toBeInTheDocument()
        expect(screen.getByText('Estimated Monthly Total')).toBeInTheDocument()
      })
    })
  })

  describe('CRUD and interactions', () => {
    it('handles creating a new subscription', async () => {
      const user = userEvent.setup()
      const { container } = renderList()
      await waitFor(() => screen.getByText('Netflix'))

      // Fill form
      await user.type(screen.getByPlaceholderText(/netflix|service name/i), 'Disney+')
      await user.type(screen.getByPlaceholderText('0.00'), '10')
      
      const dateEl = container.querySelector('input[name="next_payment_date"]')
      await user.type(dateEl, '2026-06-01')

      await user.click(screen.getByRole('button', { name: /add subscription/i }))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/added/i))
      })
    })

    it('handles deleting a subscription', async () => {
      const user = userEvent.setup()
      renderList()
      await waitFor(() => screen.getByText('Netflix'))

      // Use specific card's delete button
      const netflixCard = screen.getByText('Netflix').closest('.subscription-card')
      const deleteBtn = within(netflixCard).getByRole('button', { name: /remove/i })
      await user.click(deleteBtn)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/removed/i))
      })
    })

    it('handles updating a subscription from detail modal', async () => {
      const user = userEvent.setup()
      renderList()
      await waitFor(() => screen.getByText('Netflix'))

      // Open modal — click the card article, not the service link (which has stopPropagation)
      const netflixCard = screen.getByText('Netflix').closest('.subscription-card')
      await user.click(netflixCard)
      await waitFor(() => screen.getByText('SubTrack History'))

      // Edit
      await user.click(screen.getByRole('button', { name: /edit/i }))
      const amountInput = screen.getByDisplayValue('15.99')
      await user.clear(amountInput)
      await user.type(amountInput, '19.99')
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/updated/i))
      })
    })

    it('updates sort parameters', async () => {
      const user = userEvent.setup()
      renderList()
      await waitFor(() => screen.getByText('Netflix'))

      await user.click(screen.getByRole('button', { name: 'Price' }))

      const sortOrderBtn = screen.getByRole('button', { name: /asc|desc/i })
      await user.click(sortOrderBtn)
      expect(sortOrderBtn.textContent).toMatch(/desc/i)
    })

    it('closes the detail modal', async () => {
      const user = userEvent.setup()
      renderList()
      await waitFor(() => screen.getByText('Netflix'))

      // Open — click the card article, not the service link (which has stopPropagation)
      const netflixCard2 = screen.getByText('Netflix').closest('.subscription-card')
      await user.click(netflixCard2)
      await waitFor(() => screen.getByText('SubTrack History'))

      // Close
      await user.click(screen.getByRole('button', { name: /close/i }))
      await waitFor(() => {
        expect(screen.queryByText('SubTrack History')).not.toBeInTheDocument()
      })
    })
  })
})
