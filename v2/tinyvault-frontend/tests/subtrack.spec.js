import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';

test('anasayfa yükleniyor', async ({ page }) => {
  await page.goto(URL);
  await expect(page).toHaveTitle(/TinyVault/);
});

test('abonelik listesi görünüyor', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('.subscription-card', { timeout: 10000 });
  const cards = page.locator('.subscription-card');
  await expect(cards).not.toHaveCount(0);
});

test('yeni abonelik eklenebiliyor', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('.subscription-card', { timeout: 10000 });

  await page.fill('input[placeholder="Service name"]', 'Test Abonelik');
  await page.fill('input[placeholder="Amount"]', '29.99');
  await page.fill('input[type="date"]', '2026-05-01');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Test Abonelik')).toBeVisible({ timeout: 10000 });
});

test('abonelik silinebiliyor', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('.subscription-card', { timeout: 10000 });

  const ilkKart = page.locator('.subscription-card').first();
  const isim = await ilkKart.locator('h3').textContent();

  await ilkKart.locator('.danger-btn').click();
  await expect(page.locator(`text=${isim}`)).not.toBeVisible({ timeout: 5000 });
});
