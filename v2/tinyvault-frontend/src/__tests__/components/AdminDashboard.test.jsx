/**
 * AdminDashboard.test.jsx — Unit tests for the AdminDashboard component.
 *
 * Tests:
 *  - Renders user table with all users
 *  - Stat cards show correct counts
 *  - Search filters the user list
 *  - Role dropdown triggers PUT /admin/users/{id}/role
 *  - Status toggle button triggers PUT /admin/users/{id}/status
 *  - Calls onUnauthorized on 401/403 response
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import AdminDashboard from '../../pages/AdminDashboard'
import { server, MOCK_USERS } from '../setup/msw-handlers'

function renderAdmin(props = {}) {
  return render(
    <MemoryRouter>
      <AdminDashboard token="mock.jwt.token" onUnauthorized={vi.fn()} {...props} />
    </MemoryRouter>
  )
}

describe('AdminDashboard', () => {
  describe('User table', () => {
    it('renders all users from API', async () => {
      renderAdmin()
      await waitFor(() => {
        expect(screen.getByText('admin_rojhat')).toBeInTheDocument()
        expect(screen.getByText('demo_user')).toBeInTheDocument()
        expect(screen.getByText('demo_viewer')).toBeInTheDocument()
      })
    })

    it('renders table with 7 column headers', async () => {
      renderAdmin()
      await waitFor(() => expect(screen.getByText('admin_rojhat')).toBeInTheDocument())
      expect(screen.getAllByRole('columnheader')).toHaveLength(7)
    })

    it('shows Aktif status badge for active users', async () => {
      renderAdmin()
      await waitFor(() => screen.getAllByText('Aktif'))
      expect(screen.getAllByText('Aktif').length).toBeGreaterThan(0)
    })

    it('shows Devre Dışı buttons for active users', async () => {
      renderAdmin()
      await waitFor(() => screen.getAllByText('Devre Dışı'))
      expect(screen.getAllByText('Devre Dışı').length).toBeGreaterThan(0)
    })
  })

  describe('Stat cards', () => {
    it('shows total user count', async () => {
      renderAdmin()
      await waitFor(() => screen.getByText('admin_rojhat'))
      expect(screen.getByText('Toplam Kullanıcı')).toBeInTheDocument()
      // stat-value inside the Toplam card
      const totalCard = screen.getByText('Toplam Kullanıcı').closest('.admin-stat-card')
      expect(totalCard).not.toBeNull()
      expect(totalCard.querySelector('.stat-value').textContent).toBe(String(MOCK_USERS.length))
    })

    it('shows admin count', async () => {
      renderAdmin()
      await waitFor(() => screen.getByText('admin_rojhat'))
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('shows viewer count', async () => {
      renderAdmin()
      await waitFor(() => screen.getByText('admin_rojhat'))
      expect(screen.getByText('Viewer')).toBeInTheDocument()
    })
  })

  describe('Search', () => {
    it('renders search input', async () => {
      renderAdmin()
      await waitFor(() => screen.getByText('admin_rojhat'))
      expect(screen.getByPlaceholderText(/kullanıcı adı veya e-posta ara/i)).toBeInTheDocument()
    })

    it('filters users by username', async () => {
      const user = userEvent.setup()
      renderAdmin()
      await waitFor(() => screen.getByText('admin_rojhat'))

      await user.type(screen.getByPlaceholderText(/kullanıcı adı veya e-posta ara/i), 'admin')

      expect(screen.getByText('admin_rojhat')).toBeInTheDocument()
      expect(screen.queryByText('demo_user')).not.toBeInTheDocument()
    })

    it('shows count of filtered results', async () => {
      const user = userEvent.setup()
      renderAdmin()
      await waitFor(() => screen.getByText('admin_rojhat'))

      await user.type(screen.getByPlaceholderText(/kullanıcı adı veya e-posta ara/i), 'demo')
      expect(screen.getByText('2 kullanıcı')).toBeInTheDocument()
    })

    it('shows no results message when no match', async () => {
      const user = userEvent.setup()
      renderAdmin()
      await waitFor(() => screen.getByText('admin_rojhat'))

      await user.type(screen.getByPlaceholderText(/kullanıcı adı veya e-posta ara/i), 'zzznomatch')
      expect(screen.getByText(/sonuç bulunamadı/i)).toBeInTheDocument()
    })
  })

  describe('Role change', () => {
    it('sends PUT request when role dropdown changes', async () => {
      let captured = null
      server.use(
        http.put('http://localhost:8000/admin/users/:id/role', async ({ request }) => {
          captured = await request.json()
          return HttpResponse.json({ ...MOCK_USERS[1], role: captured.role })
        })
      )

      const user = userEvent.setup()
      renderAdmin()
      await waitFor(() => screen.getByText('demo_user'))

      const selects = screen.getAllByRole('combobox')
      await user.selectOptions(selects[1], 'viewer')

      await waitFor(() => expect(captured).toEqual({ role: 'viewer' }))
    })
  })

  describe('Status toggle', () => {
    it('sends PUT request when Devre Dışı button clicked', async () => {
      let toggled = false
      server.use(
        http.put('http://localhost:8000/admin/users/:id/status', () => {
          toggled = true
          return HttpResponse.json({ ...MOCK_USERS[1], is_active: false })
        })
      )

      renderAdmin()
      await waitFor(() => screen.getByText('demo_user'))

      const buttons = screen.getAllByText('Devre Dışı')
      fireEvent.click(buttons[0])

      await waitFor(() => expect(toggled).toBe(true))
    })
  })

  describe('Unauthorized handling', () => {
    it('calls onUnauthorized when API returns 401', async () => {
      server.use(
        http.get('http://localhost:8000/admin/users', () =>
          HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
        )
      )
      const onUnauthorized = vi.fn()
      renderAdmin({ onUnauthorized })
      await waitFor(() => expect(onUnauthorized).toHaveBeenCalled())
    })
  })
})
