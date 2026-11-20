/**
 * App.test.jsx — Integration tests for App routing and auth state.
 *
 * Strategy: App uses BrowserRouter internally.
 * We control the URL with window.history.pushState before rendering.
 *
 * Tests:
 *  - / renders LandingPage when unauthenticated
 *  - /app with token + role=user renders subscription dashboard
 *  - /admin with token + role=admin renders Admin Dashboard
 *  - Logout clears localStorage
 *  - Theme toggle changes data-theme and localStorage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from '../App'

function goTo(path) {
  window.history.pushState({}, '', path)
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    goTo('/')
  })

  describe('Landing page (unauthenticated)', () => {
    it('renders SubTrack on landing page at /', () => {
      render(<App />)
      expect(screen.getAllByText('SubTrack').length).toBeGreaterThan(0)
    })

    it('renders Ücretsiz Başla CTA on landing page', () => {
      render(<App />)
      expect(screen.getAllByRole('button', { name: /get started/i }).length).toBeGreaterThan(0)
    })
  })

  describe('Authenticated /app', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock.jwt.token')
      localStorage.setItem('role', 'user')
      localStorage.setItem('username', 'demo_user')
      goTo('/app')
    })

    it('renders dashboard subscription cards', async () => {
      render(<App />)
      await waitFor(() => {
        expect(screen.getByText('Active Subscriptions')).toBeInTheDocument()
      }, { timeout: 8000 })
    })

    it('renders SubTrack in app header', async () => {
      render(<App />)
      await waitFor(() => {
        expect(screen.getByText('SubTrack')).toBeInTheDocument()
      }, { timeout: 8000 })
    })

    it('renders footer copyright', async () => {
      render(<App />)
      await waitFor(() => {
        expect(screen.getByText(/2026 SubTrack/)).toBeInTheDocument()
      }, { timeout: 8000 })
    })

    it('renders theme toggle button', async () => {
      render(<App />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch to/i })).toBeInTheDocument()
      }, { timeout: 8000 })
    })
  })

  describe('Authenticated /admin', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock.jwt.token')
      localStorage.setItem('role', 'admin')
      localStorage.setItem('username', 'admin_rojhat')
      goTo('/admin')
    })

    it('renders Admin Dashboard heading', async () => {
      render(<App />)
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      }, { timeout: 8000 })
    })

    it('renders admin stat cards', async () => {
      render(<App />)
      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument()
      }, { timeout: 8000 })
    })
  })

  describe('Logout', () => {
    it('removes token and role from localStorage', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      localStorage.setItem('role', 'user')
      localStorage.setItem('username', 'demo_user')
      goTo('/app')

      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => screen.getByRole('button', { name: /sign out/i }))
      await user.click(screen.getByRole('button', { name: /sign out/i }))

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull()
        expect(localStorage.getItem('role')).toBeNull()
      })
    })
  })

  describe('Theme toggle', () => {
    it('toggles data-theme attribute on html element', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      localStorage.setItem('role', 'user')
      localStorage.setItem('username', 'demo_user')
      goTo('/app')

      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => screen.getByRole('button', { name: /switch to/i }))
      const before = document.documentElement.getAttribute('data-theme')
      await user.click(screen.getByRole('button', { name: /switch to/i }))
      expect(document.documentElement.getAttribute('data-theme')).not.toBe(before)
    })

    it('stores theme in localStorage after toggle', async () => {
      localStorage.setItem('token', 'mock.jwt.token')
      localStorage.setItem('role', 'user')
      localStorage.setItem('username', 'demo_user')
      goTo('/app')

      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => screen.getByRole('button', { name: /switch to/i }))
      await user.click(screen.getByRole('button', { name: /switch to/i }))
      expect(['light', 'dark']).toContain(localStorage.getItem('theme'))
    })
  })
})
