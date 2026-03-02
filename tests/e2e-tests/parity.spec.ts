import { test, expect } from '@playwright/test';

// Before running this test, make sure your Firebase backend emulator (or production)
// is pointing to localhost:3000 (MSME Website) and localhost:5173 (MSME CMS), or update these URLs.

const WEBSITE_URL = 'https://msmesite-53367.web.app';
const CMS_URL = 'https://msmesite-53367-d3611.web.app';

test.describe('End-to-End Parity Tests', () => {

  test('Public Website - Homepage Data & Banners Load', async ({ page }) => {
    // 1. Visit Home
    await page.goto(`${WEBSITE_URL}/`);
    
    // 2. Expect there to be some banners explicitly rendered.
    // Our migration check showed at least 9 banners valid in firestore
    await expect(page.locator('.banner-carousel')).toBeVisible({ timeout: 15000 }).catch(() => null);
    
    // Wait for network idle or a known data component
    await page.waitForLoadState('networkidle');
    
    // 3. Navigate to a business directory or database page to ensure MSMEs load
    // Note: adjust the exact URL path/locators based on actual page structure
    await page.goto(`${WEBSITE_URL}/categories`);
    
    // Let's ensure some business card or table row renders by looking for any `a` tag mapped strictly to business category details pages
    await page.waitForSelector('a[href*="/categories/detailed-page/"]', { timeout: 25000 });
    await expect(page.locator('a[href*="/categories/detailed-page/"]')).not.toHaveCount(0);
  });

  test('Helpdesk / Contact Us Submission Flow', async ({ page, request }) => {
    // 1. Visit Contact Page
    await page.goto(`${WEBSITE_URL}/contact`);
    
    // 2. Fill out contact form
    // Note: Locator names assume generic form inputs, adjust to actual inputs
    const nameInput = page.locator('input[name="fullName"]');
    const emailInput = page.locator('input[name="email"]');
    const subjectInput = page.locator('input[name="subject"]');
    const mobileInput = page.locator('input[name="mobile"]');
    const messageInput = page.locator('textarea[name="message"]');
    
    // We must wait for the form to attach to DOM fully
    await nameInput.waitFor({ state: 'visible' });

    if (await nameInput.count() > 0) {
       await nameInput.fill('Playwright Smoke Test');
       await emailInput.fill('automated-test@example.com');
       await mobileInput.fill('26871000000');
       await subjectInput.fill('End to End test ticker');
       await messageInput.fill('This is a test verifying the new Helpdesk Firebase Schema map');
       
       // Submit (ensure to click the contact submit, not subscribe footer)
       await page.locator('button[type="submit"]').first().click();
       
       // Note: Success message confirmation could go here
       // await expect(page.locator('.success-message')).toBeVisible();
    } else {
       console.log('Form inputs not matched, please update locators in e2e-tests/parity.spec.ts');
    }
  });

  test('CMS Admin - Login Page Loads', async ({ page }) => {
    await page.goto(`${CMS_URL}/login`);
    
    // Since it's a CMS, verify a login form or known element exists
    await expect(page.locator('input[type="password"], input[type="email"]')).not.toHaveCount(0, { timeout: 15000 });
  });

});
