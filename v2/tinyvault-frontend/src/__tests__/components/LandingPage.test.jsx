/**
 * LandingPage.test.jsx — Unit tests for the public landing page.
 *
 * Tests:
 *  - All major sections and content render correctly
 *  - CTA buttons are present and clickable
 *  - Pricing plan names, prices and badge are visible
 *  - Footer links and copyright render
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

    it('renders at least one Giriş Yap button', () => {
      renderLanding()
      expect(screen.getAllByRole('button', { name: 'Giriş Yap' }).length).toBeGreaterThan(0)
    })

    it('renders at least one Ücretsiz Başla button', () => {
      renderLanding()
      expect(screen.getAllByRole('button', { name: 'Ücretsiz Başla' }).length).toBeGreaterThan(0)
    })
  })

  describe('Hero section', () => {
    it('renders hero title text', () => {
      renderLanding()
      expect(screen.getByText('Kontrol Altında', { selector: '.hero-accent' })).toBeInTheDocument()
    })

    it('renders hero subtitle', () => {
      renderLanding()
      expect(screen.getByText(/tüm dijital aboneliklerinizi/i)).toBeInTheDocument()
    })

    it('renders 10K+ stat', () => {
      renderLanding()
      expect(screen.getByText('10K+')).toBeInTheDocument()
    })

    it('renders 500K+ stat', () => {
      renderLanding()
      expect(screen.getByText('500K+')).toBeInTheDocument()
    })

    it('renders %99.9 uptime stat', () => {
      renderLanding()
      expect(screen.getByText('%99.9')).toBeInTheDocument()
    })
  })

  describe('Features section', () => {
    it('renders Özellikler label', () => {
      renderLanding()
      const labels = screen.getAllByText(/özellikler/i)
      expect(labels.length).toBeGreaterThan(0)
    })

    it('renders Neden SubTrack heading', () => {
      renderLanding()
      expect(screen.getByText(/neden subtrack/i)).toBeInTheDocument()
    })

    it('renders Tek Panelden Takip card', () => {
      renderLanding()
      expect(screen.getByText('Tek Panelden Takip')).toBeInTheDocument()
    })

    it('renders Yenileme Hatırlatıcıları card', () => {
      renderLanding()
      expect(screen.getByText('Yenileme Hatırlatıcıları')).toBeInTheDocument()
    })

    it('renders Ödeme Yöntemi Takibi card', () => {
      renderLanding()
      expect(screen.getByText('Ödeme Yöntemi Takibi')).toBeInTheDocument()
    })

    it('renders Harcama Analitiği card', () => {
      renderLanding()
      expect(screen.getByText('Harcama Analitiği')).toBeInTheDocument()
    })
  })

  describe('How it works section', () => {
    it('renders 3 Adımda Başlayın heading', () => {
      renderLanding()
      expect(screen.getByText('3 Adımda Başlayın')).toBeInTheDocument()
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

    it('renders Hesap Oluştur step', () => {
      renderLanding()
      expect(screen.getByText('Hesap Oluştur')).toBeInTheDocument()
    })
  })

  describe('Pricing section', () => {
    it('renders Basit ve Şeffaf heading', () => {
      renderLanding()
      expect(screen.getByText('Basit ve Şeffaf')).toBeInTheDocument()
    })

    it('renders Ücretsiz plan', () => {
      renderLanding()
      expect(screen.getByText('Ücretsiz')).toBeInTheDocument()
    })

    it('renders Pro plan', () => {
      renderLanding()
      expect(screen.getByText('Pro')).toBeInTheDocument()
    })

    it('renders ₺0 price', () => {
      renderLanding()
      expect(screen.getByText('₺0')).toBeInTheDocument()
    })

    it('renders ₺49 price', () => {
      renderLanding()
      expect(screen.getByText('₺49')).toBeInTheDocument()
    })

    it('renders En Popüler badge', () => {
      renderLanding()
      expect(screen.getByText('En Popüler')).toBeInTheDocument()
    })

    it('renders Hemen Başla CTA button', () => {
      renderLanding()
      expect(screen.getByRole('button', { name: 'Hemen Başla' })).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('renders 2026 SubTrack copyright', () => {
      renderLanding()
      expect(screen.getByText(/2026 SubTrack/i)).toBeInTheDocument()
    })

    it('renders Özellikler footer link', () => {
      renderLanding()
      const links = screen.getAllByRole('link', { name: /özellikler/i })
      expect(links.length).toBeGreaterThan(0)
    })

    it('renders Fiyatlandırma footer link', () => {
      renderLanding()
      expect(screen.getByRole('link', { name: /fiyatlandırma/i })).toBeInTheDocument()
    })
  })
})
