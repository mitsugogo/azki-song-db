import { test, expect } from "@playwright/test";

test.describe("Filtered TOP iframe updates", () => {
  test("clicking a song from a milestone-filtered TOP updates YouTube iframe", async ({
    page,
  }) => {
    await page.goto("/summary");
    await page.waitForLoadState("domcontentloaded");

    // Click the first milestone link
    const milestoneLink = page.locator('a[href*="q=milestone:"]').first();
    await expect(milestoneLink).toBeVisible();
    await milestoneLink.click();

    // Wait for song links on filtered TOP
    await page.waitForSelector('a[href*="?v="]', { timeout: 10000 });

    // Find the first song link that targets the app (contains ?v=)
    const songLink = page.locator('a[href*="?v="]').first();
    const href = await songLink.getAttribute("href");
    await songLink.click();

    // Wait for iframe to appear and stabilize
    await page.waitForSelector('iframe[src*="youtube.com/embed"]', {
      timeout: 10000,
    });
    await page.waitForTimeout(500);

    const iframeSrc = await page
      .locator('iframe[src*="youtube.com/embed"]')
      .first()
      .getAttribute("src");

    // Extract video id from clicked href
    let expectedVideoId: string | null = null;
    if (href) {
      try {
        const url = new URL(href, page.url());
        expectedVideoId = url.searchParams.get("v");
        if (!expectedVideoId && url.searchParams.has("t")) {
          // sometimes v param is present in the base URL (handle fallback)
          expectedVideoId = url.searchParams.get("v");
        }
      } catch (e) {
        // ignore
      }
    }

    expect(iframeSrc).toBeTruthy();
    if (expectedVideoId) {
      expect(iframeSrc).toContain(`/embed/${expectedVideoId}`);
    }
  });
});
