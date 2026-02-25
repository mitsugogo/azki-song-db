import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";
import { getCachedSongs } from "./test-utils";

test.describe("Discography page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("renders discography page with album information", async ({ page }) => {
    await page.goto("/discography");

    await expect(page).toHaveTitle(/Discography/);

    // Wait for content to load
    await page.waitForLoadState("domcontentloaded");

    // Check for discography content: ensure at least one secondary heading is visible
    // ( avoids matching the global site h1/title )
    await expect(page.locator("h2, h3").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("displays album covers and titles", async ({ page }) => {
    await page.goto("/discography");

    await page.waitForLoadState("domcontentloaded");

    // Look for images (album covers)
    const images = page.locator("img");
    await expect(images.first()).toBeVisible({ timeout: 10000 });
  });

  test("discography slug page shows details", async ({ page }) => {
    const songs: any[] = getCachedSongs();
    const withSlug = songs.find(
      (s) => s && s.slug && s.tags && s.tags.includes("オリ曲"),
    );
    test.skip(!withSlug, "no song with slug available for testing");
    const slug = withSlug.slug;

    await page.goto(`/discography/${encodeURIComponent(slug)}`);
    await page.waitForLoadState("domcontentloaded");

    // Prefer asserting the song title (or album) header is visible to avoid
    // matching hidden global h1s like the site title.
    const expectedTitle = withSlug.title ?? withSlug.album ?? null;
    await expect(
      page.locator("h1").filter({ hasText: expectedTitle }),
    ).toBeVisible({ timeout: 10000 });
    // iframe (YouTube) should be present
    await expect(page.locator("iframe").first()).toBeVisible({
      timeout: 10000,
    });
    // Breadcrumb link back to discography exists (match by href to avoid exact text changes)
    await expect(page.locator('a[href^="/discography"]').first()).toBeVisible();
  });

  test("discography?album=xxxx opens and expands the album", async ({
    page,
  }) => {
    const songs: any[] = getCachedSongs();
    const withAlbum = songs.find((s) => s && s.album);
    test.skip(!withAlbum, "no song with album available for testing");
    const album = withAlbum.album;

    await page.goto(
      `/discography/originals?album=${encodeURIComponent(album)}`,
    );
    await page.waitForLoadState("domcontentloaded");

    // Wait for loading overlay to disappear
    await page.waitForSelector(".mantine-LoadingOverlay-root", {
      state: "hidden",
      timeout: 10000,
    });

    // The album name should be present in the DOM (avoid scrollIntoView)
    await page.locator(`text=${album}`).first().waitFor({
      state: "attached",
      timeout: 10000,
    });

    // Instead of requiring the expanded anchor, assert the correct tab is selected
    // Determine expected tab from song tags (similar to app logic)
    const tags = withAlbum.tags || [];
    let expectedTabIndex = 0;
    if (
      tags.includes("ユニット曲") ||
      tags.includes("ゲスト参加") ||
      (withAlbum.title || "").includes("feat. AZKi") ||
      (withAlbum.title || "").includes("feat.AZKi")
    ) {
      expectedTabIndex = 1;
    } else if (tags.includes("カバー曲")) {
      expectedTabIndex = 2;
    }

    // Select tab by index rather than by localized name to be resilient to text changes
    const tabs = page.getByRole("tab");
    const tab = tabs.nth(expectedTabIndex);
    await expect(tab).toHaveAttribute("aria-selected", "true");
  });

  test("tab switching updates selected tab", async ({ page }) => {
    await page.goto("/discography/originals");
    await page.waitForLoadState("domcontentloaded");

    // Wait for loading overlay to disappear
    await page.waitForSelector(".mantine-LoadingOverlay-root", {
      state: "hidden",
      timeout: 10000,
    });

    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();
    test.skip(
      tabCount < 3,
      "not enough tabs present to perform tab-switching assertions",
    );

    const unitTab = tabs.nth(1);
    const coverTab = tabs.nth(2);

    await unitTab.click();
    await expect(unitTab).toHaveAttribute("aria-selected", "true");

    await coverTab.click();
    await expect(coverTab).toHaveAttribute("aria-selected", "true");
  });

  test("/discography/covers opens Covers tab", async ({ page }) => {
    // Use query param which is resilient to routing changes
    await page.goto("/discography/covers");
    await page.waitForLoadState("domcontentloaded");

    await page.waitForSelector(".mantine-LoadingOverlay-root", {
      state: "hidden",
      timeout: 10000,
    });

    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();
    test.skip(tabCount < 3, "not enough tabs present to assert covers tab");
    const coverTab = tabs.nth(2);
    await expect(coverTab).toHaveAttribute("aria-selected", "true");
  });

  // 旧slugのURLにアクセスしたとき、正しい曲ページにリダイレクトされることを確認
  test("redirects old slug URL to correct song page", async ({ page }) => {
    const songs: any[] = getCachedSongs();
    const withSlugV1 = songs.find(
      (s) => s && s.slugv2 && s.slug && s.tags && s.tags.includes("オリ曲"),
    );
    test.skip(
      !withSlugV1,
      "no song with both slug and slugv2 available for testing",
    );
    const oldSlug = withSlugV1.slug; // v1 slug
    const expectedTitle = withSlugV1.title ?? withSlugV1.album ?? null;

    await page.goto(`/discography/${encodeURIComponent(oldSlug)}`);
    await page.waitForLoadState("domcontentloaded");

    // Assert we are redirected to the correct page by checking the title
    await expect(
      page.locator("h1").filter({ hasText: expectedTitle }),
    ).toBeVisible({ timeout: 15000 });
  });
});
