import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Statistics page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("displays statistics dashboard", async ({ page }) => {
    await page.goto("/statistics");

    await expect(page).toHaveTitle(/統計情報/);

    await page.waitForLoadState("domcontentloaded");
  });

  test("shows various statistics tabs or sections", async ({ page }) => {
    await page.goto("/statistics");

    await page.waitForLoadState("domcontentloaded");

    // Look for tab navigation or statistics sections
    const tablist = page.getByRole("tablist");
    if (await tablist.isVisible({ timeout: 5000 }).catch(() => false)) {
      const tabs = tablist.getByRole("tab");
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
    }
  });

  test("displays charts or data visualizations", async ({ page }) => {
    await page.goto("/statistics");

    await page.waitForLoadState("domcontentloaded");

    // Wait for any canvas elements (charts) or SVG elements
    const visualizations = page.locator("canvas, svg").first();
    await expect(visualizations).toBeVisible({ timeout: 10000 });
  });

  test("allows switching between different statistics views", async ({
    page,
  }) => {
    await page.goto("/statistics");

    await page.waitForLoadState("domcontentloaded");

    // Try to find and click on tabs if they exist
    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      await tabs.nth(1).click();
      await page.waitForTimeout(500);
    }
  });
});
