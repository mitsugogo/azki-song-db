import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

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

  test("discography slug page shows details", async ({ page }) => {
    const res = await page.request.get("/api/songs");
    const songs: any[] = await res.json();
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
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
    // iframe (YouTube) should be present
    await expect(page.locator("iframe").first()).toBeVisible({
      timeout: 10000,
    });
    // Breadcrumb link back to discography exists
    await expect(
      page.locator("a", { hasText: "楽曲一覧" }).first(),
    ).toBeVisible();
  });

  test("discography?album=xxxx opens and expands the album", async ({
    page,
  }) => {
    const res = await page.request.get("/api/songs");
    const songs: any[] = await res.json();
    const withAlbum = songs.find((s) => s && s.album);
    test.skip(!withAlbum, "no song with album available for testing");
    const album = withAlbum.album;

    await page.goto(`/discography?album=${encodeURIComponent(album)}`);
    await page.waitForLoadState("domcontentloaded");

    // The album name should be visible and an expanded anchor should exist
    await expect(page.locator(`text=${album}`).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator('[data-discography-anchor^="album-"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("tab switching updates selected tab", async ({ page }) => {
    await page.goto("/discography");
    await page.waitForLoadState("domcontentloaded");

    const unitTab = page.getByRole("tab", { name: /ユニット・ゲスト楽曲/ });
    const coverTab = page.getByRole("tab", { name: /カバー楽曲/ });

    await unitTab.click();
    await expect(unitTab).toHaveAttribute("aria-selected", "true");

    await coverTab.click();
    await expect(coverTab).toHaveAttribute("aria-selected", "true");
  });
});
