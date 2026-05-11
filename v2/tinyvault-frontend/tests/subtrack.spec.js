/**
 * subtrack.spec.js — Golden-path smoke tests
 *
 * Minimal sanity check: login → dashboard renders → create → modal close.
 * Full coverage lives in auth, subscriptions, filters, ui spec files.
 */

import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';

import { loginAsAdminFast } from './helpers/auth.js';
async function login(page) {
  await loginAsAdminFast(page);
  if (!page.url().includes('/app')) await page.goto('http://localhost:5173/app');
  await page.waitForSelector('.subscription-card', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test('login and dashboard renders', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Active Subscriptions')).toBeVisible();
  await expect(page.locator('.subscription-card').first()).toBeVisible();
});

test('can create and then delete a subscription', async ({ page }) => {
  await login(page);

  const name = `Smoke_${Date.now()}`;
  await page.fill('input[placeholder="Service name"]', name);
  await page.fill('input[name="amount"]', '9.99');
  await page.fill('input[type="date"]', '2026-07-01');
  await page.click('button[type="submit"]');
  await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 10000 });

  const card = page.locator('.subscription-card', { hasText: name });
  await card.locator('.danger-btn').click();
  await expect(page.locator(`text=${name}`)).toHaveCount(0, { timeout: 10000 });
});

test('detail modal opens and closes', async ({ page }) => {
  await login(page);
  await page.locator('.subscription-card').first().click();
  await expect(page.locator('.detail-card')).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Close")');
  await expect(page.locator('.detail-card')).not.toBeVisible({ timeout: 5000 });
});
