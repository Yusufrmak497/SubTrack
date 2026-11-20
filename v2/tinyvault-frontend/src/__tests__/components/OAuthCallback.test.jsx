import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OAuthCallback from '../../pages/OAuthCallback'

function renderCallback(search = '', onLogin = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={[`/oauth/callback${search}`]}>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallback onLogin={onLogin} />} />
        <Route path="/app" element={<div>Dashboard</div>} />
        <Route path="/admin" element={<div>Admin</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('OAuthCallback', () => {
  it('stores token in localStorage on success', async () => {
    renderCallback('?token=mytoken&role=user&username=alice')
    await waitFor(() => expect(localStorage.getItem('token')).toBe('mytoken'))
  })

  it('stores role in localStorage', async () => {
    renderCallback('?token=tok&role=user&username=alice')
    await waitFor(() => expect(localStorage.getItem('role')).toBe('user'))
  })

  it('stores username in localStorage', async () => {
    renderCallback('?token=tok&role=user&username=alice')
    await waitFor(() => expect(localStorage.getItem('username')).toBe('alice'))
  })

  it('calls onLogin with token and role', async () => {
    const onLogin = vi.fn()
    renderCallback('?token=tok&role=user&username=alice', onLogin)
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('tok', 'user'))
  })

  it('redirects admin to /admin', async () => {
    renderCallback('?token=tok&role=admin&username=admin_rojhat')
    await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument())
  })

  it('redirects regular user to /app', async () => {
    renderCallback('?token=tok&role=user&username=alice')
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
  })

  it('redirects to login on error param', async () => {
    renderCallback('?error=access_denied')
    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument())
  })

  it('redirects to login when no token', async () => {
    renderCallback('?role=user')
    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument())
  })
})
