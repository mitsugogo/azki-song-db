import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Mute persistence across video change", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("muting persists and is applied after switching videos", async ({
    page,
  }) => {
    await page.goto("/");

    // wait for songs API and UI to load
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });

    // Click the first song to start playback
    const first = page.getByRole("listitem").first();
    await first.click();

    // Wait for player controls to show playing state (pause button)
    await page.waitForSelector('button[aria-label="一時停止"]', {
      timeout: 10000,
    });

    // find the volume/mute button (label could be ミュート or ミュート解除 or 音量調整)
    const volButton = page
      .getByRole("button", { name: /ミュート|ミュート解除|音量調整/ })
      .first();

    // Click to mute
    await volButton.click();

    // persisted flag should be set
    const persistedMuted = await page.evaluate(() =>
      localStorage.getItem("player-muted"),
    );
    expect(persistedMuted).toBe("true");

    // Click second song (different video in normal data); if not different, still triggers player reload
    const second = page.getByRole("listitem").nth(1);
    await second.click();

    // Wait for the player to become ready for the new song (pause button appears)
    await page.waitForSelector('button[aria-label="一時停止"]', {
      timeout: 10000,
    });

    // After switching, the mute state should still be applied in localStorage
    const persistedMutedAfter = await page.evaluate(() =>
      localStorage.getItem("player-muted"),
    );
    expect(persistedMutedAfter).toBe("true");

    // And the UI volume button should reflect muted state (ミュート解除 label when muted)
    const volBtnLabel = await page
      .getByRole("button", { name: /ミュート|ミュート解除|音量調整/ })
      .first()
      .getAttribute("aria-label");
    expect(volBtnLabel).toMatch(/ミュート解除|音量調整/);
  });

  test("volume slider -> 0 でミュートが永続化される", async ({ page }) => {
    // play first song
    await page.goto("/");
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });

    const first = page.getByRole("listitem").first();
    await first.click();
    await page.waitForSelector('button[aria-label="一時停止"]', {
      timeout: 10000,
    });

    const volumeBar = page.locator("input.youtube-volume-bar");
    await volumeBar.fill("0");
    // debounce に合わせて少し待つ
    await page.waitForTimeout(700);

    const persistedMuted = await page.evaluate(() =>
      localStorage.getItem("player-muted"),
    );
    expect(persistedMuted).toBe("true");

    const volBtnLabel = await page
      .getByRole("button", { name: /ミュート|ミュート解除|音量調整/ })
      .first()
      .getAttribute("aria-label");
    expect(volBtnLabel).toMatch(/ミュート解除|音量調整/);
  });
});
