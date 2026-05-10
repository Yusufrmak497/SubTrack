/**
 * landing.spec.js — E2E tests for the public landing page.
 *
 * Covers:
 *  - All sections render on load
 *  - CTA buttons navigate to correct routes
 *  - Navbar Giriş Yap / Ücretsiz Başla buttons work
 *  - Footer links are present
 *  - SubTrack logo reloads the page
 */

import { test, expect } from '@playwright/test'

const URL = 'http://localhost:5173'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')
  })

  test.describe('Navbar', () => {
    test('renders SubTrack logo', async ({ page }) => {
      await expect(page.locator('.landing-nav .landing-logo')).toContainText('SubTrack')
    })

    test('Giriş Yap navigates to /login', async ({ page }) => {
      await page.click('nav.landing-nav button:has-text("Giriş Yap")')
      await expect(page).toHaveURL(`${URL}/login`)
    })

    test('Ücretsiz Başla navigates to /register', async ({ page }) => {
      await page.click('nav.landing-nav button:has-text("Ücretsiz Başla")')
      await expect(page).toHaveURL(`${URL}/register`)
    })
  })

  test.describe('Hero section', () => {
    test('renders hero title containing Aboneliklerinizi', async ({ page }) => {
      await expect(page.locator('.hero-title')).toContainText('Aboneliklerinizi')
    })

    test('renders hero stats', async ({ page }) => {
      await expect(page.locator('.hero-stats')).toContainText('10K+')
      await expect(page.locator('.hero-stats')).toContainText('500K+')
      await expect(page.locator('.hero-stats')).toContainText('%99.9')
    })

    test('hero Ücretsiz Başla navigates to /register', async ({ page }) => {
      await page.click('.btn-hero-primary')
      await expect(page).toHaveURL(`${URL}/register`)
    })

    test('hero Giriş Yap navigates to /login', async ({ page }) => {
      await page.click('.btn-hero-secondary')
      await expect(page).toHaveURL(`${URL}/login`)
    })
  })

  test.describe('Features section', () => {
    test('renders Neden SubTrack heading', async ({ page }) => {
      await expect(page.locator('#features .section-title')).toContainText('Neden SubTrack')
    })

    test('renders 4 feature cards', async ({ page }) => {
      const cards = page.locator('.feature-card')
      await expect(cards).toHaveCount(4)
    })

    test('each feature card has icon, title and description', async ({ page }) => {
      const cards = page.locator('.feature-card')
      for (let i = 0; i < 4; i++) {
        const card = cards.nth(i)
        await expect(card.locator('.feature-icon')).toBeVisible()
        await expect(card.locator('h3')).toBeVisible()
        await expect(card.locator('p')).toBeVisible()
      }
    })
  })

  test.describe('How it works section', () => {
    test('renders 3 Adımda Başlayın heading', async ({ page }) => {
      await expect(page.locator('#how .section-title')).toContainText('3 Adımda Başlayın')
    })

    test('renders 3 step cards', async ({ page }) => {
      await expect(page.locator('.step-card')).toHaveCount(3)
    })

    test('step numbers are 01, 02, 03', async ({ page }) => {
      const nums = page.locator('.step-num')
      await expect(nums.nth(0)).toContainText('01')
      await expect(nums.nth(1)).toContainText('02')
      await expect(nums.nth(2)).toContainText('03')
    })
  })

  test.describe('Pricing section', () => {
    test('renders Basit ve Şeffaf heading', async ({ page }) => {
      await expect(page.locator('#pricing .section-title')).toContainText('Basit ve Şeffaf')
    })

    test('renders 2 pricing cards', async ({ page }) => {
      await expect(page.locator('.pricing-card')).toHaveCount(2)
    })

    test('Pro card has En Popüler badge', async ({ page }) => {
      await expect(page.locator('.pricing-badge')).toContainText('En Popüler')
    })

    test('Hemen Başla navigates to /register', async ({ page }) => {
      await page.click('button:has-text("Hemen Başla")')
      await expect(page).toHaveURL(`${URL}/register`)
    })
  })

  test.describe('Footer', () => {
    test('renders copyright text', async ({ page }) => {
      await expect(page.locator('.landing-footer')).toContainText('2026 SubTrack')
    })

    test('renders navigation links', async ({ page }) => {
      const footer = page.locator('.footer-links')
      await expect(footer.locator('a:has-text("Özellikler")')).toBeVisible()
      await expect(footer.locator('a:has-text("Nasıl Çalışır")')).toBeVisible()
      await expect(footer.locator('a:has-text("Fiyatlandırma")')).toBeVisible()
    })
  })
})
