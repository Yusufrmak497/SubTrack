/**
 * roles.spec.js — E2E tests for role-based access control.
 *
 * Covers:
 *  - Admin login → redirected to /admin
 *  - User login  → redirected to /app
 *  - Viewer login → redirected to /app, sees read-only banner
 *  - Viewer cannot see Add Subscription form
 *  - Direct /admin access denied for non-admin (redirected to /app)
 *  - Unauthenticated /admin redirects to /login
 *  - Admin sees Admin Panel nav button; user/viewer do not
 *  - Role badge shown in header
 */

import { test, expect } from '@playwright/test'

const URL = 'http://localhost:5173'
const API = 'http://localhost:8000'

async function login(page, username, password) {
  await page.goto(`${URL}/login`)
  await page.fill('input[placeholder="username"]', username)
  await page.fill('input[placeholder="••••••"]', password)
  await page.click('button[type="submit"]')
}

test.describe('Role-based routing', () => {
  test('admin login redirects to /admin', async ({ page }) => {
    await login(page, 'admin_rojhat', 'admin123')
    await expect(page).toHaveURL(`${URL}/admin`, { timeout: 10000 })
  })

  test('regular user login redirects to /app', async ({ page }) => {
    await login(page, 'demo_user', 'user123')
    await expect(page).toHaveURL(`${URL}/app`, { timeout: 10000 })
  })

  test('viewer login redirects to /app', async ({ page }) => {
    await login(page, 'demo_viewer', 'viewer123')
    await expect(page).toHaveURL(`${URL}/app`, { timeout: 10000 })
  })
})

test.describe('Header role indicators', () => {
  test('admin header shows ADMIN badge', async ({ page }) => {
    await login(page, 'admin_rojhat', 'admin123')
    await page.waitForURL(`${URL}/admin`)
    await expect(page.locator('.app-header-role-badge')).toContainText('admin')
  })

  test('user header shows USER badge', async ({ page }) => {
    await login(page, 'demo_user', 'user123')
    await page.waitForURL(`${URL}/app`)
    await expect(page.locator('.app-header-role-badge')).toContainText('user')
  })

  test('admin header shows Admin Panel nav button', async ({ page }) => {
    await login(page, 'admin_rojhat', 'admin123')
    await page.waitForURL(`${URL}/admin`)
    await expect(page.locator('button:has-text("Admin Panel")')).toBeVisible()
  })

  test('user header does NOT show Admin Panel button', async ({ page }) => {
    await login(page, 'demo_user', 'user123')
    await page.waitForURL(`${URL}/app`)
    await expect(page.locator('button:has-text("Admin Panel")')).not.toBeVisible()
  })

  test('viewer header does NOT show Admin Panel button', async ({ page }) => {
    await login(page, 'demo_viewer', 'viewer123')
    await page.waitForURL(`${URL}/app`)
    await expect(page.locator('button:has-text("Admin Panel")')).not.toBeVisible()
  })
})

test.describe('Viewer restrictions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'demo_viewer', 'viewer123')
    await page.waitForURL(`${URL}/app`)
    // Wait for subscriptions section to load
    await page.waitForSelector('section', { timeout: 10000 })
  })

  test('viewer sees read-only banner', async ({ page }) => {
    await expect(page.locator('strong:has-text("Viewer modu")')).toBeVisible({ timeout: 10000 })
  })

  test('viewer does not see Add Subscription form', async ({ page }) => {
    // Form is not rendered for viewer — count should be 0
    await expect(page.locator('text=Add New Subscription')).toHaveCount(0, { timeout: 5000 })
  })
})

test.describe('Direct URL access protection', () => {
  test('unauthenticated /admin redirects to /login', async ({ page }) => {
    await page.goto(`${URL}/admin`)
    await expect(page).toHaveURL(`${URL}/login`)
  })

  test('unauthenticated /app redirects to /login', async ({ page }) => {
    await page.goto(`${URL}/app`)
    await expect(page).toHaveURL(`${URL}/login`)
  })

  test('non-admin accessing /admin is redirected to /app', async ({ page }) => {
    await login(page, 'demo_user', 'user123')
    await page.waitForURL(`${URL}/app`)
    await page.goto(`${URL}/admin`)
    await expect(page).toHaveURL(`${URL}/app`)
  })

  test('viewer accessing /admin is redirected to /app', async ({ page }) => {
    await login(page, 'demo_viewer', 'viewer123')
    await page.waitForURL(`${URL}/app`)
    await page.goto(`${URL}/admin`)
    await expect(page).toHaveURL(`${URL}/app`)
  })
})

test.describe('Logout flow', () => {
  test('logout navigates away from dashboard', async ({ page }) => {
    await login(page, 'demo_user', 'user123')
    await page.waitForURL(`${URL}/app`)
    await page.click('button:has-text("Sign Out")')
    // After logout, token gone → React redirects /app → /login
    await expect(page).toHaveURL(`${URL}/login`, { timeout: 5000 })
  })

  test('after logout /app redirects to /login', async ({ page }) => {
    await login(page, 'demo_user', 'user123')
    await page.waitForURL(`${URL}/app`)
    await page.click('button:has-text("Sign Out")')
    await page.goto(`${URL}/app`)
    await expect(page).toHaveURL(`${URL}/login`)
  })
})
