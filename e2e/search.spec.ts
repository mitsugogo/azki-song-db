import { test, expect } from "@playwright/test";

test.describe("Search page", () => {
  test("renders search interface", async ({ page }) => {
    await page.goto("/search");

    await expect(page).toHaveTitle(/AZKi Song Database/);

    await page.waitForLoadState("domcontentloaded");
  });

  test("performs search with query parameter", async ({ page }) => {
    await page.goto("/search?q=test");

    await page.waitForLoadState("domcontentloaded");
  });

  test("handles special search prefixes", async ({ page }) => {
    const searchPrefixes = ["artist:", "tag:", "title:", "year:"];

    for (const prefix of searchPrefixes) {
      await page.goto(`/search?q=${prefix}test`);
      await page.waitForLoadState("domcontentloaded");
    }
  });
});
