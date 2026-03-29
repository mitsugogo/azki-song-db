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
      page.getByRole("link", {
        name: /AZKi.*(Song|SONG).*Database|AZKi.*SONG.*DATABASE/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /音楽で辿る、\s*(Virtual DiVAの記録|Virtual DiVA AZKiの軌跡)。|AZKiの歌を探して、\s*そのまま聴く。/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: /toggle theme|テーマ|Theme toggle/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "検索する" })).toBeVisible();
    await expect(page.getByText("おすすめ楽曲")).toBeVisible();
    await expect(page.locator('a[href*="/watch?v="]').first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "AZKi Channel" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "AZKi_VDiVA" })).toBeVisible();
    await expect(page.getByText(/収録楽曲数:/)).toBeVisible();
  });

  test("submits search from top page to /search", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const query = firstSong?.title ?? "春よ、来い";
    const searchInput = page.getByRole("textbox", {
      name: "曲名、アーティスト、タグなどで検索",
    });
    await searchInput.fill(query);
    await searchInput.press("Enter");
    await page.getByRole("button", { name: "検索する" }).click();

    await expect(page).toHaveURL(/\/search\?q=/);
    await expect(page.getByRole("heading", { name: "検索結果" })).toBeVisible();
  });

  test("recommended tile opens the watch page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const recommendedLink = page.locator('a[href*="/watch?v="]').first();
    const hasRecommended = (await recommendedLink.count()) > 0;

    if (hasRecommended) {
      await recommendedLink.click();
    } else {
      await page.getByRole("link", { name: "ランダム再生" }).click();
    }

    await expect(page).toHaveURL(/\/watch/);
  });

  test("legacy root playback URL redirects to /watch", async ({ page }) => {
    await page.goto("/?v=tUc0j23UMyk&t=1361s");

    await expect(page).toHaveURL(/\/watch\?v=tUc0j23UMyk/);
  });
});
