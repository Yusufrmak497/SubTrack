/**
 * LoginPage.test.jsx — Unit tests for LoginPage component
 *
 * Tests:
 *  - Form elements render
 *  - Successful login calls onLogin and stores token
 *  - Wrong credentials shows error message
 *  - Network error shows connection error message
 *  - Loading state shows correct button text
 *  - Empty form submit sends request
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import LoginPage from '../../components/LoginPage'
import { server } from '../setup/msw-handlers.js'

function renderLogin(onLogin = vi.fn()) {
  return render(<LoginPage onLogin={onLogin} />)
}

describe('LoginPage', () => {
  describe('Rendering', () => {
    it('renders the TinyVault heading', () => {
      renderLogin()
      expect(screen.getByRole('heading', { name: 'TinyVault' })).toBeInTheDocument()
    })

    it('renders subtitle text', () => {
      renderLogin()
      expect(screen.getByText(/manage your subscriptions/i)).toBeInTheDocument()
    })

    it('renders username input', () => {
      renderLogin()
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
    })

    it('renders password input', () => {
      renderLogin()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderLogin()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('password field is of type password', () => {
      renderLogin()
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
    })

    it('does not render error message initially', () => {
      const { container } = renderLogin()
      expect(container.querySelector('.error-text')).not.toBeInTheDocument()
    })
  })

  describe('Successful login', () => {
    it('calls onLogin with the access token on success', async () => {
      const onLogin = vi.fn()
      const user = userEvent.setup()
      renderLogin(onLogin)

      await user.type(screen.getByPlaceholderText('Username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('Password'), 'admin123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(onLogin).toHaveBeenCalledTimes(1)
        expect(onLogin).toHaveBeenCalledWith(expect.any(String))
      })
    })

    it('stores token in localStorage on success', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('Username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('Password'), 'admin123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeTruthy()
      })
    })
  })

  describe('Failed login', () => {
    it('shows error message when credentials are wrong', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('Username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('Password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/login failed|incorrect|hatalı/i)).toBeInTheDocument()
      })
    })

    it('shows connection error when API is unreachable', async () => {
      // Override handler to simulate network failure
      server.use(
        http.post('http://localhost:8000/auth/login', () => {
          return HttpResponse.error()
        }),
      )

      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('Username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('Password'), 'admin123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/could not connect|sunucuya/i)).toBeInTheDocument()
      })
    })

    it('does not call onLogin on failed request', async () => {
      const onLogin = vi.fn()
      const user = userEvent.setup()
      renderLogin(onLogin)

      await user.type(screen.getByPlaceholderText('Username'), 'wrong')
      await user.type(screen.getByPlaceholderText('Password'), 'wrong')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(onLogin).not.toHaveBeenCalled()
      })
    })
  })

  describe('Loading state', () => {
    it('shows "Signing in..." while waiting for response', async () => {
      // Use a handler that delays response
      server.use(
        http.post('http://localhost:8000/auth/login', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return HttpResponse.json({ access_token: 'token', token_type: 'bearer' })
        }),
      )

      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('Username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('Password'), 'admin123')
      user.click(screen.getByRole('button', { name: /sign in/i }))

      // Check loading state immediately
      await waitFor(() => {
        expect(screen.queryByText('Signing in...')).toBeInTheDocument()
      })
    })

    it('button is disabled during loading', async () => {
      server.use(
        http.post('http://localhost:8000/auth/login', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return HttpResponse.json({ access_token: 'token', token_type: 'bearer' })
        }),
      )

      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('Username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('Password'), 'admin123')
      user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /signing in/i })
        expect(btn).toBeDisabled()
      })
    })
  })
})
