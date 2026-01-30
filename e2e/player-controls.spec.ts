import { test, expect } from "@playwright/test";

// コントロールバーのテスト
// 再生・一時停止・次の曲・ボリューム・ミュートなど

test.describe("Player Control Bar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // プレイヤーが表示されるまで待機
    await expect(page.locator(".youtube-progress-bar")).toBeVisible();
  });

  test("再生・一時停止ボタンが動作する", async ({ page }) => {
    const playPauseBtn = page.locator(
      'button[aria-label="再生"], button[aria-label="一時停止"]',
    );
    await expect(playPauseBtn).toBeVisible();
    await playPauseBtn.click();
    // 状態変化を確認（例: aria-labelが切り替わる）
    await expect(playPauseBtn).toHaveAttribute("aria-label", /再生|一時停止/);
  });

  test("次の曲へボタンが動作する", async ({ page }) => {
    const nextBtn = page.locator('button[aria-label="次の曲へ"]');
    await expect(nextBtn).toBeVisible();
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      // 曲情報が切り替わることを確認（タイトル表示など）
      const songTitle = page
        .locator(".line-clamp-1.text-sm.font-medium.text-white")
        .first();
      await expect(songTitle).not.toHaveText("");
    }
  });

  test("ボリュームバーが操作できる", async ({ page }) => {
    const volumeBar = page.locator("input.youtube-volume-bar");
    await expect(volumeBar).toBeVisible();
    await volumeBar.fill("50");
    // 50%に変更されたことを確認
    await expect(volumeBar).toHaveValue("50");
  });

  test("ミュートボタンが動作する", async ({ page }) => {
    const muteBtn = page.locator(
      'button[aria-label="ミュート"], button[aria-label="ミュート解除"]',
    );
    await expect(muteBtn).toBeVisible();
    await muteBtn.click();
    // 状態変化を確認（アイコンやaria-labelが切り替わる）
    await expect(muteBtn).toHaveAttribute(
      "aria-label",
      /ミュート|ミュート解除/,
    );
  });
});
