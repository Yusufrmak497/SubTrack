/**
 * filters.spec.js — E2E tests for Filtering & Sorting features
 *
 * Covers:
 *  - Search by service name filters cards
 *  - Clearing search shows all cards
 *  - Category filter chips show relevant cards
 *  - Sort by chip buttons
 *  - Sort order toggle button
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
      await expect(page.locator('input[placeholder="Search subscriptions…"]')).toBeVisible();
    });

    test('typing in search filters subscription cards', async ({ page }) => {
      const allCards = page.locator('.subscription-card');
      const totalBefore = await allCards.count();
      test.skip(totalBefore < 2, 'Need at least 2 subscriptions to test search filtering');

      await page.fill('input[placeholder="Search subscriptions…"]', 'Netflix');
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
        page.fill('input[placeholder="Search subscriptions…"]', 'Netflix'),
      ]);

      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.fill('input[placeholder="Search subscriptions…"]', ''),
      ]);

      await expect(allCards).toHaveCount(totalBefore, { timeout: 8000 });
    });

    test('search for nonexistent service shows no subscriptions message', async ({ page }) => {
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.fill('input[placeholder="Search subscriptions…"]', 'XYZNONEXISTENTSERVICE12345'),
      ]);

      await expect(page.locator('text=No subscriptions found.')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Category Filter', () => {
    test('category chip buttons are visible', async ({ page }) => {
      const chips = page.locator('.category-chips');
      await expect(chips.getByRole('button', { name: 'All' })).toBeVisible();
      await expect(chips.getByRole('button', { name: 'Entertainment' })).toBeVisible();
    });

    test('selecting a category chip filters the list', async ({ page }) => {
      const allCards = page.locator('.subscription-card');
      const countBefore = await allCards.count();
      test.skip(countBefore < 2, 'Need at least 2 subscriptions to test category filtering');

      const chips = page.locator('.category-chips');
      await Promise.all([
        waitForSubscriptionsResponse(page),
        chips.getByRole('button', { name: 'Entertainment' }).click(),
      ]);

      const countAfter = await allCards.count();
      expect(countAfter).toBeLessThanOrEqual(countBefore);
    });

    test('selecting All chip shows all subscriptions', async ({ page }) => {
      const allCards = page.locator('.subscription-card');
      const totalCount = await allCards.count();
      const chips = page.locator('.category-chips');

      await Promise.all([
        waitForSubscriptionsResponse(page),
        chips.getByRole('button', { name: 'Entertainment' }).click(),
      ]);

      await Promise.all([
        waitForSubscriptionsResponse(page),
        chips.getByRole('button', { name: 'All' }).click(),
      ]);

      await expect(allCards).toHaveCount(totalCount, { timeout: 8000 });
    });
  });

  test.describe('Sorting', () => {
    test('sort chip buttons are visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Name' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Price' })).toBeVisible();
    });

    test('can sort by amount', async ({ page }) => {
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.getByRole('button', { name: 'Price' }).click(),
      ]);
      await expect(page.locator('.subscription-card')).not.toHaveCount(0);
    });

    test('can toggle sort order', async ({ page }) => {
      const sortOrderBtn = page.locator('.sort-order-btn');
      await expect(sortOrderBtn).toBeVisible();
      await Promise.all([
        waitForSubscriptionsResponse(page),
        sortOrderBtn.click(),
      ]);
      await expect(page.locator('.subscription-card')).not.toHaveCount(0);
    });

    test('can sort by next payment date', async ({ page }) => {
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.getByRole('button', { name: 'Next Payment' }).click(),
      ]);
      await expect(page.locator('.subscription-card')).not.toHaveCount(0);
    });

    test('can sort by name alphabetically', async ({ page }) => {
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.getByRole('button', { name: 'Price' }).click(),
      ]);
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.getByRole('button', { name: 'Name' }).click(),
      ]);
      await expect(page.locator('.subscription-card')).not.toHaveCount(0);
    });

    test('can sort by created date', async ({ page }) => {
      await Promise.all([
        waitForSubscriptionsResponse(page),
        page.getByRole('button', { name: 'Created' }).click(),
      ]);
      await expect(page.locator('.subscription-card')).not.toHaveCount(0);
    });
  });
});
