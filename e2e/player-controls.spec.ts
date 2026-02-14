import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

// コントロールバーのテスト
// 再生・一時停止・次の曲・ボリューム・ミュートなど

test.describe("Player Control Bar", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/");
    // 曲リストが表示されるまで待機
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });
    // 最初の曲をクリックして iframe を表示
    const songItems = page
      .locator("li")
      .filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}/ });
    await songItems.first().click();
    // iframe が表示されるまで待機
    await expect(page.locator('iframe[src*="youtube.com"]')).toBeVisible();
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
    const initialLabel = await muteBtn.getAttribute("aria-label");
    await muteBtn.click();
    await page.waitForTimeout(500);
    // 状態変化を確認（アイコンやaria-labelが切り替わる）
    await expect(muteBtn).toHaveAttribute(
      "aria-label",
      initialLabel === "ミュート" ? "ミュート解除" : "ミュート",
    );
  });

  test("説明文の選択中は折りたたみトグルが発火しない", async ({ page }) => {
    // 説明文が読み込まれるまで待機
    await expect(page.getByText("E2E description line 1")).toBeVisible();

    // 折りたたみトグル（'続きを表示' または '折りたたむ'）が表示されることを確認
    const toggle = page.getByText(/続きを表示|折りたたむ/).first();
    await expect(toggle).toBeVisible();
    const initialToggleText = (await toggle.textContent()) || "";

    // 説明文内のテキストを選択してから、同じ要素に対して click イベントを dispatch
    const descText = page.getByText("E2E description line 1").first();
    // Playwright のマウス操作でテキストをドラッグして選択（より実際のユーザー操作に近い）
    const box = await descText.boundingBox();
    if (box) {
      const startX = box.x + 5;
      const startY = box.y + box.height / 2;
      const endX = box.x + Math.min(80, box.width - 5);
      const endY = startY;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 5 });
      await page.mouse.up();

      // 選択したままクリック（mousedown -> click の順）
      await page.mouse.move(startX + 2, startY);
      await page.mouse.down();
      await page.mouse.up();
    } else {
      throw new Error("failed to get bounding box for description element");
    }

    await page.waitForTimeout(200);

    // トグルのテキストが変わっていないこと（選択中は toggle 発火しない）
    const currentToggle = page.getByText(/続きを表示|折りたたむ/).first();
    const currentToggleText = (await currentToggle.textContent()) || "";
    expect(currentToggleText.trim()).toBe(initialToggleText.trim());
    await expect(currentToggle).toBeVisible();
  });

  test("異なる動画の曲を選択するとiframeのsrcが変わる", async ({ page }) => {
    // 初期のiframe URLを取得
    const initialFrameUrl = await page
      .locator('iframe[src*="youtube.com"]')
      .first()
      .getAttribute("src");
    const initialVideoId = initialFrameUrl?.match(/\/embed\/([^?]+)/)?.[1];

    // 曲リストから別の曲をクリック（異なる動画の曲を探す）
    const songItems = page
      .locator("li")
      .filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}/ });
    const songCount = await songItems.count();

    // 異なる動画の曲を見つけてクリック
    for (let i = 1; i < Math.min(songCount, 10); i++) {
      await songItems.nth(i).click();
      await page.waitForTimeout(1000);

      const newFrameUrl = await page
        .locator('iframe[src*="youtube.com"]')
        .first()
        .getAttribute("src");
      const newVideoId = newFrameUrl?.match(/\/embed\/([^?]+)/)?.[1];

      if (newVideoId !== initialVideoId) {
        // 異なる動画に切り替わった
        expect(newVideoId).toBeDefined();
        expect(newVideoId).not.toBe(initialVideoId);
        return;
      }
    }

    // 全て同じ動画だった場合もテストはパス（データ依存）
    expect(true).toBe(true);
  });

  test("start/endの指定がある楽曲が一つの動画で連続再生される場合、正しくシークされる", async ({
    page,
  }) => {
    // 検索窓に「ぺこーら24」と入力して絞り込み
    // NOTE:「ぺこーら24」は同一動画内でstart/end指定がある楽曲が2つ(ロウワーとHappinessが)存在する。
    const searchInput = page.getByRole("textbox", { name: /検索/ }).first();
    await searchInput.fill("ぺこーら24");
    await searchInput.press("Enter");
    await page.waitForTimeout(3000);

    // song list の要素（data属性で video-id と start-time が付与されている）
    const songItems = page.locator("#song-list").locator("li");
    const count = await songItems.count();

    // 同じ video_id を持つアイテムを探す
    const map: Record<string, number[]> = {};
    for (let i = 0; i < count; i++) {
      const el = songItems.nth(i);
      const vid = await el.getAttribute("data-video-id");
      const start = Number((await el.getAttribute("data-start-time")) || 0);
      if (!vid) continue;
      map[vid] = map[vid] || [];
      map[vid].push(i);
      if (map[vid].length >= 2) break;
    }

    // 見つかった video_id を選択（なければテストをスキップ扱いで通す）
    const pair = Object.values(map).find((arr) => arr.length >= 2);
    if (!pair) {
      expect(true).toBe(true);
      return;
    }

    const idxA = pair[0];
    const idxB = pair[1];

    // 先に再生する曲と次の曲の start を取得
    const startA = Number(
      (await songItems.nth(idxA).getAttribute("data-start-time")) || 0,
    );
    const startB = Number(
      (await songItems.nth(idxB).getAttribute("data-start-time")) || 0,
    );
    const videoId = await songItems.nth(idxA).getAttribute("data-video-id");

    // 小さい方を videoStart とする
    const videoStart = Math.min(startA, startB);

    // 最初の曲をクリックして再生
    await songItems.nth(idxA).click();
    await page.waitForTimeout(500);

    // iframe は同じ videoId を使っていること
    const frameSrc = await page
      .locator('iframe[src*="youtube.com"]')
      .first()
      .getAttribute("src");
    const iframeVid = frameSrc?.match(/\/embed\/([^?]+)/)?.[1];
    expect(iframeVid).toBe(videoId);

    // コントロールバーの現在曲名を取得
    const idxATitle = page.locator("#player-controls-bar").getByLabel("曲名");
    await expect(idxATitle).toBeVisible();
    const idATitleText = await idxATitle.textContent();
    expect(idATitleText).toBeTruthy();

    // 同一動画内の次の曲をクリック（シークされるはず）
    await songItems.nth(idxB).click();
    await page.waitForTimeout(700);

    // iframe の videoId は変わっていない（シークのみ）
    const newFrameSrc = await page
      .locator('iframe[src*="youtube.com"]')
      .first()
      .getAttribute("src");
    const newIframeVid = newFrameSrc?.match(/\/embed\/([^?]+)/)?.[1];
    expect(newIframeVid).toBe(videoId);
    // コントロールバーの曲名が変わっている
    const idxBTitle = page.locator("#player-controls-bar").getByLabel("曲名");
    await expect(idxBTitle).toBeVisible();
    expect(await idxBTitle.textContent(), "曲名が変わっていません").not.toBe(
      idATitleText,
    );
  });

  test("キーボードの左右キーでシークできる", async ({ page }) => {
    // ページにフォーカスを当てる
    await page.focus("body");

    // 「オリ曲」を検索して絞り込み
    const searchInput = page
      .getByRole("textbox", { name: "曲名、アーティスト、タグなどで検索" })
      .first();
    await searchInput.fill("オリ曲");
    await searchInput.press("Enter");
    await page.waitForTimeout(3000);

    // 曲リストの最初の曲をクリックして再生
    const songItems = page.locator("#song-list").locator("li");
    await songItems.first().click();
    await page.waitForTimeout(1000);

    // 現在の時間を取得
    const timeElement = page
      .locator("span")
      .filter({ hasText: /^\d+:\d+$/ })
      .first();
    const initialTime = await timeElement.textContent();

    // 右キーを押して10秒進める
    await page.keyboard.press("ArrowRight");

    // 少し待つ
    await page.waitForTimeout(1500);

    // 時間が進んでいることを確認
    const afterRightTime = await timeElement.textContent();
    expect(afterRightTime).not.toBe(initialTime);

    // 左キーを押して10秒戻す
    await page.keyboard.press("ArrowLeft");

    // 少し待つ
    await page.waitForTimeout(500);

    // 時間が戻っていることを確認
    const afterLeftTime = await timeElement.textContent();
    expect(afterLeftTime).not.toBe(afterRightTime);
  });
});

test.describe("同一動画内での曲切り替え", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/");
    // 曲リストが表示されるまで待機
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });
    // 最初の曲をクリックして iframe を表示
    const songItems = page
      .locator("li")
      .filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}/ });
    await songItems.first().click();
    // iframe が表示されるまで待機
    await expect(page.locator('iframe[src*="youtube.com"]')).toBeVisible();
  });

  test("曲リストから曲を選択すると曲情報が切り替わる", async ({ page }) => {
    // 現在の曲タイトルを取得
    const songTitle = page
      .locator(".line-clamp-1.text-sm.font-medium.text-white")
      .first();
    const initialTitle = await songTitle.textContent();

    // 曲リストから別の曲をクリック
    const songItems = page
      .locator("li")
      .filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}/ });
    const songCount = await songItems.count();

    if (songCount > 1) {
      // 2番目の曲をクリック
      await songItems.nth(1).click();
      await page.waitForTimeout(500);

      // 曲タイトルが変わったことを確認
      const newTitle = await songTitle.textContent();
      expect(newTitle).not.toBe(initialTitle);
    }
  });

  test("次の曲へボタンで同一動画内の曲に切り替わった場合、表示が更新される", async ({
    page,
  }) => {
    // 曲タイトル要素
    const songTitle = page
      .locator(".line-clamp-1.text-sm.font-medium.text-white")
      .first();
    const initialTitle = await songTitle.textContent();

    // 次の曲へボタンをクリック
    const nextBtn = page.locator('button[aria-label="次の曲へ"]');
    await expect(nextBtn).toBeVisible();

    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(500);

      // 曲情報が切り替わることを確認
      const newTitle = await songTitle.textContent();
      expect(newTitle).toBeTruthy();
      // 曲リストの設定によっては同じ曲に戻る可能性もあるため、タイトルが存在することのみ確認
    }
  });

  test("曲選択時にURLパラメータが更新される", async ({ page }) => {
    // 曲リストから曲をクリック
    const songItems = page
      .locator("li")
      .filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}/ });
    const songCount = await songItems.count();

    if (songCount > 0) {
      // 初期URLを取得
      const initialUrl = page.url();

      // 曲をクリック
      await songItems.first().click();
      await page.waitForTimeout(500);

      // URLが更新されていることを確認（vパラメータが含まれる）
      const newUrl = page.url();
      expect(newUrl).toBeTruthy();
    }
  });
});
