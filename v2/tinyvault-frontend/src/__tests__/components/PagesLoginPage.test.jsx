/**
 * PagesLoginPage.test.jsx — Tests for src/pages/LoginPage.jsx (full 2FA login page)
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import LoginPage from '../../pages/LoginPage'
import { server } from '../setup/msw-handlers'

function renderLogin(onLogin = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
        <Route path="/app" element={<div>Dashboard</div>} />
        <Route path="/admin" element={<div>Admin</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('pages/LoginPage', () => {
  describe('Rendering', () => {
    it('renders Sign In heading', () => {
      renderLogin()
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    })

    it('renders username input', () => {
      renderLogin()
      expect(screen.getByPlaceholderText('username')).toBeInTheDocument()
    })

    it('renders password input', () => {
      renderLogin()
      expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
    })

    it('renders Sign In button', () => {
      renderLogin()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('renders social login links', () => {
      renderLogin()
      expect(screen.getByText(/google/i)).toBeInTheDocument()
      expect(screen.getByText(/github/i)).toBeInTheDocument()
    })

    it('renders register link', () => {
      renderLogin()
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    })
  })

  describe('Successful login', () => {
    it('redirects user to /app', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('username'), 'demo_user')
      await user.type(screen.getByPlaceholderText('••••••'), 'user123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
    })

    it('redirects admin to /admin', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('••••••'), 'admin123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument())
    })

    it('stores token and role in localStorage', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('username'), 'demo_user')
      await user.type(screen.getByPlaceholderText('••••••'), 'user123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeTruthy()
        expect(localStorage.getItem('role')).toBe('user')
      })
    })

    it('calls onLogin with token and role', async () => {
      const onLogin = vi.fn()
      const user = userEvent.setup()
      renderLogin(onLogin)

      await user.type(screen.getByPlaceholderText('username'), 'demo_user')
      await user.type(screen.getByPlaceholderText('••••••'), 'user123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(onLogin).toHaveBeenCalledWith(expect.any(String), 'user'))
    })
  })

  describe('Failed login', () => {
    it('shows error on wrong credentials', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('••••••'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByText(/login failed|incorrect/i)).toBeInTheDocument())
    })

    it('shows rate limit error on 429', async () => {
      server.use(
        http.post('http://localhost:8000/auth/login', () =>
          HttpResponse.json({ detail: 'Rate limited' }, { status: 429 })
        )
      )
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('••••••'), 'admin123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByText(/too many/i)).toBeInTheDocument())
    })

    it('shows connection error on network failure', async () => {
      server.use(
        http.post('http://localhost:8000/auth/login', () => HttpResponse.error())
      )
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('••••••'), 'admin123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByText(/could not connect/i)).toBeInTheDocument())
    })
  })

  describe('2FA flow', () => {
    beforeEach(() => {
      server.use(
        http.post('http://localhost:8000/auth/login', () =>
          HttpResponse.json({
            requires_2fa: true,
            temp_token: 'temp.jwt.token',
            methods: { totp: true, recovery_code: false, security_question: false, question_text: null },
          })
        )
      )
    })

    it('shows 2FA step when requires_2fa is true', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('••••••'), 'admin123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument())
    })

    it('submits 2FA code and logs in on success', async () => {
      server.use(
        http.post('http://localhost:8000/auth/2fa/verify', () =>
          HttpResponse.json({ access_token: 'mock.jwt.token', token_type: 'bearer', role: 'user', username: 'admin_rojhat' })
        )
      )
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('••••••'), 'admin123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => screen.getByText(/two-factor/i))
      await user.type(screen.getByPlaceholderText('123456'), '123456')
      await user.click(screen.getByRole('button', { name: /verify/i }))

      await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
    })

    it('shows error on invalid 2FA code', async () => {
      server.use(
        http.post('http://localhost:8000/auth/2fa/verify', () =>
          HttpResponse.json({ detail: 'Invalid 2FA code' }, { status: 400 })
        )
      )
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('••••••'), 'admin123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => screen.getByText(/two-factor/i))
      await user.type(screen.getByPlaceholderText('123456'), '000000')
      await user.click(screen.getByRole('button', { name: /verify/i }))

      await waitFor(() => expect(screen.getByText(/invalid 2fa code/i)).toBeInTheDocument())
    })
  })

  describe('Loading state', () => {
    it('shows Processing... and disables button while loading', async () => {
      server.use(
        http.post('http://localhost:8000/auth/login', async () => {
          await new Promise(r => setTimeout(r, 100))
          return HttpResponse.json({ access_token: 'tok', token_type: 'bearer', role: 'user', username: 'u' })
        })
      )
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('username'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('••••••'), 'admin123')
      user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /processing/i })
        expect(btn).toBeDisabled()
      })
    })
  })
})
