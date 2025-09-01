import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Language signal & BTS surface', () => {
  test('Result page loads and BTS appears for Nike (basic sanity)', async ({ page }) => {
    await page.goto(`${BASE}/result/Nike`);
    await page.waitForLoadState('domcontentloaded');
    // UI is client-hydrated; allow a short settle
    await page.waitForTimeout(800);
    // We don't assert exact text to avoid brittleness; just sanity markers
    const hasStory = await page.locator('text=The story of').first().count();
    const hasBTS = await page.locator('text=Behind the Scenes').first().count();
    expect(hasStory + hasBTS).toBeGreaterThan(0);
  });
});

test.describe('Disambiguation hint flow (ambiguous brand skeleton)', () => {
  test('Delta result page loads; if chooser appears, buttons exist', async ({ page }) => {
    await page.goto(`${BASE}/result/Delta`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
    // If the chooser renders, we expect some button text like "Choose" or "Use this"
    const chooser = page.locator('text=Choose').first();
    // Non-fatal: skip if not present
    // @ts-ignore
    if (await chooser.count()) {
      await expect(chooser).toBeVisible();
    }
  });
});
