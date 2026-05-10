/**
 * auth.spec.js — E2E tests for Authentication flows
 *
 * Covers:
 *  - Successful login navigates to dashboard
 *  - Wrong credentials shows error message
 *  - Logout returns to login page
 *  - Direct dashboard access without token redirects to login
 */

import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';

test.describe('Authentication', () => {

  test.describe('Login page', () => {
    test('login page renders correctly', async ({ page }) => {
      await page.goto(URL);
      await expect(page.locator('h1')).toContainText('TinyVault');
      await expect(page.locator('input[placeholder="Kullanıcı adı"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Şifre"]')).toBeVisible();
      await expect(page.locator('button:has-text("Giriş Yap")')).toBeVisible();
    });

    test('shows subtitle text on login page', async ({ page }) => {
      await page.goto(URL);
      await expect(page.locator('text=Aboneliklerini yönet')).toBeVisible();
    });
  });

  test.describe('Successful login', () => {
    test('successful login redirects to dashboard', async ({ page }) => {
      await page.goto(URL);
      await page.fill('input[placeholder="Kullanıcı adı"]', 'admin_rojhat');
      await page.fill('input[placeholder="Şifre"]', 'admin123');
      await page.click('button:has-text("Giriş Yap")');

      // Dashboard renders — look for summary cards
      await expect(page.locator('text=Active Subscriptions')).toBeVisible({ timeout: 15000 });
    });

    test('dashboard shows subscription list after login', async ({ page }) => {
      await page.goto(URL);
      await page.fill('input[placeholder="Kullanıcı adı"]', 'admin_rojhat');
      await page.fill('input[placeholder="Şifre"]', 'admin123');
      await page.click('button:has-text("Giriş Yap")');

      await page.waitForSelector('.subscription-card', { timeout: 15000 });
      const cards = page.locator('.subscription-card');
      await expect(cards).not.toHaveCount(0);
    });
  });

  test.describe('Failed login', () => {
    test('wrong password shows error message', async ({ page }) => {
      await page.goto(URL);
      await page.fill('input[placeholder="Kullanıcı adı"]', 'admin_rojhat');
      await page.fill('input[placeholder="Şifre"]', 'wrongpassword');
      await page.click('button:has-text("Giriş Yap")');
      await expect(page.locator('.error-text')).toBeVisible({ timeout: 5000 });
    });

    test('wrong username shows error message', async ({ page }) => {
      await page.goto(URL);
      await page.fill('input[placeholder="Kullanıcı adı"]', 'nonexistent_user');
      await page.fill('input[placeholder="Şifre"]', 'admin123');
      await page.click('button:has-text("Giriş Yap")');
      await expect(page.locator('.error-text')).toBeVisible({ timeout: 5000 });
    });

    test('stays on login page after failed login', async ({ page }) => {
      await page.goto(URL);
      await page.fill('input[placeholder="Kullanıcı adı"]', 'bad_user');
      await page.fill('input[placeholder="Şifre"]', 'bad_pass');
      await page.click('button:has-text("Giriş Yap")');

      await expect(page.locator('.error-text')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[placeholder="Kullanıcı adı"]')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(URL);
      await page.fill('input[placeholder="Kullanıcı adı"]', 'admin_rojhat');
      await page.fill('input[placeholder="Şifre"]', 'admin123');
      await page.click('button:has-text("Giriş Yap")');
      await page.waitForSelector('.subscription-card', { timeout: 15000 });
    });

    test('logout button is visible in dashboard', async ({ page }) => {
      await expect(page.locator('button:has-text("Çıkış Yap")')).toBeVisible();
    });

    test('clicking logout returns to login page', async ({ page }) => {
      await page.click('button:has-text("Çıkış Yap")');
      await expect(page.locator('input[placeholder="Kullanıcı adı"]')).toBeVisible({ timeout: 5000 });
    });

    test('after logout, token is removed from localStorage', async ({ page }) => {
      await page.click('button:has-text("Çıkış Yap")');
      await page.waitForSelector('input[placeholder="Kullanıcı adı"]');
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });

    test('after logout, navigating again shows login page', async ({ page }) => {
      await page.click('button:has-text("Çıkış Yap")');
      await page.waitForSelector('input[placeholder="Kullanıcı adı"]');
      await page.goto(URL);
      await expect(page.locator('input[placeholder="Kullanıcı adı"]')).toBeVisible();
    });
  });

  test.describe('Token persistence', () => {
    test('stays logged in after page reload', async ({ page }) => {
      await page.goto(URL);
      await page.fill('input[placeholder="Kullanıcı adı"]', 'admin_rojhat');
      await page.fill('input[placeholder="Şifre"]', 'admin123');
      await page.click('button:has-text("Giriş Yap")');
      await page.waitForSelector('.subscription-card', { timeout: 15000 });

      // Reload and check we're still logged in
      await page.reload();
      await expect(page.locator('text=Active Subscriptions')).toBeVisible({ timeout: 10000 });
    });
  });
});
