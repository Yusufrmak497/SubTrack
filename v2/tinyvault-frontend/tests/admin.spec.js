/**
 * admin.spec.js — E2E tests for the Admin Dashboard page.
 */

import { test, expect } from '@playwright/test'
import { loginAsAdminFast } from './helpers/auth.js'

const URL = 'http://localhost:5173'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdminFast(page)
  })

  test.describe('Layout', () => {
    test('renders Admin Dashboard heading', async ({ page }) => {
      await expect(page.locator('.admin-title')).toContainText('Admin Dashboard')
    })

    test('renders shared SubTrack header', async ({ page }) => {
      await expect(page.locator('.app-header-bar .app-header-logo')).toContainText('SubTrack')
    })

    test('header shows ADMIN badge', async ({ page }) => {
      await expect(page.locator('.app-header-role-badge')).toContainText('admin')
    })

    test('header shows Admin Panel active button', async ({ page }) => {
      await expect(page.locator('button:has-text("Admin Panel")')).toBeVisible()
    })
  })

  test.describe('Stat cards', () => {
    test('shows Total Users card', async ({ page }) => {
      await expect(page.locator('text=Total Users')).toBeVisible()
    })

    test('shows Active card', async ({ page }) => {
      await expect(page.locator('.admin-stat-card:has-text("Active")')).toBeVisible()
    })

    test('shows Admin count card', async ({ page }) => {
      await expect(page.locator('.admin-stat-card:has-text("Admin")')).toBeVisible()
    })

    test('shows Viewer count card', async ({ page }) => {
      await expect(page.locator('.admin-stat-card:has-text("Viewer")')).toBeVisible()
    })
  })

  test.describe('User table', () => {
    test('renders table with at least 3 users', async ({ page }) => {
      const rows = page.locator('.admin-table tbody tr')
      await rows.first().waitFor({ timeout: 8000 })
      const count = await rows.count()
      expect(count).toBeGreaterThanOrEqual(3)
    })

    test('shows admin_rojhat in the table', async ({ page }) => {
      await expect(page.locator('td.td-username:has-text("admin_rojhat")')).toBeVisible()
    })

    test('shows demo_user in the table', async ({ page }) => {
      await expect(page.locator('td.td-username:has-text("demo_user")')).toBeVisible()
    })

    test('shows demo_viewer in the table', async ({ page }) => {
      await expect(page.locator('td.td-username:has-text("demo_viewer")')).toBeVisible()
    })

    test('each row has a role select dropdown', async ({ page }) => {
      const rows = page.locator('.admin-table tbody tr')
      await rows.first().waitFor({ timeout: 8000 })
      const rowCount = await rows.count()
      const selects = page.locator('.role-select')
      await expect(selects).toHaveCount(rowCount)
    })

    test('each active row has Deactivate button', async ({ page }) => {
      const buttons = page.locator('.toggle-deactivate')
      await buttons.first().waitFor({ timeout: 8000 })
      const count = await buttons.count()
      expect(count).toBeGreaterThanOrEqual(3)
    })
  })

  test.describe('Search', () => {
    test('search input filters rows by username', async ({ page }) => {
      await page.fill('.admin-search', 'admin')
      await expect(page.locator('td.td-username:has-text("admin_rojhat")')).toBeVisible()
      await expect(page.locator('td.td-username:has-text("demo_user")')).not.toBeVisible()
    })

    test('search shows user count', async ({ page }) => {
      await page.fill('.admin-search', 'demo')
      await expect(page.locator('.admin-count')).toContainText('2 users')
    })

    test('empty search shows all users', async ({ page }) => {
      // get total count before filtering
      const totalText = await page.locator('.admin-count').textContent()
      const total = parseInt(totalText)

      await page.fill('.admin-search', 'demo')
      await expect(page.locator('.admin-count')).toContainText('2 users')
      await page.fill('.admin-search', '')
      await expect(page.locator('.admin-count')).toContainText(`${total} users`)
    })
  })

  test.describe('Role change', () => {
    test('changing role dropdown calls API and updates UI', async ({ page }) => {
      const viewerRow = page.locator('tr:has(td:has-text("demo_viewer"))')
      const select = viewerRow.locator('.role-select')
      const roleUrl = (res) => res.url().includes('/admin/users/') && res.url().includes('/role')

      await Promise.all([page.waitForResponse(roleUrl), select.selectOption('user')])
      await expect(select).toHaveValue('user', { timeout: 5000 })

      // Restore to viewer so subsequent tests see the correct role
      await Promise.all([page.waitForResponse(roleUrl), select.selectOption('viewer')])
      await expect(select).toHaveValue('viewer', { timeout: 5000 })
    })

    test('role select has all 3 options', async ({ page }) => {
      const select = page.locator('.role-select').first()
      const options = await select.locator('option').allTextContents()
      expect(options).toContain('admin')
      expect(options).toContain('user')
      expect(options).toContain('viewer')
    })
  })

  test.describe('Status toggle', () => {
    test('toggle deactivates then re-activates demo_user', async ({ page }) => {
      const statusUrl = (res) => res.url().includes('/admin/users/') && res.url().includes('/status')
      const userRow = page.locator('tr:has(td:has-text("demo_user"))')
      const toggleBtn = userRow.locator('.toggle-btn')

      // Ensure we start from active state
      const initialText = await toggleBtn.textContent()
      if (initialText?.trim() === 'Activate') {
        await Promise.all([page.waitForResponse(statusUrl), toggleBtn.click()])
        await expect(toggleBtn).toHaveText('Deactivate', { timeout: 5000 })
      }

      // Deactivate
      await Promise.all([page.waitForResponse(statusUrl), toggleBtn.click()])
      await expect(toggleBtn).toHaveText('Activate', { timeout: 5000 })

      // Re-activate (cleanup)
      await Promise.all([page.waitForResponse(statusUrl), toggleBtn.click()])
      await expect(toggleBtn).toHaveText('Deactivate', { timeout: 5000 })
    })
  })

  test.describe('Navigation', () => {
    test('Dashboard button navigates to /app', async ({ page }) => {
      await page.click('button:has-text("Dashboard")')
      await expect(page).toHaveURL(`${URL}/app`)
    })

    test('Sign Out logs out and redirects to login', async ({ page }) => {
      await page.click('button:has-text("Sign Out")')
      await expect(page).toHaveURL(`${URL}/login`, { timeout: 5000 })
    })
  })
})
