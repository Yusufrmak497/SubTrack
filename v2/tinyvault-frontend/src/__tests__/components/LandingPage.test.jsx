/**
 * LandingPage.test.jsx — Unit tests for the public landing page.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from '../../pages/LandingPage'

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

describe('LandingPage', () => {
  describe('Navbar', () => {
    it('renders SubTrack logo in navbar', () => {
      renderLanding()
      expect(screen.getAllByText('SubTrack').length).toBeGreaterThan(0)
    })

    it('renders at least one Sign In button', () => {
      renderLanding()
      expect(screen.getAllByRole('button', { name: /sign in/i }).length).toBeGreaterThan(0)
    })

    it('renders at least one Get Started button', () => {
      renderLanding()
      expect(screen.getAllByRole('button', { name: /get started/i }).length).toBeGreaterThan(0)
    })
  })

  describe('Hero section', () => {
    it('renders hero title accent text', () => {
      renderLanding()
      expect(screen.getByText('Under Control', { selector: '.hero-accent' })).toBeInTheDocument()
    })

    it('renders 10K+ stat', () => {
      renderLanding()
      expect(screen.getByText('10K+')).toBeInTheDocument()
    })

    it('renders 500K+ stat', () => {
      renderLanding()
      expect(screen.getByText('500K+')).toBeInTheDocument()
    })

    it('renders 99.9% uptime stat', () => {
      renderLanding()
      expect(screen.getByText('99.9%')).toBeInTheDocument()
    })
  })

  describe('Features section', () => {
    it('renders Features label', () => {
      renderLanding()
      const labels = screen.getAllByText(/features/i)
      expect(labels.length).toBeGreaterThan(0)
    })

    it('renders Why SubTrack heading', () => {
      renderLanding()
      expect(screen.getByText(/why subtrack/i)).toBeInTheDocument()
    })
  })

  describe('How it works section', () => {
    it('renders Get Started in 3 Steps heading', () => {
      renderLanding()
      expect(screen.getByText(/get started in 3 steps/i)).toBeInTheDocument()
    })

    it('renders step number 01', () => {
      renderLanding()
      expect(screen.getByText('01')).toBeInTheDocument()
    })

    it('renders step number 02', () => {
      renderLanding()
      expect(screen.getByText('02')).toBeInTheDocument()
    })

    it('renders step number 03', () => {
      renderLanding()
      expect(screen.getByText('03')).toBeInTheDocument()
    })

    it('renders Create Account step', () => {
      renderLanding()
      expect(screen.getByText('Create Account')).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('renders 2026 SubTrack copyright', () => {
      renderLanding()
      expect(screen.getByText(/2026 SubTrack/i)).toBeInTheDocument()
    })
  })
})
