import { test, expect } from "@playwright/test";

test.describe("Discography page", () => {
  test("renders discography page with album information", async ({ page }) => {
    await page.goto("/discography");

    await expect(page).toHaveTitle(/Discography/);

    // Wait for content to load
    await page.waitForLoadState("domcontentloaded");

    // Check for album-related content
    await expect(
      page.locator("text=/アルバム|Album|Original|Cover/i").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("displays album covers and titles", async ({ page }) => {
    await page.goto("/discography");

    await page.waitForLoadState("domcontentloaded");

    // Look for images (album covers)
    const images = page.locator("img");
    await expect(images.first()).toBeVisible({ timeout: 10000 });
  });
});
