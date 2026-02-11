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
    const milestones = songs
      .flatMap((s: any) => s.milestones || [])
      .filter((m: string, i: number, arr: string[]) => arr.indexOf(m) === i);
    test.skip(
      milestones.length === 0,
      "no milestone data available for testing",
    );

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Use the first available milestone
    const milestone = milestones[0];

    // Navigate to the milestone filtered page
    await page.goto(`/?q=milestone:${encodeURIComponent(milestone)}`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for loading overlay to disappear
    await page.waitForSelector(".mantine-LoadingOverlay-root", {
      state: "hidden",
      timeout: 10000,
    });

    // Wait for song list to load
    await page.waitForSelector('a[href*="?v="]', { timeout: 10000 });

    // Click the first song link
    await page.locator('a[href*="?v="]').first().click();

    // YouTube iframe should update
    await expect(page.locator('iframe[src*="youtube.com"]')).toBeVisible();
  });
});
