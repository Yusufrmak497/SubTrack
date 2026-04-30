import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';

// Her testten önce giriş yap
test.beforeEach(async ({ page }) => {
  await page.goto(URL);
  await page.fill('input[placeholder="Kullanıcı adı"]', 'admin_rojhat');
  await page.fill('input[placeholder="Şifre"]', 'admin123');
  await page.click('button:has-text("Giriş Yap")');

  // Abonelik listesinin yüklenmesini bekle
  await page.waitForSelector('.subscription-card', { timeout: 15000 });
});

test('anasayfa yükleniyor', async ({ page }) => {
  await expect(page).toHaveTitle(/TinyVault/);
});

test('abonelik listesi görünüyor', async ({ page }) => {
  const cards = page.locator('.subscription-card');
  await expect(cards).not.toHaveCount(0);
});

test('yeni abonelik eklenebiliyor', async ({ page }) => {
  await page.fill('input[placeholder="Service name"]', 'Test Abonelik');
  await page.fill('input[placeholder="Amount"]', '29.99');
  await page.fill('input[type="date"]', '2026-05-01');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Test Abonelik').first()).toBeVisible({ timeout: 10000 });
});

test('abonelik silinebiliyor', async ({ page }) => {
  const cards = page.locator('.subscription-card');
  const initialCount = await cards.count();
  
  const ilkKart = cards.first();
  await ilkKart.locator('.danger-btn').click();
  
  // Kart sayısının bir azaldığını doğrula
  await expect(cards).toHaveCount(initialCount - 1, { timeout: 10000 });
});
