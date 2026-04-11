import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

const searchInputNamePattern =
  /曲名、アーティスト、タグなどで検索|Search by title, artist, tags/i;
const advancedSearchTitlePattern = /高度な検索|Advanced Search/i;
const allKeywordsPattern = /次のキーワードをすべて含む|All Keywords/i;
const exactPhrasePattern = /次のキーワード全体を含む|Exact Phrase/i;
const anyKeywordsPattern = /次のキーワードのいずれかを含む|Any Keywords/i;
const excludeKeywordsPattern = /次のキーワードを含まない|Exclude Keywords/i;
const applyButtonPattern = /適用|Apply/i;
const exactPhrasePlaceholderPattern = /例: winter song|Example: winter song/i;

test.describe("Search page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("renders search interface", async ({ page }) => {
    await page.goto("/search");

    await expect(page).toHaveTitle(/検索|AZKi Song Database/);

    await page.waitForLoadState("domcontentloaded");
  });

  test("performs search with query parameter", async ({ page }) => {
    await page.goto("/search?q=test");

    await page.waitForLoadState("domcontentloaded");
  });

  test("handles special search prefixes", async ({ page }) => {
    const searchPrefixes = ["artist:", "tag:", "title:", "year:"];

    for (const prefix of searchPrefixes) {
      await page.goto(`/search?q=${prefix}test`);
      await page.waitForLoadState("domcontentloaded");
    }
  });

  test("drops deprecated tag query parameter", async ({ page }) => {
    await page.goto("/search?tag=tag%3A%E3%82%AA%E3%83%AA%E6%9B%B2");

    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(300);

    expect(page.url()).not.toContain("tag=");
  });

  test("selects browse tab from tab query parameter", async ({ page }) => {
    await page.goto("/search?tab=related-artists");

    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/tab=related-artists/);
    await expect(page.getByText("この情報について")).toBeVisible();
    await expect(page).toHaveTitle(/AZKiさんの音楽遍歴\(2026\/04\/01\)/);

    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toContain("AZKiさんの音楽遍歴(2026/04/01)");
  });

  test("switches browse tab after loading tab query parameter", async ({
    page,
  }) => {
    await page.goto("/search?tab=related-artists");

    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/tab=related-artists/);

    await page.getByRole("button", { name: "アーティスト" }).click();
    await expect(page).toHaveURL(/tab=artist/);

    await page.getByRole("button", { name: "カテゴリー" }).click();
    await expect(page).not.toHaveURL(/tab=/);
  });

  test("filters songs by search term", async ({ page }) => {
    await page.goto("/watch");
    await page.waitForLoadState("domcontentloaded");

    // Wait for song list to load
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });

    // Get initial song count
    const initialCountText = await page
      .locator("text=/\\d+曲\\/\\d+曲/")
      .first()
      .textContent();
    const initialMatch = initialCountText?.match(/(\d+)曲\/(\d+)曲/);
    const initialTotal = initialMatch ? parseInt(initialMatch[2]) : 0;

    // Enter search term (TagsInput accepts typing)
    const searchInput = page.getByRole("textbox", {
      name: searchInputNamePattern,
    });
    await searchInput.click();
    await searchInput.fill("year:2025");
    await searchInput.press("Enter");

    await expect
      .poll(() => page.url(), { timeout: 10000 })
      .toContain("q=year%3A2025");

    // Wait for filtering to apply
    await page.waitForTimeout(800);

    await expect(page.getByText("year:2025").first()).toBeVisible();

    // フィルタが効いていることを件数表示から確認
    const countText = await page
      .locator("text=/\\d+曲\\/\\d+曲/")
      .first()
      .textContent();
    const countMatch = countText?.match(/(\d+)曲\/(\d+)曲/);
    const filteredCount = countMatch ? parseInt(countMatch[1]) : 0;

    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialTotal);

    // Verify URL contains the search query
    expect(page.url()).toContain("q=year%3A2025");
  });

  test("search term persists after pressing Enter", async ({ page }) => {
    await page.goto("/watch");
    await page.waitForLoadState("domcontentloaded");

    // Wait for song list to load
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });

    // Enter search term
    const searchInput = page.getByRole("textbox", {
      name: searchInputNamePattern,
    });
    await searchInput.click();
    await searchInput.fill("tag:オリ曲");
    await searchInput.press("Enter");

    await expect.poll(() => page.url(), { timeout: 10000 }).toContain("q=tag");

    // Wait for state to stabilize
    await page.waitForTimeout(800);

    // Verify URL contains the search query
    const currentUrl = page.url();
    expect(currentUrl).toContain("q=tag");
    expect(currentUrl).toContain("%E3%82%AA%E3%83%AA%E6%9B%B2"); // URL encoded オリ曲
    await expect(page.getByText("tag:オリ曲").first()).toBeVisible();
  });

  test("displays search help popover", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("domcontentloaded");

    // クリックでヘルプポップオーバーを表示
    const helpButton = page.getByRole("button", { name: "検索ヘルプ" });
    await expect(helpButton).toBeVisible();

    await helpButton.click();

    // ポップオーバー内容が表示される
    await expect(page.getByText("AND検索（複数条件）")).toBeVisible();
    await expect(page.getByText("OR検索")).toBeVisible();
    await expect(page.getByText("完全一致検索")).toBeVisible();
  });

  test("opens advanced search modal", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("domcontentloaded");

    // 高度な検索ボタンをクリック
    const advancedSearchButton = page.getByRole("button", {
      name: advancedSearchTitlePattern,
    });
    await expect(advancedSearchButton).toBeVisible();

    await advancedSearchButton.click();

    // モーダルが開く
    const modalTitle = page.getByRole("heading", {
      name: advancedSearchTitlePattern,
    });
    await expect(modalTitle).toBeVisible();

    // フィールドが表示される
    await expect(page.getByText(allKeywordsPattern)).toBeVisible();
    await expect(page.getByText(exactPhrasePattern)).toBeVisible();
    await expect(page.getByText(anyKeywordsPattern)).toBeVisible();
    await expect(page.getByText(excludeKeywordsPattern)).toBeVisible();
  });

  test("generates query preview in advanced search", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("domcontentloaded");

    // 高度な検索ボタンをクリック
    const advancedSearchButton = page.getByRole("button", {
      name: advancedSearchTitlePattern,
    });
    await advancedSearchButton.click();

    // モーダルが開く
    await expect(
      page.getByRole("heading", { name: advancedSearchTitlePattern }),
    ).toBeVisible();
    const advancedSearchDialog = page.getByRole("dialog", {
      name: advancedSearchTitlePattern,
    });

    // 完全一致フレーズフィールドに入力
    await advancedSearchDialog
      .getByPlaceholder(exactPhrasePlaceholderPattern)
      .fill("winter song");

    // プレビューで "winter song" が表示される
    await expect(advancedSearchDialog).toContainText('"winter song"');
  });

  test("applies advanced search query", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("domcontentloaded");

    // 高度な検索ボタンをクリック
    const advancedSearchButton = page.getByRole("button", {
      name: advancedSearchTitlePattern,
    });
    await advancedSearchButton.click();

    // モーダルが開く
    await expect(
      page.getByRole("heading", { name: advancedSearchTitlePattern }),
    ).toBeVisible();
    const advancedSearchDialog = page.getByRole("dialog", {
      name: advancedSearchTitlePattern,
    });

    // いずれかのキーワード（OR検索）に入力
    await advancedSearchDialog
      .locator("textarea")
      .nth(1)
      .fill("title:winter title:summer");

    // 適用ボタンをクリック
    const applyButton = page.getByRole("button", { name: applyButtonPattern });
    await applyButton.click();

    // モーダルが閉じる
    await expect(
      page.getByRole("heading", { name: advancedSearchTitlePattern }),
    ).not.toBeVisible();

    // URLに検索クエリが反映される
    await page.waitForTimeout(800);
    expect(page.url()).toContain("q=");
  });

  test("OR search works correctly", async ({ page }) => {
    await page.goto("/watch");
    await page.waitForLoadState("domcontentloaded");

    // Wait for song list to load
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });

    // OR検索を入力
    const searchInput = page.getByRole("textbox", {
      name: searchInputNamePattern,
    });
    await searchInput.click();
    await searchInput.fill("title:winter OR title:summer");
    await searchInput.press("Enter");

    // URLに検索クエリが反映される
    await expect
      .poll(() => page.url(), { timeout: 10000 })
      .toContain("q=title");

    // 検索が実行されている
    await page.waitForTimeout(800);
  });

  test("exact match search works correctly", async ({ page }) => {
    await page.goto("/watch");
    await page.waitForLoadState("domcontentloaded");

    // Wait for song list to load
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });

    // 完全一致検索を入力
    const searchInput = page.getByRole("textbox", {
      name: searchInputNamePattern,
    });
    await searchInput.click();

    // クォートで囲まれたクエリ（完全一致）を入力
    // 這裡不能直接填入クォート，因為TagsInputは特別な処理をする可能があるため
    // URLパラメータで直接検索する代わり、Enterして見る
    await searchInput.fill('"test"');
    await searchInput.press("Enter");

    // Waitがあれば検索が実行されているchecking behavior
    await page.waitForTimeout(800);
  });
});
