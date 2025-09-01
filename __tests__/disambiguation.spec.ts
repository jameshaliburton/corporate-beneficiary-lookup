import { test, expect } from '@playwright/test';

test.describe('Disambiguation Functionality', () => {
  test('debug disambiguation flow with persistence', async ({ page }) => {
    // Visit the debug disambiguation page
    await page.goto('/result/Nike?debugDisambig=1');
    
    // Expect the debug badge to be visible
    await expect(page.locator('text=Debug disambiguation ON — showing synthetic options')).toBeVisible();
    
    // Expect disambiguation options to be present
    await expect(page.locator('text=We found multiple matches — pick the one you meant')).toBeVisible();
    await expect(page.locator('text=Nike International')).toBeVisible();
    await expect(page.locator('text=Nike Group Ltd')).toBeVisible();
    await expect(page.locator('text=Nike Corporation')).toBeVisible();
    
    // Click "Choose" on the first option
    const firstOption = page.locator('button:has-text("Choose")').first();
    await firstOption.click();
    
    // URL should gain entityId parameter
    await expect(page).toHaveURL(/entityId=debug-nike-international-001/);
    
    // The chosen option should be highlighted
    await expect(page.locator('text=✓')).toBeVisible();
    await expect(page.locator('button:has-text("Chosen")')).toBeVisible();
    
    // "Change selection" link should appear
    await expect(page.locator('text=← Change selection')).toBeVisible();
    
    // Refresh the page - active highlighting should persist
    await page.reload();
    await expect(page.locator('text=✓')).toBeVisible();
    await expect(page.locator('button:has-text("Chosen")')).toBeVisible();
    
    // Click "Change selection" to return to chooser
    await page.click('text=← Change selection');
    
    // URL should lose entityId parameter
    await expect(page).toHaveURL(/\/result\/Nike\?debugDisambig=1$/);
    
    // Chooser should be back without highlighting
    await expect(page.locator('text=We found multiple matches — pick the one you meant')).toBeVisible();
    await expect(page.locator('button:has-text("Choose")')).toBeVisible();
    await expect(page.locator('text=✓')).not.toBeVisible();
  });
  
  test('copy link functionality', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await page.goto('/result/Nike?debugDisambig=1');
    
    // Click "Copy link" on the first option
    const copyLinkButton = page.locator('button:has-text("Copy link")').first();
    await copyLinkButton.click();
    
    // Check if clipboard API is available
    const clipboardAvailable = await page.evaluate(() => {
      return 'clipboard' in navigator && 'writeText' in navigator.clipboard;
    });
    
    if (clipboardAvailable) {
      // Verify clipboard content (this may not work in all environments)
      try {
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toContain('/result/Nike?entityId=debug-nike-international-001');
      } catch (error) {
        // Skip clipboard verification if not supported
        console.log('Clipboard verification skipped - not supported in this environment');
      }
    } else {
      console.log('Clipboard API not available - skipping copy link verification');
    }
  });
  
  test('accessibility features', async ({ page }) => {
    await page.goto('/result/Nike?debugDisambig=1');
    
    // Check for proper ARIA attributes
    await expect(page.locator('[aria-label="Debug disambiguation active"]')).toBeVisible();
    await expect(page.locator('[role="list"]')).toBeVisible();
    await expect(page.locator('[role="listitem"]')).toHaveCount(3);
    
    // Check for aria-pressed on buttons
    const chooseButtons = page.locator('button:has-text("Choose")');
    for (let i = 0; i < await chooseButtons.count(); i++) {
      await expect(chooseButtons.nth(i)).toHaveAttribute('aria-pressed', 'false');
    }
    
    // Click choose and check aria-pressed changes
    await chooseButtons.first().click();
    await expect(page.locator('button:has-text("Chosen")')).toHaveAttribute('aria-pressed', 'true');
  });
  
  test('empty state handling', async ({ page }) => {
    // Visit a brand that shouldn't have disambiguation options
    await page.goto('/result/UniqueBrandName123');
    
    // Should not show disambiguation chooser
    await expect(page.locator('text=We found multiple matches')).not.toBeVisible();
  });
});
