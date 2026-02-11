import { test, expect } from '@playwright/test';

test('homepage loads and has app container', async ({ page, baseURL }) => {
  await page.goto(baseURL || 'http://127.0.0.1:8000');
  // basic smoke checks
  await expect(page).toHaveTitle(/Laravel|Gludio|Panel/);
  const app = await page.locator('#app');
  await expect(app).toBeVisible({ timeout: 5000 });
});
