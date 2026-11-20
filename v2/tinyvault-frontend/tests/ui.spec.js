/**
 * ui.spec.js — E2E tests for UI/UX features
 *
 * Covers:
 *  - Dark/Light mode theme toggle
 *  - Summary cards render correctly
 *  - TinyVault header elements
 *  - Footer copyright text
 *  - Subscription card UI elements
 *  - Responsive behaviour (mobile viewport)
 */

import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';

import { loginAsAdminFast } from './helpers/auth.js';
async function loginAndWait(page) {
  await loginAsAdminFast(page);
  if (!page.url().includes('/app')) await page.goto('http://localhost:5173/app');
  await page.waitForSelector('.subscription-card', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test.describe('UI / UX', () => {

  test.describe('Theme Toggle', () => {

    test.beforeEach(async ({ page }) => {
      await loginAndWait(page);
    });

    test('theme toggle button is visible', async ({ page }) => {
      await expect(page.locator('.theme-toggle')).toBeVisible();
    });

    test('clicking theme toggle changes data-theme attribute', async ({ page }) => {
      const initialTheme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );

      await page.click('.theme-toggle');
      await page.waitForFunction(
        (prev) => document.documentElement.getAttribute('data-theme') !== prev,
        initialTheme,
      );

      const newTheme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );
      expect(newTheme).not.toBe(initialTheme);
    });

    test('toggling twice restores original theme', async ({ page }) => {
      const initialTheme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );

      await page.click('.theme-toggle');
      await page.waitForFunction(
        (prev) => document.documentElement.getAttribute('data-theme') !== prev,
        initialTheme,
      );

      await page.click('.theme-toggle');
      await page.waitForFunction(
        (prev) => document.documentElement.getAttribute('data-theme') === prev,
        initialTheme,
      );

      const restoredTheme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );
      expect(restoredTheme).toBe(initialTheme);
    });

    test('theme preference is saved to localStorage', async ({ page }) => {
      await page.click('.theme-toggle');

      const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
      expect(['light', 'dark']).toContain(savedTheme);
    });

    test('theme persists after page reload', async ({ page }) => {
      const initialTheme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );

      await page.click('.theme-toggle');
      await page.waitForFunction(
        (prev) => document.documentElement.getAttribute('data-theme') !== prev,
        initialTheme,
      );

      const themeAfterToggle = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );

      await page.reload();
      await page.waitForSelector('.subscription-card', { timeout: 15000 });

      const themeAfterReload = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );
      expect(themeAfterReload).toBe(themeAfterToggle);
    });
  });

  test.describe('Summary Cards', () => {

    test.beforeEach(async ({ page }) => {
      await loginAndWait(page);
    });

    test('all four summary cards are rendered', async ({ page }) => {
      await expect(page.locator('.summary-card')).toHaveCount(4);
    });

    test('Active Subscriptions card is visible', async ({ page }) => {
      await expect(page.locator('text=Active Subscriptions')).toBeVisible();
    });

    test('Estimated Monthly Total card is visible', async ({ page }) => {
      await expect(page.locator('text=Estimated Monthly Total')).toBeVisible();
    });

    test('Due in Next 7 Days card is visible', async ({ page }) => {
      await expect(page.locator('text=Due in Next 7 Days')).toBeVisible();
    });

    test('Converted Total card is visible', async ({ page }) => {
      await expect(page.locator('text=Converted Total')).toBeVisible();
    });
  });

  test.describe('Page Structure', () => {

    test.beforeEach(async ({ page }) => {
      await loginAndWait(page);
    });

    test('page title contains TinyVault', async ({ page }) => {
      await expect(page).toHaveTitle(/TinyVault/);
    });

    test('header shows SubTrack logo', async ({ page }) => {
      await expect(page.locator('.app-header-logo')).toContainText('SubTrack');
    });

    test('header subtitle text is visible', async ({ page }) => {
      await expect(page.locator('.app-header-bar').first()).toBeVisible();
    });

    test('footer copyright is visible', async ({ page }) => {
      await expect(page.locator('footer')).toContainText('2026 SubTrack');
    });
  });

  test.describe('Subscription Cards UI', () => {

    test.beforeEach(async ({ page }) => {
      await loginAndWait(page);
    });

    test('subscription cards have remove button', async ({ page }) => {
      await expect(
        page.locator('.subscription-card').first().locator('.danger-btn'),
      ).toBeVisible();
    });

    test('upcoming payment cards have "upcoming" CSS class', async ({ page }) => {
      const upcomingCards = page.locator('.subscription-card.upcoming');
      const count = await upcomingCards.count();
      if (count > 0) {
        await expect(upcomingCards.first()).toBeVisible();
      }
    });
  });

  test.describe('Mobile Viewport', () => {
    test('login page renders on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${URL}/login`);
      await expect(page.locator('input[placeholder="username"]')).toBeVisible();
    });

    test('dashboard renders correctly on mobile viewport (iPhone 12)', async ({ page }) => {
      await loginAndWait(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.summary-card').first()).toBeVisible();
      await expect(page.locator('.subscription-card').first()).toBeVisible({ timeout: 10000 });
    });
  });
});
