/**
 * filters.spec.js — E2E tests for Filtering & Sorting features
 *
 * Covers:
 *  - Search by service name filters cards
 *  - Clearing search shows all cards
 *  - Category filter shows relevant cards
 *  - "All" category shows all cards
 *  - Sort by amount ascending/descending
 *  - Sort by next payment date
 *  - Sort by name alphabetically
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

async function waitForSubscriptionsResponse(page) {
  return page.waitForResponse(
    (r) => r.url().includes('/subscriptions') && r.status() === 200,
    { timeout: 8000 },
  );
}

test.describe('Filters & Sorting', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndWait(page);
  });

  test.describe('Search', () => {
    test('search input is visible', async ({ page }) => {
      await expect(page.locator('input[placeholder="Search by service name"]')).toBeVisible();
    });

    test('typing in search filters subscription cards', async ({ page }) => {
      const allCards = page.locator('.subscription-card');
      const totalBefore = await allCards.count();
      test.skip(totalBefore < 2, 'Need at least 2 subscriptions to test search filtering');

      await page.fill('input[placeholder="Search by service name"]', 'Netflix');
      // Wait for DOM to reflect filtered results
      await page.waitForFunction(
        (before) => document.querySelectorAll('.subscription-card').length < before,
        totalBefore,
        { timeout: 8000 }
      );

      const afterFilter = await allCards.count();
      expect(afterFilter).toBeLessThan(totalBefore);
    });

    test('clearing search restores all subscription cards', async ({ page }) => {
      const allCards = page.locator('.subscription-card');
      const totalBefore = await allCards.count();
      test.skip(totalBefore < 2, 'Need at least 2 subscriptions to test search reset');

      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.fill('input[placeholder="Search by service name"]', 'Netflix'),
      ]);

      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.fill('input[placeholder="Search by service name"]', ''),
      ]);

      await expect(allCards).toHaveCount(totalBefore, { timeout: 8000 });
    });

    test('search for nonexistent service shows no subscriptions message', async ({ page }) => {
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.fill('input[placeholder="Search by service name"]', 'XYZNONEXISTENTSERVICE12345'),
      ]);

      await expect(page.locator('text=No subscriptions found.')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Category Filter', () => {
    test('category dropdown is visible', async ({ page }) => {
      await expect(page.locator('select:has(option[value="All"])')).toBeVisible();
    });

    test('selecting a category filters the list', async ({ page }) => {
      const allCards = page.locator('.subscription-card');
      const countBefore = await allCards.count();
      test.skip(countBefore < 2, 'Need at least 2 subscriptions to test category filtering');

      const categorySelect = page.locator('select:has(option[value="All"])');

      await Promise.all([
        waitForSubscriptionsResponse(page),
        categorySelect.selectOption('Entertainment'),
      ]);

      const countAfter = await allCards.count();
      expect(countAfter).toBeLessThanOrEqual(countBefore);
    });

    test('selecting All category shows all subscriptions', async ({ page }) => {
      const allCards = page.locator('.subscription-card');
      const totalCount = await allCards.count();
      const categorySelect = page.locator('select:has(option[value="All"])');

      await Promise.all([
        waitForSubscriptionsResponse(page),
        categorySelect.selectOption('Entertainment'),
      ]);

      await Promise.all([
        waitForSubscriptionsResponse(page),
        categorySelect.selectOption('All'),
      ]);

      await expect(allCards).toHaveCount(totalCount, { timeout: 8000 });
    });
  });

  test.describe('Sorting', () => {
    test('sort controls are visible', async ({ page }) => {
      await expect(page.locator('select:has-text("Sort by Name")')).toBeVisible();
      await expect(page.locator('select:has-text("Ascending order")')).toBeVisible();
    });

    test('can sort by amount ascending', async ({ page }) => {
      // Default sortBy is service_name, so selecting amount triggers a new fetch
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.locator('select:has-text("Sort by Name")').selectOption('amount'),
      ]);
      // sortOrder is already 'asc' by default — no additional fetch needed
      await expect(page.locator('.subscription-card')).not.toHaveCount(0);
    });

    test('can sort by amount descending', async ({ page }) => {
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.locator('select:has-text("Sort by Name")').selectOption('amount'),
      ]);
      // 'asc' → 'desc' is a real change, triggers a new fetch
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.locator('select:has-text("Ascending order"), select:has-text("Descending order")').selectOption('desc'),
      ]);
      await expect(page.locator('.subscription-card')).not.toHaveCount(0);
    });

    test('can sort by next payment date', async ({ page }) => {
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.locator('select:has-text("Sort by Name")').selectOption('next_payment_date'),
      ]);
      await expect(page.locator('.subscription-card')).not.toHaveCount(0);
    });

    test('can sort by name alphabetically', async ({ page }) => {
      // Default is service_name — change away first, then back to ensure a real fetch
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.locator('select:has-text("Sort by Name")').selectOption('amount'),
      ]);
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.locator('select:has-text("Sort by Name")').selectOption('service_name'),
      ]);
      await expect(page.locator('.subscription-card')).not.toHaveCount(0);
    });

    test('can sort by created date', async ({ page }) => {
      const sortSelect = page.locator('select').filter({ hasText: 'Sort by' })
      await sortSelect.waitFor({ timeout: 5000 })
      await Promise.all([
        waitForSubscriptionsResponse(page),
        sortSelect.selectOption('created_at'),
      ]);
      await expect(page.locator('.subscription-card')).not.toHaveCount(0);
    });
  });
});
