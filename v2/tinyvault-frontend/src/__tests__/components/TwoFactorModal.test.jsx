import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import TwoFactorModal from '../../components/TwoFactorModal'
import { server } from '../setup/msw-handlers'

const TOKEN = 'mock.jwt.token'

function renderModal(props = {}) {
  return render(<TwoFactorModal onClose={vi.fn()} token={TOKEN} {...props} />)
}

// Add 2FA API handlers to MSW
beforeEach(() => {
  server.use(
    http.post('http://localhost:8000/auth/2fa/setup', () =>
      HttpResponse.json({ secret: 'TESTKEY123', provisioning_uri: 'otpauth://totp/SubTrack:test?secret=TESTKEY123&issuer=SubTrack' })
    ),
    http.post('http://localhost:8000/auth/2fa/verify', () =>
      HttpResponse.json({ message: '2FA successfully enabled' })
    ),
    http.delete('http://localhost:8000/auth/2fa/disable', () =>
      HttpResponse.json({ message: '2FA disabled' })
    ),
    http.post('http://localhost:8000/auth/2fa/recovery-codes/generate', () =>
      HttpResponse.json({ codes: ['CODE1111', 'CODE2222', 'CODE3333', 'CODE4444', 'CODE5555', 'CODE6666', 'CODE7777', 'CODE8888', 'CODE9999', 'CODE0000'] })
    ),
    http.post('http://localhost:8000/auth/2fa/security-question/setup', () =>
      HttpResponse.json({ message: 'Security question saved' })
    ),
    http.get('http://localhost:8000/auth/devices', () =>
      HttpResponse.json([{ id: 1, device_name: 'Chrome on Mac', expires_at: '2026-12-01T00:00:00' }])
    ),
    http.delete('http://localhost:8000/auth/devices/:id', () =>
      HttpResponse.json({ message: 'Device revoked' })
    ),
  )
})

describe('TwoFactorModal', () => {
  describe('Rendering', () => {
    it('renders Two-Factor Authentication heading', () => {
      renderModal()
      expect(screen.getByRole('heading', { name: /two-factor authentication/i })).toBeInTheDocument()
    })

    it('renders 4 tabs', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /totp/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /recovery/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /question/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /devices/i })).toBeInTheDocument()
    })

    it('renders close button', () => {
      renderModal()
      expect(screen.getByText('✕')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn()
      renderModal({ onClose })
      fireEvent.click(screen.getByText('✕'))
      expect(onClose).toHaveBeenCalled()
    })

    it('shows TOTP tab content by default', () => {
      renderModal()
      expect(screen.getByText(/start setup/i)).toBeInTheDocument()
    })
  })

  describe('TOTP tab', () => {
    it('shows QR code after setup', async () => {
      renderModal()
      await userEvent.click(screen.getByText(/start setup/i))
      await waitFor(() => expect(screen.getByText(/TESTKEY123/i)).toBeInTheDocument())
    })

    it('shows already enabled state when 2FA is active', async () => {
      server.use(
        http.post('http://localhost:8000/auth/2fa/setup', () =>
          HttpResponse.json({ detail: '2FA is already enabled' }, { status: 400 })
        )
      )
      renderModal()
      await userEvent.click(screen.getByText(/start setup/i))
      await waitFor(() => expect(screen.getByText(/already active/i)).toBeInTheDocument())
    })

    it('shows success state after verify', async () => {
      renderModal()
      await userEvent.click(screen.getByText(/start setup/i))
      await waitFor(() => screen.getByPlaceholderText(/enter 6-digit code/i))
      await userEvent.type(screen.getByPlaceholderText(/enter 6-digit code/i), '123456')
      await userEvent.click(screen.getByText(/verify & enable/i))
      await waitFor(() => expect(screen.getByText(/successfully enabled/i)).toBeInTheDocument())
    })

    it('shows error on invalid code', async () => {
      server.use(
        http.post('http://localhost:8000/auth/2fa/verify', () =>
          HttpResponse.json({ detail: 'Invalid code' }, { status: 400 })
        )
      )
      renderModal()
      await userEvent.click(screen.getByText(/start setup/i))
      await waitFor(() => screen.getByPlaceholderText(/enter 6-digit code/i))
      await userEvent.type(screen.getByPlaceholderText(/enter 6-digit code/i), '000000')
      await userEvent.click(screen.getByText(/verify & enable/i))
      await waitFor(() => expect(screen.getByText(/invalid code/i)).toBeInTheDocument())
    })

    it('can disable 2FA from already_enabled state', async () => {
      server.use(
        http.post('http://localhost:8000/auth/2fa/setup', () =>
          HttpResponse.json({ detail: '2FA is already enabled' }, { status: 400 })
        )
      )
      renderModal()
      await userEvent.click(screen.getByText(/start setup/i))
      await waitFor(() => screen.getByText(/disable 2fa/i))
      await userEvent.click(screen.getByText(/disable 2fa/i))
      await waitFor(() => expect(screen.getByText(/2fa disabled/i)).toBeInTheDocument())
    })
  })

  describe('Recovery Codes tab', () => {
    it('shows generate button on recovery tab', () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: /recovery/i }))
      expect(screen.getByText(/generate new codes/i)).toBeInTheDocument()
    })

    it('shows generated codes after clicking generate', async () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: /recovery/i }))
      await userEvent.click(screen.getByText(/generate new codes/i))
      await waitFor(() => expect(screen.getByText('CODE1111')).toBeInTheDocument())
    })

    it('shows error when generation fails', async () => {
      server.use(
        http.post('http://localhost:8000/auth/2fa/recovery-codes/generate', () =>
          HttpResponse.json({ detail: 'Server error' }, { status: 500 })
        )
      )
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: /recovery/i }))
      await userEvent.click(screen.getByText(/generate new codes/i))
      await waitFor(() => expect(screen.getByText(/server error|could not generate/i)).toBeInTheDocument())
    })
  })

  describe('Security Question tab', () => {
    it('shows question and answer inputs', () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Question' }))
      expect(screen.getByPlaceholderText(/first pet/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/secret answer/i)).toBeInTheDocument()
    })

    it('shows error when question is too short', async () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Question' }))
      await userEvent.type(screen.getByPlaceholderText(/first pet/i), 'Hi')
      await userEvent.type(screen.getByPlaceholderText(/secret answer/i), 'ans')
      await userEvent.click(screen.getByText(/save question/i))
      await waitFor(() => expect(screen.getByText(/at least 5 characters/i)).toBeInTheDocument())
    })

    it('shows error when answer is empty', async () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Question' }))
      await userEvent.type(screen.getByPlaceholderText(/first pet/i), 'What is your pet name?')
      await userEvent.click(screen.getByText(/save question/i))
      await waitFor(() => expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument())
    })

    it('shows success after saving question', async () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Question' }))
      await userEvent.type(screen.getByPlaceholderText(/first pet/i), 'What is your pet name?')
      await userEvent.type(screen.getByPlaceholderText(/secret answer/i), 'fluffy')
      await userEvent.click(screen.getByText(/save question/i))
      await waitFor(() => expect(screen.getByText(/successfully saved/i)).toBeInTheDocument())
    })
  })

  describe('Devices tab', () => {
    it('shows trusted device in list', async () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: /devices/i }))
      await waitFor(() => expect(screen.getByText('Chrome on Mac')).toBeInTheDocument())
    })

    it('can remove a device', async () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: /devices/i }))
      await waitFor(() => screen.getByText('Chrome on Mac'))
      await userEvent.click(screen.getByRole('button', { name: /remove/i }))
      await waitFor(() => expect(screen.queryByText('Chrome on Mac')).not.toBeInTheDocument())
    })

    it('shows no devices message when list is empty', async () => {
      server.use(
        http.get('http://localhost:8000/auth/devices', () => HttpResponse.json([]))
      )
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: /devices/i }))
      await waitFor(() => expect(screen.getByText(/no trusted devices/i)).toBeInTheDocument())
    })

    it('shows error when devices fail to load', async () => {
      server.use(
        http.get('http://localhost:8000/auth/devices', () =>
          HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
        )
      )
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: /devices/i }))
      await waitFor(() => expect(screen.getByText(/unauthorized|failed to load/i)).toBeInTheDocument())
    })
  })
})
