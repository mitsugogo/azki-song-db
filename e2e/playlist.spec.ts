import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Playlist page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("displays playlist management interface", async ({ page }) => {
    await page.goto("/playlist");

    await expect(page).toHaveTitle(/プレイリスト/);

    await page.waitForLoadState("domcontentloaded");
  });

  test("shows create playlist option", async ({ page }) => {
    await page.goto("/playlist");

    await page.waitForLoadState("domcontentloaded");

    // Look for buttons to create or manage playlists
    const buttons = page.getByRole("button");
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test("handles playlist with query parameter", async ({ page }) => {
    // Test with a basic base64-encoded playlist parameter
    const mockPlaylist = btoa(
      JSON.stringify({
        name: "Test Playlist",
        songs: [],
        createdAt: new Date().toISOString(),
      }),
    );

    await page.goto(`/playlist?playlist=${encodeURIComponent(mockPlaylist)}`);

    await page.waitForLoadState("domcontentloaded");
  });
});

// --- 追加: プレイリストの追加・再生、編集・削除のE2Eテスト ---
test.describe("プレイリスト機能", () => {
  const playlistName = `e2e-playlist-${Date.now()}`;
  const songsToAdd = [0, 1, 2]; // 最初の3曲を追加

  test("追加・再生", async ({ page }) => {
    // トップページへ
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // 設定ボタンをクリック
    await page.getByRole("button", { name: "設定" }).click();
    await page.waitForTimeout(1000);

    // プレイリストボタンをクリック
    await page.getByRole("button", { name: "プレイリストに追加" }).click();
    await page.waitForTimeout(1000);

    // 「プレイリストを作成」ボタンをクリック
    await page
      .getByRole("menuitem", { name: "新しいプレイリストを作成" })
      .first()
      .click();
    await page.waitForTimeout(500);

    // プレイリスト名を入力
    const createModal = page
      .locator('[role="dialog"]')
      .filter({ hasText: "新規プレイリストを作成" });
    await expect(createModal).toBeVisible({ timeout: 10000 });

    const nameInput = createModal.getByRole("textbox", {
      name: /プレイリスト名/,
    });
    await nameInput.fill(playlistName);
    await page.waitForTimeout(300);

    // 「作成」ボタンをクリック
    await page.getByRole("button", { name: "作成", exact: true }).click();
    await page.waitForTimeout(500);

    // 3曲を「+」ボタンでプレイリストに追加
    for (let idx = 0; idx < 3; idx++) {
      // n番目の曲の追加ボタンをクリック (2番目のボタン)
      // await page.locator("main li").nth(idx).locator("button").nth(1).click();
      await page.getByRole("listitem").nth(idx).click();
      await page.waitForTimeout(1500);

      // 作成したプレイリスト名をクリックして追加
      await page.getByRole("button", { name: "設定" }).click();
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: "プレイリストに追加" }).click();
      await page.getByText(playlistName, { exact: true }).click();
      await page.waitForTimeout(500);
    }

    // プレイリストボタンをクリックしてメニューを開く
    await page.getByRole("button", { name: "プレイリスト" }).last().click();
    await page.waitForTimeout(500);

    // プレイリスト名が表示されるのを待つ
    const playlistRowV1 = page.getByText(playlistName, { exact: true }).first();
    await expect(playlistRowV1).toBeVisible({ timeout: 10000 });
    await playlistRowV1.click();
    await page.waitForTimeout(1000);

    // プレイリスト再生モードで3曲がセットされていることを確認
    await expect(page.getByText(/楽曲一覧 \(3曲/)).toBeVisible({
      timeout: 5000,
    });
  });
});
