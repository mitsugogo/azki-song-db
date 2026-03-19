import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";
import { getCachedSongs } from "./test-utils";

test.describe("Home page", () => {
  test.describe.configure({ mode: "serial" });
  const songs = getCachedSongs();
  const firstSong = songs[0];

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("renders landing search UI and recommended songs", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "AZKi Song Database" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /音楽で辿る、\s*Virtual DiVAの記録。|AZKiの歌を探して、\s*そのまま聴く。/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Toggle theme" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "検索する" })).toBeVisible();
    await expect(page.getByText("おすすめ楽曲")).toBeVisible();
    await expect(page.locator('a[href*="/watch?v="]').first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "AZKi Channel" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "AZKi on X" })).toBeVisible();
    await expect(page.getByText(/収録楽曲数:/)).toBeVisible();
  });

  test("submits search from top page to /search", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const searchInput = page
      .locator('input[placeholder="曲名、アーティスト、タグなどで検索"]')
      .first();
    await searchInput.fill(firstSong?.title ?? "フェリシア");
    await page.getByRole("button", { name: "検索する" }).click();

    await expect(page).toHaveURL(/\/search\?q=/);
    await expect(page.getByRole("heading", { name: "検索結果" })).toBeVisible();
  });

  test("recommended tile opens the watch page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.locator('a[href*="/watch?v="]').first().click();

    await expect(page).toHaveURL(/\/watch\?v=/);
    await expect(page.locator('iframe[src*="youtube.com"]')).toBeVisible();
  });

  test("legacy root playback URL redirects to /watch", async ({ page }) => {
    test.skip(!firstSong, "cached songs are required for redirect validation");

    await page.goto(`/?v=${firstSong.video_id}&t=${firstSong.start}`);

    await expect(page).toHaveURL(
      new RegExp(`/watch\\?v=${firstSong.video_id}`),
    );
    await expect(page.locator('iframe[src*="youtube.com"]')).toBeVisible();
  });
});
