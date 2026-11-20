/**
 * landing.spec.js — E2E tests for the public landing page.
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

    test('Sign In navigates to /login', async ({ page }) => {
      await page.click('nav.landing-nav button:has-text("Sign In")')
      await expect(page).toHaveURL(`${URL}/login`)
    })

    test('Get Started navigates to /register', async ({ page }) => {
      await page.click('nav.landing-nav button:has-text("Get Started")')
      await expect(page).toHaveURL(`${URL}/register`)
    })
  })

  test.describe('Hero section', () => {
    test('renders hero title', async ({ page }) => {
      await expect(page.locator('.hero-title')).toContainText('Under Control')
    })

    test('renders hero stats', async ({ page }) => {
      await expect(page.locator('.hero-stats')).toContainText('10K+')
      await expect(page.locator('.hero-stats')).toContainText('500K+')
      await expect(page.locator('.hero-stats')).toContainText('99.9%')
    })

    test('hero Get Started Free navigates to /register', async ({ page }) => {
      await page.click('.btn-hero-primary')
      await expect(page).toHaveURL(`${URL}/register`)
    })

    test('hero Sign In navigates to /login', async ({ page }) => {
      await page.click('.btn-hero-secondary')
      await expect(page).toHaveURL(`${URL}/login`)
    })
  })

  test.describe('Features section', () => {
    test('renders Why SubTrack heading', async ({ page }) => {
      await expect(page.locator('#features .section-title')).toContainText('Why SubTrack')
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
    test('renders Get Started in 3 Steps heading', async ({ page }) => {
      await expect(page.locator('#how .section-title')).toContainText('Get Started in 3 Steps')
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
    test('renders Simple & Transparent heading', async ({ page }) => {
      await expect(page.locator('#pricing .section-title')).toContainText('Simple & Transparent')
    })

    test('renders 2 pricing cards', async ({ page }) => {
      await expect(page.locator('.pricing-card')).toHaveCount(2)
    })

    test('Pro card has Most Popular badge', async ({ page }) => {
      await expect(page.locator('.pricing-badge')).toContainText('Most Popular')
    })

    test('Get Started navigates to /register', async ({ page }) => {
      await page.click('button:has-text("Get Started")')
      await expect(page).toHaveURL(`${URL}/register`)
    })
  })

  test.describe('Footer', () => {
    test('renders copyright text', async ({ page }) => {
      await expect(page.locator('.landing-footer')).toContainText('2026 SubTrack')
    })

    test('renders navigation links', async ({ page }) => {
      const footer = page.locator('.footer-links')
      await expect(footer.locator('a:has-text("Features")')).toBeVisible()
      await expect(footer.locator('a:has-text("How It Works")')).toBeVisible()
      await expect(footer.locator('a:has-text("Pricing")')).toBeVisible()
    })
  })
})
