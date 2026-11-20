import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import RegisterPage from '../../pages/RegisterPage'
import { server } from '../setup/msw-handlers'

function renderRegister(onLogin = vi.fn()) {
  return render(
    <MemoryRouter>
      <RegisterPage onLogin={onLogin} />
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  describe('Rendering', () => {
    it('renders Create Account heading', () => {
      renderRegister()
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    })

    it('renders username input', () => {
      renderRegister()
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument()
    })

    it('renders email input', () => {
      renderRegister()
      expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument()
    })

    it('renders password input', () => {
      renderRegister()
      expect(screen.getByPlaceholderText(/min 6 characters/i)).toBeInTheDocument()
    })

    it('renders Sign Up button', () => {
      renderRegister()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('renders Sign In link', () => {
      renderRegister()
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
    })

    it('renders social login buttons', () => {
      renderRegister()
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument()
      expect(screen.getByText(/continue with github/i)).toBeInTheDocument()
    })
  })

  describe('Successful registration', () => {
    it('calls onLogin after successful registration and login', async () => {
      // After register, it auto-logins with the registered username/password
      // MSW login handler checks specific accounts — so we mock login to succeed
      server.use(
        http.post('http://localhost:8000/auth/login', () =>
          HttpResponse.json({ access_token: 'mock.jwt.token', token_type: 'bearer', role: 'user', username: 'newuser123' })
        )
      )
      const onLogin = vi.fn()
      const user = userEvent.setup()
      renderRegister(onLogin)

      await user.type(screen.getByPlaceholderText(/username/i), 'newuser123')
      await user.type(screen.getByPlaceholderText(/example@email.com/i), 'new@test.com')
      await user.type(screen.getByPlaceholderText(/min 6 characters/i), 'admin123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => expect(onLogin).toHaveBeenCalled())
    })
  })

  describe('Failed registration', () => {
    it('shows error when username is taken', async () => {
      const user = userEvent.setup()
      renderRegister()

      await user.type(screen.getByPlaceholderText(/username/i), 'existing_user')
      await user.type(screen.getByPlaceholderText(/example@email.com/i), 'x@test.com')
      await user.type(screen.getByPlaceholderText(/min 6 characters/i), 'pass123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => expect(screen.getByText(/username already taken|registration failed/i)).toBeInTheDocument())
    })

    it('shows error on network failure', async () => {
      server.use(
        http.post('http://localhost:8000/auth/register', () => HttpResponse.error())
      )
      const user = userEvent.setup()
      renderRegister()

      await user.type(screen.getByPlaceholderText(/username/i), 'someuser')
      await user.type(screen.getByPlaceholderText(/example@email.com/i), 's@test.com')
      await user.type(screen.getByPlaceholderText(/min 6 characters/i), 'pass123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => expect(screen.getByText(/could not connect/i)).toBeInTheDocument())
    })
  })

  describe('Loading state', () => {
    it('shows Creating account... while loading', async () => {
      server.use(
        http.post('http://localhost:8000/auth/register', async () => {
          await new Promise(r => setTimeout(r, 100))
          return HttpResponse.json({ id: 1, username: 'u', email: 'e@e.com', role: 'user', is_active: true, created_at: '' }, { status: 201 })
        })
      )
      const user = userEvent.setup()
      renderRegister()

      await user.type(screen.getByPlaceholderText(/username/i), 'testuser')
      await user.type(screen.getByPlaceholderText(/example@email.com/i), 't@test.com')
      await user.type(screen.getByPlaceholderText(/min 6 characters/i), 'pass123')
      user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => expect(screen.getByText(/creating account/i)).toBeInTheDocument())
    })
  })
})
