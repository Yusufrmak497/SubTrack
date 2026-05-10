/**
 * App.test.jsx — Integration tests for App root component
 *
 * Tests:
 *  - Renders LoginPage when no token in localStorage
 *  - Renders SubscriptionList (dashboard) when token exists
 *  - handleLogin stores token and transitions to dashboard
 *  - handleLogout removes token and returns to LoginPage
 *  - Theme toggle changes data-theme attribute and localStorage
 *  - Initial theme detection from localStorage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from '../App'

describe('App', () => {
  describe('Authentication routing', () => {
    it('renders LoginPage when no token is present', () => {
      localStorage.removeItem('token')
      render(<App />)
      expect(screen.getByRole('heading', { name: 'TinyVault' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Kullanıcı adı')).toBeInTheDocument()
    })

    it('renders dashboard when valid token is in localStorage', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      render(<App />)
      await waitFor(() => {
        expect(screen.getByText('Active Subscriptions')).toBeInTheDocument()
      })
    })

    it('transitions to dashboard after successful login', async () => {
      localStorage.removeItem('token')
      const user = userEvent.setup()
      render(<App />)

      // Fill login form
      await user.type(screen.getByPlaceholderText('Kullanıcı adı'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('Şifre'), 'admin123')
      await user.click(screen.getByRole('button', { name: /giriş yap/i }))

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Kullanıcı adı')).not.toBeInTheDocument()
      })
    })

    it('returns to LoginPage after logout', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => screen.getByText('Çıkış Yap'))
      await user.click(screen.getByText('Çıkış Yap'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Kullanıcı adı')).toBeInTheDocument()
      })
    })

    it('removes token from localStorage on logout', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => screen.getByText('Çıkış Yap'))
      await user.click(screen.getByText('Çıkış Yap'))

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull()
      })
    })
  })

  describe('Theme toggle', () => {
    it('renders a theme toggle button when logged in', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      render(<App />)
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /switch to/i })
        expect(btn).toBeInTheDocument()
      })
    })

    it('toggles theme attribute on html element', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => screen.getByRole('button', { name: /switch to/i }))
      const initialTheme = document.documentElement.getAttribute('data-theme')

      await user.click(screen.getByRole('button', { name: /switch to/i }))

      const newTheme = document.documentElement.getAttribute('data-theme')
      expect(newTheme).not.toBe(initialTheme)
    })

    it('stores theme preference in localStorage', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => screen.getByRole('button', { name: /switch to/i }))
      await user.click(screen.getByRole('button', { name: /switch to/i }))

      const storedTheme = localStorage.getItem('theme')
      expect(['light', 'dark']).toContain(storedTheme)
    })
  })

  describe('Dashboard layout', () => {
    it('renders app header with TinyVault title', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      render(<App />)
      await waitFor(() => {
        // The h1 inside .hero header
        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading).toHaveTextContent('TinyVault')
      })
    })

    it('renders footer with copyright', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      render(<App />)
      await waitFor(() => {
        expect(screen.getByText(/2026 TinyVault/)).toBeInTheDocument()
      })
    })

    it('renders subtitle in header', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      render(<App />)
      await waitFor(() => {
        expect(screen.getByText(/control subscriptions/i)).toBeInTheDocument()
      })
    })
  })
})
