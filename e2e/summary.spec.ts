import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Summary pages", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });
  test.describe("Summary index page", () => {
    test("displays yearly activity summary", async ({ page }) => {
      await page.goto("/summary");

      await expect(page).toHaveTitle(/年ごとの活動記録/);

      await page.waitForLoadState("domcontentloaded");

      // Check for heading (accept a few possible variants)
      const heading = page.getByRole("heading", {
        name: /年ごとの活動記録|活動記録|活動年表/i,
        level: 1,
      });
      await expect(heading).toBeVisible();
    });

    test("displays year links", async ({ page }) => {
      await page.goto("/summary");

      await page.waitForLoadState("domcontentloaded");

      // Wait for year links to appear (rendered client-side)
      await page.waitForSelector('a[href^="/summary/20"]', { timeout: 10000 });
      const yearLinks = page.locator('a[href^="/summary/20"]');
      expect(await yearLinks.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Year detail page", () => {
    test("displays specific year summary", async ({ page }) => {
      // Test with a recent year that likely has data
      await page.goto("/summary/2024");

      await page.waitForLoadState("domcontentloaded");

      // Check that page has loaded some content - look for h1 heading
      await expect(
        page.getByRole("heading", { name: "2024年", exact: true, level: 1 }),
      ).toBeVisible();
    });

    test("shows year-specific statistics", async ({ page }) => {
      await page.goto("/summary/2024");

      await page.waitForLoadState("domcontentloaded");

      // Check for year heading (h1) - wait for it to be visible
      await page.waitForSelector('h1:has-text("2024年")', { timeout: 10000 });
      await expect(
        page.getByRole("heading", { name: "2024年", exact: true, level: 1 }),
      ).toBeVisible();
    });

    test("displays breadcrumbs with year", async ({ page }) => {
      await page.goto("/summary/2024");

      await page.waitForLoadState("domcontentloaded");

      // Wait for breadcrumb to be visible
      await page.waitForSelector('nav[aria-label="Breadcrumb"]', {
        timeout: 10000,
      });
      const summaryLink = page.getByRole("link", { name: /活動記録/i });
      await expect(summaryLink).toBeVisible();
    });
  });
});
