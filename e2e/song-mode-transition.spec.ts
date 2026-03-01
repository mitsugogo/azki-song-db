import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

const coverSong = {
  source_order: 1,
  title: "Cover Song",
  slug: "cover-song",
  artist: "AZKi",
  sing: "AZKi",
  lyricist: "",
  composer: "",
  arranger: "",
  album: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  tags: ["カバー曲"],
  video_title: "cover-video",
  video_id: "cover-video-id",
  video_uri: "",
  start: "10",
  end: "80",
  broadcast_at: "2025-01-01T00:00:00.000Z",
  year: 2025,
  milestones: [],
};

const nonCoverSong = {
  source_order: 2,
  title: "Original Song",
  slug: "original-song",
  artist: "AZKi",
  sing: "AZKi",
  lyricist: "",
  composer: "",
  arranger: "",
  album: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  tags: ["オリ曲"],
  video_title: "original-video",
  video_id: "original-video-id",
  video_uri: "",
  start: "20",
  end: "90",
  broadcast_at: "2025-01-02T00:00:00.000Z",
  year: 2025,
  milestones: [],
};

const mockSongs = [coverSong, nonCoverSong];

test.describe("Song mode transition", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);

    await page.route("**/api/songs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSongs),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });
  });

  test("カバー曲モードに切り替えても全曲へ戻らない", async ({ page }) => {
    const modeButton = page
      .getByRole("button", { name: /全曲|カバー曲/ })
      .first();
    await expect(modeButton).toBeVisible();

    await modeButton.click();
    await page.getByRole("menuitem", { name: "カバー曲" }).click();

    await expect(page).toHaveURL(/(?:\?|&)q=cover-songs(?:&|$)/);

    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/(?:\?|&)q=cover-songs(?:&|$)/);
  });

  test("カバー曲モード中に一覧外の曲へ遷移した場合は全曲へ戻る", async ({
    page,
  }) => {
    const modeButton = page
      .getByRole("button", { name: /全曲|カバー曲/ })
      .first();
    await expect(modeButton).toBeVisible();

    await modeButton.click();
    await page.getByRole("menuitem", { name: "カバー曲" }).click();

    await expect(page).toHaveURL(/(?:\?|&)q=cover-songs(?:&|$)/);

    await page.evaluate(
      ({ videoId, start }) => {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("q", "cover-songs");
        nextUrl.searchParams.set("v", videoId);
        nextUrl.searchParams.set("t", `${start}s`);
        window.history.replaceState(null, "", nextUrl.toString());
        window.dispatchEvent(new Event("replacestate"));
      },
      {
        videoId: nonCoverSong.video_id,
        start: Number(nonCoverSong.start),
      },
    );

    await page.locator("li", { hasText: coverSong.title }).first().click();

    await expect(page.locator("text=2曲/2曲").first()).toBeVisible({
      timeout: 10000,
    });
  });
});
