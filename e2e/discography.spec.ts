import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";
import { getCachedSongs } from "./test-utils";

const waitForDiscographyTabs = async (
  page: Parameters<typeof test>[0]["page"],
) => {
  await expect(page.getByRole("heading", { name: /Discography/i })).toBeVisible(
    {
      timeout: 10000,
    },
  );
  await expect(page.getByRole("tab").first()).toBeVisible({ timeout: 10000 });
};

function getDiscographyCategory(song: any) {
  const tags = song?.tags ?? [];
  if (
    tags.includes("ユニット曲") ||
    tags.includes("ゲスト参加") ||
    (song?.title || "").includes("feat. AZKi") ||
    (song?.title || "").includes("feat.AZKi")
  ) {
    return "collabo";
  }
  if (tags.includes("カバー曲")) {
    return "covers";
  }
  return "originals";
}

test.describe("Discography page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("renders discography page with album information", async ({ page }) => {
    await page.goto("/discography", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveTitle(/Discography/);

    await expect(
      page.getByRole("heading", { name: "Discography" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("displays album covers and titles", async ({ page }) => {
    await page.goto("/discography", { waitUntil: "domcontentloaded" });

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

    const category = getDiscographyCategory(withSlug);
    await page.goto(`/discography/${category}/${encodeURIComponent(slug)}`, {
      waitUntil: "domcontentloaded",
    });

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

  test("tab switching updates selected tab", async ({ page }) => {
    await page.goto("/discography/originals", {
      waitUntil: "domcontentloaded",
    });

    await waitForDiscographyTabs(page);

    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();
    test.skip(
      tabCount < 3,
      "not enough tabs present to perform tab-switching assertions",
    );

    const unitTab = tabs.nth(2);
    const coverTab = tabs.nth(3);

    await unitTab.click();
    await expect(unitTab).toHaveAttribute("aria-selected", "true");

    await coverTab.click();
    await expect(coverTab).toHaveAttribute("aria-selected", "true");
  });

  test("/discography/covers opens Covers tab", async ({ page }) => {
    // Use query param which is resilient to routing changes
    await page.goto("/discography/covers", { waitUntil: "domcontentloaded" });

    await waitForDiscographyTabs(page);

    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();
    test.skip(tabCount < 4, "not enough tabs present to assert covers tab");
    const coverTab = tabs.nth(3);
    await expect(coverTab).toHaveAttribute("aria-selected", "true");
  });
});
