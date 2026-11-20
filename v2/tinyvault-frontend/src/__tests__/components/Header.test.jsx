/**
 * Header.test.jsx — Unit tests for the shared app Header component.
 *
 * Tests:
 *  - Renders SubTrack logo
 *  - Displays correct role badge for each role
 *  - Shows Admin Panel button only for admin role
 *  - Displays username greeting
 *  - Calls onLogout when logout button clicked
 *  - Theme toggle button is present and calls onToggleTheme
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../components/Header'

function renderHeader(props = {}) {
  const defaults = {
    theme: 'light',
    onToggleTheme: vi.fn(),
    onLogout: vi.fn(),
    username: 'test_user',
    role: 'user',
    ...props,
  }
  return render(
    <MemoryRouter>
      <Header {...defaults} />
    </MemoryRouter>
  )
}

describe('Header', () => {
  describe('Logo', () => {
    it('renders SubTrack logo text', () => {
      renderHeader()
      expect(screen.getByText('SubTrack')).toBeInTheDocument()
    })

    it('logo is a link element', () => {
      renderHeader()
      expect(screen.getByText('SubTrack').closest('a')).toBeInTheDocument()
    })
  })

  describe('Role badge', () => {
    it('shows "user" badge for regular user', () => {
      renderHeader({ role: 'user' })
      expect(screen.getByText('user')).toBeInTheDocument()
    })

    it('shows "admin" badge for admin', () => {
      renderHeader({ role: 'admin' })
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    it('shows "viewer" badge for viewer', () => {
      renderHeader({ role: 'viewer' })
      expect(screen.getByText('viewer')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('always shows Dashboard button', () => {
      renderHeader()
      expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument()
    })

    it('shows Admin Panel button for admin role', () => {
      renderHeader({ role: 'admin' })
      expect(screen.getByRole('button', { name: 'Admin Panel' })).toBeInTheDocument()
    })

    it('does NOT show Admin Panel button for user role', () => {
      renderHeader({ role: 'user' })
      expect(screen.queryByRole('button', { name: 'Admin Panel' })).not.toBeInTheDocument()
    })

    it('does NOT show Admin Panel button for viewer role', () => {
      renderHeader({ role: 'viewer' })
      expect(screen.queryByRole('button', { name: 'Admin Panel' })).not.toBeInTheDocument()
    })
  })

  describe('User greeting', () => {
    it('displays username in greeting', () => {
      renderHeader({ username: 'rojhat' })
      expect(screen.getByText('rojhat')).toBeInTheDocument()
    })

    it('does not render greeting when username is empty', () => {
      renderHeader({ username: '' })
      expect(screen.queryByText('Merhaba,')).not.toBeInTheDocument()
    })
  })

  describe('Logout', () => {
    it('renders Sign Out button', () => {
      renderHeader()
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })

    it('calls onLogout when logout button is clicked', () => {
      const onLogout = vi.fn()
      renderHeader({ onLogout })
      fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
      expect(onLogout).toHaveBeenCalledOnce()
    })
  })

  describe('Theme toggle', () => {
    it('renders theme toggle button in light mode', () => {
      renderHeader({ theme: 'light' })
      expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument()
    })

    it('calls onToggleTheme when clicked', () => {
      const onToggleTheme = vi.fn()
      renderHeader({ onToggleTheme })
      fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }))
      expect(onToggleTheme).toHaveBeenCalledOnce()
    })

    it('shows light icon label in dark mode', () => {
      renderHeader({ theme: 'dark' })
      expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument()
    })
  })
})
