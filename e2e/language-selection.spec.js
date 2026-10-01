import { expect, test } from '@playwright/test';

test('German stays the default and Chinese can be selected and retained on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Deutsch', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: 20000 });
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await expect(page.getByPlaceholder('输入家庭名称', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await page.reload();
  await expect(page.getByPlaceholder('输入家庭名称', { exact: true })).toBeVisible();
  await page.screenshot({ path: '.codex-tmp/chinese-login-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Deutsch', exact: true }).click();
  await expect(page.getByPlaceholder('Familienname eingeben', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});
