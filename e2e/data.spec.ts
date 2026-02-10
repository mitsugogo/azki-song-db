import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Data page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("displays data table with song information", async ({ page }) => {
    await page.goto("/data");

    await expect(page).toHaveTitle(/収録データ一覧/);

    // Wait for the table to load
    await page.waitForLoadState("domcontentloaded");

    // Check if table headers are present
    await expect(page.locator("text=タイトル").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("allows filtering and searching data", async ({ page }) => {
    await page.goto("/data");

    // Wait for data to load
    await page.waitForLoadState("domcontentloaded");
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/songs") && response.status() === 200,
    );

    // Look for search input
    const searchInput = page.getByPlaceholder("検索...");
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill("AZKi");
    await page.waitForTimeout(500);

    // Verify table content is still visible after search
    await expect(page.locator("text=タイトル").first()).toBeVisible();
  });
});
