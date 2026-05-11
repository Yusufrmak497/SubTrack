/**
 * auth.spec.js — E2E tests for Authentication flows
 */

import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';

test.describe('Authentication', () => {

  test.describe('Login page', () => {
    test('login page renders correctly', async ({ page }) => {
      await page.goto(`${URL}/login`);
      await expect(page.locator('h2')).toContainText('Sign In');
      await expect(page.locator('input[placeholder="username"]')).toBeVisible();
      await expect(page.locator('input[placeholder="••••••"]')).toBeVisible();
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    });

    test('shows subtitle text on login page', async ({ page }) => {
      await page.goto(`${URL}/login`);
      await expect(page.locator('.auth-subtitle')).toBeVisible();
    });
  });

  test.describe('Successful login', () => {
    test('successful login redirects to dashboard', async ({ page }) => {
      await page.goto(`${URL}/login`);
      await page.fill('input[placeholder="username"]', 'admin_rojhat');
      await page.fill('input[placeholder="••••••"]', 'admin123');
      await page.click('button:has-text("Sign In")');
      await expect(page.locator('text=Active Subscriptions')).toBeVisible({ timeout: 15000 });
    });

    test('dashboard shows subscription list after login', async ({ page }) => {
      await page.goto(`${URL}/login`);
      await page.fill('input[placeholder="username"]', 'admin_rojhat');
      await page.fill('input[placeholder="••••••"]', 'admin123');
      await page.click('button:has-text("Sign In")');
      await page.waitForSelector('.subscription-card', { timeout: 15000 });
      const cards = page.locator('.subscription-card');
      await expect(cards).not.toHaveCount(0);
    });
  });

  test.describe('Failed login', () => {
    test('wrong password shows error message', async ({ page }) => {
      await page.goto(`${URL}/login`);
      await page.fill('input[placeholder="username"]', 'admin_rojhat');
      await page.fill('input[placeholder="••••••"]', 'wrongpassword');
      await page.click('button:has-text("Sign In")');
      await expect(page.locator('.auth-error')).toBeVisible({ timeout: 5000 });
    });

    test('wrong username shows error message', async ({ page }) => {
      await page.goto(`${URL}/login`);
      await page.fill('input[placeholder="username"]', 'nonexistent_user');
      await page.fill('input[placeholder="••••••"]', 'admin123');
      await page.click('button:has-text("Sign In")');
      await expect(page.locator('.auth-error')).toBeVisible({ timeout: 5000 });
    });

    test('stays on login page after failed login', async ({ page }) => {
      await page.goto(`${URL}/login`);
      await page.fill('input[placeholder="username"]', 'bad_user');
      await page.fill('input[placeholder="••••••"]', 'bad_pass');
      await page.click('button:has-text("Sign In")');
      await expect(page.locator('.auth-error')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[placeholder="username"]')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${URL}/login`);
      await page.fill('input[placeholder="username"]', 'admin_rojhat');
      await page.fill('input[placeholder="••••••"]', 'admin123');
      await page.click('button:has-text("Sign In")');
      await page.waitForSelector('.subscription-card', { timeout: 15000 });
    });

    test('logout button is visible in dashboard', async ({ page }) => {
      await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
    });

    test('clicking logout returns to login page', async ({ page }) => {
      await page.click('button:has-text("Sign Out")');
      await expect(page.locator('input[placeholder="username"]')).toBeVisible({ timeout: 5000 });
    });

    test('after logout, token is removed from localStorage', async ({ page }) => {
      await page.click('button:has-text("Sign Out")');
      await page.waitForSelector('input[placeholder="username"]');
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });

    test('after logout, navigating again shows login page', async ({ page }) => {
      await page.click('button:has-text("Sign Out")');
      await page.waitForSelector('input[placeholder="username"]');
      await page.goto(`${URL}/login`);
      await expect(page.locator('input[placeholder="username"]')).toBeVisible();
    });
  });

  test.describe('Token persistence', () => {
    test('stays logged in after page reload', async ({ page }) => {
      await page.goto(`${URL}/login`);
      await page.fill('input[placeholder="username"]', 'admin_rojhat');
      await page.fill('input[placeholder="••••••"]', 'admin123');
      await page.click('button:has-text("Sign In")');
      await page.waitForSelector('.subscription-card', { timeout: 15000 });
      await page.reload();
      await expect(page.locator('text=Active Subscriptions')).toBeVisible({ timeout: 10000 });
    });
  });
});
