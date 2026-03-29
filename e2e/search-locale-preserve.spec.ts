import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Search from watch preserves locale and params", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("adds q while preserving v and t and not duplicating locale", async ({
    page,
  }) => {
    await page.goto("/en/watch?v=jW3DLnQvpgc&t=530s");
    await page.waitForLoadState("domcontentloaded");

    // 言語に依存しない安定したセレクターを使用
    const searchInput = page
      .locator('input[type="search"], input[type="text"]')
      .first();

    await searchInput.fill("artist:Suara");
    await searchInput.press("Enter");
    // 追加のアクション（候補クリックなど）を試みることで安定化
    try {
      await page.getByText("artist:Suara").first().click({ timeout: 2000 });
    } catch (e) {
      // 無視して先に進む
    }

    // 期待する URL になるまで待つ（タイムアウト拡張）
    await expect(page).toHaveURL(/q=artist%3ASuara/, { timeout: 5000 });

    // /en/en/ が含まれないこと
    await expect(page).not.toHaveURL(/\/en\/en\//);

    // v と t が保持されていること
    const url = page.url();
    expect(url).toContain("v=jW3DLnQvpgc");
    expect(url).toContain("t=530s");
  });
});
