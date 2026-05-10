/**
 * subscriptions.spec.js — E2E tests for Subscription CRUD operations
 *
 * Covers:
 *  - Creating new subscriptions (Monthly + Yearly)
 *  - Form validation on empty submit
 *  - Deleting subscriptions
 *  - Opening detail modal by clicking a card
 *  - Editing subscription in modal (save changes)
 *  - Pause/Resume toggle in detail modal
 *  - Closing modal via overlay click
 *  - Audit history in detail modal
 */

import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';

async function loginAndWait(page) {
  await page.goto(URL);
  await page.fill('input[placeholder="Kullanıcı adı"]', 'admin_rojhat');
  await page.fill('input[placeholder="Şifre"]', 'admin123');
  await page.click('button:has-text("Giriş Yap")');
  await page.waitForSelector('.subscription-card', { timeout: 15000 });
}

async function createSubscription(page, name, { billing = 'Monthly', amount = '9.99', date = '2026-06-15' } = {}) {
  await page.fill('input[placeholder="Service name"]', name);
  await page.selectOption('select[name="billing_cycle"]', billing);
  await page.fill('input[name="amount"]', amount);
  await page.fill('input[type="date"]', date);
  await page.click('button[type="submit"]');
  await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 10000 });
}

async function deleteSubscriptionByName(page, name) {
  const card = page.locator('.subscription-card', { hasText: name });
  await card.locator('.danger-btn').click();
  await expect(page.locator(`.subscription-card:has-text("${name}")`)).toHaveCount(0, { timeout: 10000 });
}

test.describe('Subscriptions — Create', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndWait(page);
  });

  test('Add Subscription form is visible', async ({ page }) => {
    await expect(page.locator('text=Add New Subscription')).toBeVisible();
  });

  test('can add a Monthly subscription', async ({ page }) => {
    const name = `TestSub_${Date.now()}`;
    await createSubscription(page, name, { billing: 'Monthly', amount: '12.99', date: '2026-06-15' });
    await deleteSubscriptionByName(page, name);
  });

  test('can add a Yearly subscription', async ({ page }) => {
    const name = `YearlySub_${Date.now()}`;
    await createSubscription(page, name, { billing: 'Yearly', amount: '99.99', date: '2026-12-01' });
    await deleteSubscriptionByName(page, name);
  });

  test('form validation: empty service name shows error toast', async ({ page }) => {
    await page.fill('input[name="amount"]', '5.00');
    await page.fill('input[type="date"]', '2026-06-01');
    await page.click('button:has-text("Add Subscription")');
    await expect(page.getByText('Please fill all fields.')).toBeVisible({ timeout: 5000 });
  });

  test('form resets after successful subscription creation', async ({ page }) => {
    const name = `ResetTest_${Date.now()}`;
    await page.fill('input[placeholder="Service name"]', name);
    await page.fill('input[name="amount"]', '8.00');
    await page.fill('input[type="date"]', '2026-07-01');
    await page.click('button[type="submit"]');

    await expect(page.locator('input[placeholder="Service name"]')).toHaveValue('', { timeout: 10000 });

    await deleteSubscriptionByName(page, name);
  });
});

test.describe('Subscriptions — Delete', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndWait(page);
  });

  test('can delete a subscription and count decreases', async ({ page }) => {
    const name = `DeleteTest_${Date.now()}`;
    await createSubscription(page, name);

    const cards = page.locator('.subscription-card');
    const initialCount = await cards.count();

    const card = page.locator('.subscription-card', { hasText: name });
    await card.locator('.danger-btn').click();

    await expect(cards).toHaveCount(initialCount - 1, { timeout: 10000 });
  });

  test('shows success toast after deletion', async ({ page }) => {
    const name = `ToastDeleteTest_${Date.now()}`;
    await createSubscription(page, name);

    const card = page.locator('.subscription-card', { hasText: name });
    await card.locator('.danger-btn').click();

    await expect(page.getByText('Subscription removed.')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Subscriptions — Detail Modal', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndWait(page);
  });

  test('clicking a card opens detail modal', async ({ page }) => {
    await page.locator('.subscription-card').first().click();
    await expect(page.locator('.detail-card')).toBeVisible({ timeout: 5000 });
  });

  test('detail modal shows subscription name', async ({ page }) => {
    const firstCard = page.locator('.subscription-card').first();
    const cardName = await firstCard.locator('h3').textContent();
    await firstCard.click();

    await expect(page.locator('.detail-card h3')).toContainText(cardName);
  });

  test('detail modal shows status badge', async ({ page }) => {
    await page.locator('.subscription-card').first().click();
    await expect(page.locator('.status-badge')).toBeVisible({ timeout: 5000 });
  });

  test('detail modal has Edit button', async ({ page }) => {
    await page.locator('.subscription-card').first().click();
    await expect(page.locator('button:has-text("✏️ Edit")')).toBeVisible({ timeout: 5000 });
  });

  test('detail modal has Pause/Resume button', async ({ page }) => {
    await page.locator('.subscription-card').first().click();
    const pauseBtn = page.locator('button:has-text("⏸ Pause"), button:has-text("▶️ Resume")');
    await expect(pauseBtn).toBeVisible({ timeout: 5000 });
  });

  test('detail modal has Calendar button', async ({ page }) => {
    await page.locator('.subscription-card').first().click();
    await expect(page.locator('a:has-text("📅 Calendar")')).toBeVisible({ timeout: 5000 });
  });

  test('detail modal has Close button', async ({ page }) => {
    await page.locator('.subscription-card').first().click();
    await expect(page.locator('button:has-text("Close")')).toBeVisible({ timeout: 5000 });
  });

  test('clicking Close button hides the modal', async ({ page }) => {
    await page.locator('.subscription-card').first().click();
    await page.waitForSelector('.detail-card');
    await page.click('button:has-text("Close")');
    await expect(page.locator('.detail-card')).not.toBeVisible({ timeout: 5000 });
  });

  test('clicking overlay closes the modal', async ({ page }) => {
    await page.locator('.subscription-card').first().click();
    await page.waitForSelector('.detail-card');

    await page.locator('.overlay').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('.detail-card')).not.toBeVisible({ timeout: 5000 });
  });

  test('detail modal shows SubTrack History section', async ({ page }) => {
    await page.locator('.subscription-card').first().click();
    await expect(page.locator('text=SubTrack History')).toBeVisible({ timeout: 5000 });
  });

  test.describe('Edit mode', () => {
    test('clicking Edit enters edit mode', async ({ page }) => {
      await page.locator('.subscription-card').first().click();
      await page.waitForSelector('.detail-card');
      await page.click('button:has-text("✏️ Edit")');

      await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    });

    test('Cancel in edit mode restores view mode', async ({ page }) => {
      await page.locator('.subscription-card').first().click();
      await page.waitForSelector('.detail-card');
      await page.click('button:has-text("✏️ Edit")');
      await page.click('button:has-text("Cancel")');

      await expect(page.locator('button:has-text("✏️ Edit")')).toBeVisible({ timeout: 5000 });
    });

    test('can save edited subscription amount', async ({ page }) => {
      await page.locator('.subscription-card').first().click();
      await page.waitForSelector('.detail-card');
      await page.click('button:has-text("✏️ Edit")');

      const amountInput = page.locator('input[type="number"]').first();
      await amountInput.fill('99.99');

      await page.click('button:has-text("Save Changes")');
      await expect(page.getByText('Subscription updated!')).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('Pause/Resume', () => {
    test('can toggle pause on an active subscription', async ({ page }) => {
      await page.locator('.subscription-card').first().click();
      await page.waitForSelector('.detail-card');

      const pauseBtn = page.locator('button:has-text("⏸ Pause")');
      const resumeBtn = page.locator('button:has-text("▶️ Resume")');

      const isPaused = await pauseBtn.count() === 0;

      if (isPaused) {
        await resumeBtn.click();
      } else {
        await pauseBtn.click();
      }

      await expect(page.getByText('Subscription updated!')).toBeVisible({ timeout: 8000 });
    });
  });
});

test.describe('Subscriptions — Page title', () => {
  test('page has correct title', async ({ page }) => {
    await loginAndWait(page);
    await expect(page).toHaveTitle(/TinyVault/);
  });
});
