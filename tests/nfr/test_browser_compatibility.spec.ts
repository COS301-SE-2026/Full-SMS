import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://fullsms.duckdns.org';

test.describe('NFR6.1.1 Browser Compatibility', () => {

  test.describe('Homepage Loading', () => {
    test('should load without JavaScript errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('pageerror', (err) => {
        errors.push(`Page Error: ${err.message}`);
      });

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(`Console Error: ${msg.text()}`);
        }
      });

      await page.goto(FRONTEND_URL);
      await page.waitForLoadState('networkidle');

      if (errors.length > 0) {
        console.log('Errors found:', errors);
      }

      expect(errors).toHaveLength(0);
    });

    test('should have valid page title', async ({ page }) => {
      await page.goto(FRONTEND_URL);
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should render main content area', async ({ page }) => {
      await page.goto(FRONTEND_URL);
      await page.waitForLoadState('domcontentloaded');

      const mainContent = page.locator('main, #root, #app, [role="main"]');
      await expect(mainContent.first()).toBeVisible();
    });
  });

  test.describe('Authentication Pages', () => {
    test('should render login form correctly', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`);

      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should render register form correctly', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/register`);

      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"]').first();

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should have functional navigation', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      const navLinks = page.locator('nav a, header a');
      const count = await navLinks.count();

      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(count, 3); i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');

        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          await link.click();
          await page.waitForLoadState('networkidle');

          const currentUrl = page.url();
          expect(currentUrl).toBeTruthy();
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Laptop', width: 1366, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];

    for (const viewport of viewports) {
      test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(FRONTEND_URL);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
      });
    }
  });

  test.describe('Form Interactions', () => {
    test('should allow typing in form inputs', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`);

      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"]');

      await emailInput.fill('test@example.com');
      await passwordInput.fill('testpassword123');

      await expect(emailInput).toHaveValue('test@example.com');
      await expect(passwordInput).toHaveValue('testpassword123');
    });

    test('should show form validation errors', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(500);

      const invalidInputs = page.locator('input:invalid, [aria-invalid="true"], .error, .invalid');
      const errorMessages = page.locator('.error-message, [role="alert"], .text-red-500, .text-destructive');

      const hasInvalidInputs = await invalidInputs.count() > 0;
      const hasErrorMessages = await errorMessages.count() > 0;

      expect(hasInvalidInputs || hasErrorMessages).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('should have alt text on images', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        expect(alt !== null || role === 'presentation').toBeTruthy();
      }
    });

    test('should have focusable interactive elements', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      const buttons = page.locator('button:not([disabled])');
      const links = page.locator('a[href]');

      const buttonCount = await buttons.count();
      const linkCount = await links.count();

      expect(buttonCount + linkCount).toBeGreaterThan(0);

      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
    });
  });
});
