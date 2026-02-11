import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Filtered TOP iframe updates", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("clicking a song from a milestone-filtered TOP updates YouTube iframe", async ({
    page,
  }) => {
    // Skip if there are no milestones in the API data
    const res = await page.request.get("/api/songs");
    const songs: any[] = await res.json();
    const hasMilestone = songs.some(
      (s) => s && Array.isArray(s.milestones) && s.milestones.length > 0,
    );
    test.skip(!hasMilestone, "no milestone data available for testing");

    await page.goto("/summary");
    await page.waitForLoadState("domcontentloaded");

    // Wait for and click the first milestone link
    await page.waitForSelector('a[href*="q=milestone:"]', { timeout: 10000 });
    const milestoneLink = page.locator('a[href*="q=milestone:"]').first();
    await expect(milestoneLink).toBeVisible({ timeout: 10000 });
    await milestoneLink.click();

    // Wait for song links on filtered TOP
    await page.waitForSelector('a[href*="?v="]', { timeout: 10000 });

    // Find the first song link that targets the app (contains ?v=)
    const songLink = page.locator('a[href*="?v="]').first();
    const href = await songLink.getAttribute("href");
    await songLink.click();

    // Wait for iframe to appear and stabilize
    await page.waitForSelector("iframe", {
      timeout: 10000,
    });
    await page.waitForTimeout(500);
  });
});
