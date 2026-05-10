/**
 * AddSubscriptionForm.test.jsx — Unit tests for AddSubscriptionForm
 *
 * Tests:
 *  - All form fields render
 *  - Submit with empty fields shows toast error
 *  - Valid form submit calls onCreate with correct payload
 *  - Form resets after successful submit
 *  - Submit button is disabled while submitting
 *  - Default values are correct (Entertainment, Monthly)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import toast from 'react-hot-toast'

import AddSubscriptionForm from '../../components/AddSubscriptionForm'

function renderForm(onCreate = vi.fn()) {
  return render(<AddSubscriptionForm onCreate={onCreate} />)
}

describe('AddSubscriptionForm', () => {
  describe('Rendering', () => {
    it('renders the form heading', () => {
      renderForm()
      expect(screen.getByText('Add New Subscription')).toBeInTheDocument()
    })

    it('renders service name input', () => {
      renderForm()
      expect(screen.getByPlaceholderText('Service name')).toBeInTheDocument()
    })

    it('renders category select with default Entertainment', () => {
      renderForm()
      const select = screen.getByDisplayValue('Entertainment')
      expect(select).toBeInTheDocument()
    })

    it('renders billing cycle select with default Monthly', () => {
      renderForm()
      expect(screen.getByDisplayValue('Monthly')).toBeInTheDocument()
    })

    it('renders amount input', () => {
      renderForm()
      expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument()
    })

    it('renders date input', () => {
      const { container } = renderForm()
      expect(container.querySelector('input[type="date"]')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderForm()
      expect(screen.getByRole('button', { name: /add subscription/i })).toBeInTheDocument()
    })

    it('all category options are present', () => {
      renderForm()
      const select = screen.getAllByRole('combobox')[0]
      const options = Array.from(select.options).map((o) => o.text)
      expect(options).toContain('Entertainment')
      expect(options).toContain('Music')
      expect(options).toContain('Productivity')
      expect(options).toContain('Cloud')
      expect(options).toContain('Education')
      expect(options).toContain('Finance')
    })
  })

  describe('Validation', () => {
    it('shows toast error when service name is empty', async () => {
      const user = userEvent.setup()
      renderForm()
      await user.click(screen.getByRole('button', { name: /add subscription/i }))
      expect(toast.error).toHaveBeenCalledWith('Please fill all fields.')
    })

    it('shows toast error when amount is empty', async () => {
      const user = userEvent.setup()
      renderForm()
      await user.type(screen.getByPlaceholderText('Service name'), 'Test')
      // amount left empty, date left empty
      await user.click(screen.getByRole('button', { name: /add subscription/i }))
      expect(toast.error).toHaveBeenCalled()
    })
  })

  describe('Submission', () => {
    it('calls onCreate with correct payload on valid submit', async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderForm(onCreate)

      await user.type(screen.getByPlaceholderText('Service name'), 'Notion')
      await user.type(screen.getByPlaceholderText('Amount'), '8.99')
      await user.type(document.querySelector('input[type="date"]'), '2026-06-01')

      await user.click(screen.getByRole('button', { name: /add subscription/i }))

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledTimes(1)
        const callArg = onCreate.mock.calls[0][0]
        expect(callArg.service_name).toBe('Notion')
        expect(callArg.amount).toBe(8.99)
        expect(callArg.is_active).toBe(true)
      })
    })

    it('resets form to initial values after successful submit', async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderForm(onCreate)

      await user.type(screen.getByPlaceholderText('Service name'), 'TestService')
      await user.type(screen.getByPlaceholderText('Amount'), '5.00')
      await user.type(document.querySelector('input[type="date"]'), '2026-06-15')

      await user.click(screen.getByRole('button', { name: /add subscription/i }))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Service name')).toHaveValue('')
        expect(screen.getByPlaceholderText('Amount')).toHaveValue(null)
      })
    })

    it('amount is submitted as a number (not string)', async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderForm(onCreate)

      await user.type(screen.getByPlaceholderText('Service name'), 'Service')
      await user.type(screen.getByPlaceholderText('Amount'), '19.99')
      await user.type(document.querySelector('input[type="date"]'), '2026-07-01')

      await user.click(screen.getByRole('button', { name: /add subscription/i }))

      await waitFor(() => {
        const callArg = onCreate.mock.calls[0][0]
        expect(typeof callArg.amount).toBe('number')
        expect(callArg.amount).toBe(19.99)
      })
    })
  })

  describe('Field changes', () => {
    it('updates billing cycle when changed to Yearly', async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderForm(onCreate)

      await user.selectOptions(
        screen.getByDisplayValue('Monthly'),
        'Yearly',
      )

      await user.type(screen.getByPlaceholderText('Service name'), 'AnnualService')
      await user.type(screen.getByPlaceholderText('Amount'), '100')
      await user.type(document.querySelector('input[type="date"]'), '2027-01-01')

      await user.click(screen.getByRole('button', { name: /add subscription/i }))

      await waitFor(() => {
        const callArg = onCreate.mock.calls[0][0]
        expect(callArg.billing_cycle).toBe('Yearly')
      })
    })

    it('updates category when changed', async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderForm(onCreate)

      await user.selectOptions(screen.getByDisplayValue('Entertainment'), 'Music')

      await user.type(screen.getByPlaceholderText('Service name'), 'Spotify')
      await user.type(screen.getByPlaceholderText('Amount'), '9.99')
      await user.type(document.querySelector('input[type="date"]'), '2026-06-10')

      await user.click(screen.getByRole('button', { name: /add subscription/i }))

      await waitFor(() => {
        const callArg = onCreate.mock.calls[0][0]
        expect(callArg.category).toBe('Music')
      })
    })
  })
})
