import { test, expect } from "@playwright/test";

test.describe("Summary pages", () => {
  test.describe("Summary index page", () => {
    test("displays yearly activity summary", async ({ page }) => {
      await page.goto("/summary");

      await expect(page).toHaveTitle(/年ごとの活動記録/);

      await page.waitForLoadState("domcontentloaded");

      // Check for heading
      await expect(
        page.getByRole("heading", { name: /年ごとの活動記録/i }),
      ).toBeVisible();
    });

    test("shows breadcrumbs navigation", async ({ page }) => {
      await page.goto("/summary");

      await page.waitForLoadState("domcontentloaded");

      // Look for breadcrumb navigation
      const homeLink = page.getByRole("link", { name: /Home/i });
      await expect(homeLink).toBeVisible();
    });

    test("displays year links", async ({ page }) => {
      await page.goto("/summary");

      await page.waitForLoadState("domcontentloaded");

      // Look for year links (e.g., 2024, 2023, etc.)
      const yearLinks = page.getByRole("link", { name: /20\d{2}/ });
      expect(await yearLinks.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Year detail page", () => {
    test("displays specific year summary", async ({ page }) => {
      // Test with a recent year that likely has data
      await page.goto("/summary/2024");

      await page.waitForLoadState("domcontentloaded");
    });

    test("shows year-specific statistics", async ({ page }) => {
      await page.goto("/summary/2024");

      await page.waitForLoadState("domcontentloaded");

      // Check for year heading (h1)
      await expect(
        page.getByRole("heading", { name: "2024年", exact: true, level: 1 }),
      ).toBeVisible();
    });

    test("displays breadcrumbs with year", async ({ page }) => {
      await page.goto("/summary/2024");

      await page.waitForLoadState("domcontentloaded");

      const summaryLink = page.getByRole("link", { name: /年ごとの活動記録/i });
      await expect(summaryLink).toBeVisible();
    });
  });
});
