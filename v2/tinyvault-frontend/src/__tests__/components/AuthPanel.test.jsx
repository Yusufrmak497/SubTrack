import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import AuthPanel from '../../components/AuthPanel'
import { server } from '../setup/msw-handlers'

function renderPanel(onAuthenticated = vi.fn()) {
  return render(<AuthPanel onAuthenticated={onAuthenticated} />)
}

describe('AuthPanel', () => {
  describe('Login mode (default)', () => {
    it('renders Login heading', () => {
      renderPanel()
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    })

    it('renders username/email input', () => {
      renderPanel()
      expect(screen.getByPlaceholderText('Username or email')).toBeInTheDocument()
    })

    it('renders password input', () => {
      renderPanel()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })

    it('renders Login submit button', () => {
      renderPanel()
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    })

    it('shows register switch button', () => {
      renderPanel()
      expect(screen.getByRole('button', { name: /need an account/i })).toBeInTheDocument()
    })

    it('does not render email field in login mode', () => {
      renderPanel()
      expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument()
    })
  })

  describe('Switch to register mode', () => {
    it('switches to Register heading on click', () => {
      renderPanel()
      fireEvent.click(screen.getByRole('button', { name: /need an account/i }))
      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument()
    })

    it('shows email input in register mode', () => {
      renderPanel()
      fireEvent.click(screen.getByRole('button', { name: /need an account/i }))
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    })

    it('shows Register & Login submit button in register mode', () => {
      renderPanel()
      fireEvent.click(screen.getByRole('button', { name: /need an account/i }))
      expect(screen.getByRole('button', { name: 'Register & Login' })).toBeInTheDocument()
    })

    it('shows already have account switch in register mode', () => {
      renderPanel()
      fireEvent.click(screen.getByRole('button', { name: /need an account/i }))
      expect(screen.getByRole('button', { name: /already have an account/i })).toBeInTheDocument()
    })

    it('switches back to login mode', () => {
      renderPanel()
      fireEvent.click(screen.getByRole('button', { name: /need an account/i }))
      fireEvent.click(screen.getByRole('button', { name: /already have an account/i }))
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    })
  })

  describe('Successful login', () => {
    it('calls onAuthenticated with token on success', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'mock.jwt.token', token_type: 'bearer' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const onAuthenticated = vi.fn()
      const user = userEvent.setup()
      renderPanel(onAuthenticated)

      await user.type(screen.getByPlaceholderText('Username or email'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('Password'), 'admin123')
      await user.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith('mock.jwt.token'))
      vi.unstubAllGlobals()
    })
  })

  describe('Failed login', () => {
    it('shows error on wrong credentials', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.type(screen.getByPlaceholderText('Username or email'), 'wronguser')
      await user.type(screen.getByPlaceholderText('Password'), 'wrongpass1')
      await user.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => expect(screen.getByText(/login failed|incorrect/i)).toBeInTheDocument())
    })

    it('shows rate limit error on 429', async () => {
      server.use(
        http.post('http://localhost:8000/auth/login', () =>
          HttpResponse.json({ detail: 'Rate limited' }, { status: 429 })
        )
      )
      const user = userEvent.setup()
      renderPanel()

      await user.type(screen.getByPlaceholderText('Username or email'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('Password'), 'admin123')
      await user.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => expect(screen.getByText(/too many/i)).toBeInTheDocument())
    })

    it('clears error on mode switch', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.type(screen.getByPlaceholderText('Username or email'), 'baduser')
      await user.type(screen.getByPlaceholderText('Password'), 'badpass12')
      await user.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => screen.getByText(/login failed|incorrect/i))
      fireEvent.click(screen.getByRole('button', { name: /need an account/i }))
      expect(screen.queryByText(/login failed|incorrect/i)).not.toBeInTheDocument()
    })
  })

  describe('Loading state', () => {
    it('shows Please wait... while loading', async () => {
      server.use(
        http.post('http://localhost:8000/auth/login', async () => {
          await new Promise(r => setTimeout(r, 100))
          return HttpResponse.json({ access_token: 'tok', token_type: 'bearer' })
        })
      )
      const user = userEvent.setup()
      renderPanel()

      await user.type(screen.getByPlaceholderText('Username or email'), 'admin_rojhat')
      await user.type(screen.getByPlaceholderText('Password'), 'admin123')
      user.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => expect(screen.getByText('Please wait...')).toBeInTheDocument())
    })
  })
})
