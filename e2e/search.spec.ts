import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Search page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("renders search interface", async ({ page }) => {
    await page.goto("/search");

    await expect(page).toHaveTitle(/検索|AZKi Song Database/);

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

  test("drops deprecated tag query parameter", async ({ page }) => {
    await page.goto("/search?tag=tag%3A%E3%82%AA%E3%83%AA%E6%9B%B2");

    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(300);

    expect(page.url()).not.toContain("tag=");
  });

  test("filters songs by search term", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait for song list to load
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });

    // Get initial song count
    const initialCountText = await page
      .locator("text=/\\d+曲\\/\\d+曲/")
      .first()
      .textContent();
    const initialMatch = initialCountText?.match(/(\d+)曲\/(\d+)曲/);
    const initialTotal = initialMatch ? parseInt(initialMatch[2]) : 0;

    // Enter search term (TagsInput accepts typing)
    const searchInput = page.getByRole("textbox", {
      name: "曲名、アーティスト、タグなどで検索",
    });
    await searchInput.click();
    await searchInput.fill("year:2025");
    await searchInput.press("Enter");

    // Wait for URL to update
    await page.waitForURL(/.*\?q=year%3A2025.*/, { timeout: 3000 });

    // Wait for filtering to apply
    await page.waitForTimeout(800);

    // Get filtered song count
    const filteredCountText = await page
      .locator("text=/\\d+曲\\/\\d+曲/")
      .first()
      .textContent();
    const filteredMatch = filteredCountText?.match(/(\d+)曲\/(\d+)曲/);
    const filteredCount = filteredMatch ? parseInt(filteredMatch[1]) : 0;
    const filteredTotal = filteredMatch ? parseInt(filteredMatch[2]) : 0;

    // Verify filtering occurred
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialTotal);
    expect(filteredTotal).toBe(initialTotal);

    // Verify URL contains the search query
    expect(page.url()).toContain("q=year%3A2025");
  });

  test("search term persists after pressing Enter", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait for song list to load
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });

    // Enter search term
    const searchInput = page.getByRole("textbox", {
      name: "曲名、アーティスト、タグなどで検索",
    });
    await searchInput.click();
    await searchInput.fill("tag:オリ曲");
    await searchInput.press("Enter");

    // Wait for URL to update
    await page.waitForURL(/.*\?q=.*/, { timeout: 3000 });

    // Wait for state to stabilize
    await page.waitForTimeout(800);

    // Verify URL contains the search query
    const currentUrl = page.url();
    expect(currentUrl).toContain("q=tag");
    expect(currentUrl).toContain("%E3%82%AA%E3%83%AA%E6%9B%B2"); // URL encoded オリ曲
  });
});
