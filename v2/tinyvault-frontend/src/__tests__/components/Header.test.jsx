/**
 * Header.test.jsx — Unit tests for Header component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from '../../components/Header'

describe('Header', () => {
  it('renders the application title', () => {
    render(<Header />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('TinyVault')
  })

  it('renders dashboard navigation link', () => {
    render(<Header />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders notification button', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  it('renders user avatar', () => {
    render(<Header />)
    expect(screen.getByText('TV')).toBeInTheDocument()
  })
})
