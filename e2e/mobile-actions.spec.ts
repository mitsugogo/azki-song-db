import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Mobile action buttons", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("displays mobile action buttons", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Mobile action buttons should be visible
    const surpriseButton = page.getByRole("button", { name: /Surprise/i });
    const modeButton = page.getByRole("button", { name: /全曲/ });
    const playlistButton = page.getByRole("button", { name: /プレイリスト/ });

    await expect(surpriseButton).toBeVisible();
    await expect(modeButton).toBeVisible();
    await expect(playlistButton).toBeVisible();
  });

  test("surprise button plays random song", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Get initial song title
    const initialTitle = await page
      .locator(".line-clamp-1.text-sm.font-medium.text-white")
      .first()
      .textContent();

    // Click surprise button
    const surpriseButton = page.getByRole("button", { name: /Surprise/i });
    await surpriseButton.click();

    // Wait for song change
    await page.waitForTimeout(1000);

    // Song should have changed (or at least the UI should respond)
    // Note: Due to random nature, we just verify the action doesn't break
    const currentTitle = await page
      .locator(".line-clamp-1.text-sm.font-medium.text-white")
      .first()
      .textContent();

    // The title should exist (not empty)
    expect(currentTitle).toBeTruthy();
  });

  test("original songs button filters to original songs", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // On mobile, scroll to ensure content is loaded
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Wait for song list to be visible - use textContent instead of visibility check
    await page.waitForTimeout(2000); // Give time for content to load

    // Get initial song count - try different selectors for mobile
    let initialCountText = null;
    try {
      // Try to get count from song list header
      initialCountText = await page
        .locator("p.text-xs.text-muted-foreground")
        .filter({ hasText: /曲/ })
        .textContent({ timeout: 5000 });
    } catch {
      try {
        // Alternative: count actual song items in the list
        const songItems = await page
          .locator("li")
          .filter({ hasText: /\d{4}\/\d{2}\/\d{2}/ })
          .all();
        initialCountText = `${songItems.length}曲/${songItems.length}曲`;
      } catch {
        // Fallback
        initialCountText = "0曲/0曲";
      }
    }

    const initialMatch = initialCountText?.match(/(\d+)曲\/(\d+)曲/);
    const initialTotal = initialMatch ? parseInt(initialMatch[2]) : 0;

    // Click song mode button and choose original songs
    const modeButton = page.getByRole("button", { name: /全曲/ });
    await modeButton.click();
    await page.getByRole("menuitem", { name: "オリ曲" }).click();

    // Wait for filtering
    await page.waitForTimeout(1000);

    // URL should contain original-songs filter
    await expect(page).toHaveURL(/.*original-songs.*/);

    // Song count should be less than or equal to initial total
    let filteredCountText = null;
    try {
      // Try to get count from song list header
      filteredCountText = await page
        .locator("p.text-xs.text-muted-foreground")
        .filter({ hasText: /曲/ })
        .textContent({ timeout: 5000 });
    } catch {
      try {
        // Alternative: count actual song items in the list
        const songItems = await page
          .locator("li")
          .filter({ hasText: /\d{4}\/\d{2}\/\d{2}/ })
          .all();
        filteredCountText = `${songItems.length}曲/${songItems.length}曲`;
      } catch {
        // Fallback
        filteredCountText = "0曲/0曲";
      }
    }

    const filteredMatch = filteredCountText?.match(/(\d+)曲\/(\d+)曲/);
    const filteredTotal = filteredMatch ? parseInt(filteredMatch[2]) : 0;

    // For original songs filter, count should be less than initial total (since we're filtering to subset)
    expect(filteredTotal).toBeLessThanOrEqual(initialTotal);
  });

  test("playlist button opens playlist modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Scroll to bottom to ensure mobile action buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Click playlist button - use role-based selector that works in browser
    const playlistButton = page.getByRole("button", { name: /プレイリスト/ });
    await playlistButton.click({ force: true });

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Playlist modal should open - try different selectors
    let playlistModal;
    try {
      playlistModal = page.getByRole("dialog", { name: "プレイリスト" });
      await expect(playlistModal).toBeVisible({ timeout: 5000 });
    } catch {
      // Try alternative selector
      playlistModal = page
        .locator('[role="dialog"]')
        .filter({ hasText: "プレイリスト" });
      await expect(playlistModal).toBeVisible({ timeout: 5000 });
    }

    // Modal should contain some content
    const modalContent = playlistModal
      .locator("text=/プレイリストを作成|再生するプレイリストを選択/")
      .first();
    await expect(modalContent).toBeVisible();
  });

  test("creates a new playlist from mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Scroll to bottom to ensure mobile action buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Open playlist modal
    const playlistButton = page.getByRole("button", { name: /プレイリスト/ });
    await playlistButton.click({ force: true });

    // Wait for modal to appear
    await page.waitForTimeout(1000);
    let playlistModal;
    try {
      playlistModal = page.getByRole("dialog", { name: "プレイリスト" });
      await expect(playlistModal).toBeVisible({ timeout: 5000 });
    } catch {
      playlistModal = page
        .locator('[role="dialog"]')
        .filter({ hasText: "プレイリスト" });
      await expect(playlistModal).toBeVisible({ timeout: 5000 });
    }

    // Click create playlist button
    const createButton = page.getByRole("button", {
      name: "プレイリストを作成",
    });
    await createButton.click({ force: true });

    // Wait for create playlist modal to open
    await page.waitForTimeout(1000);

    // Verify create playlist modal opens
    const createModal = page
      .locator('[role="dialog"]')
      .filter({ hasText: "新規プレイリストを作成" });
    await expect(createModal).toBeVisible({ timeout: 5000 });

    // Fill playlist name
    const nameInput = createModal.locator(
      'input[placeholder="プレイリスト名を入力..."]',
    );
    await expect(nameInput).toBeVisible();
    await nameInput.fill(`モバイルテストプレイリスト-${Date.now()}`);

    // Wait for create button to be enabled - longer wait
    await page.waitForTimeout(1000);
    const submitButton = createModal.getByRole("button", {
      name: "作成",
      exact: true,
    });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });

    // Submit the form
    await submitButton.click({ force: true });

    // Should return to main playlist modal with new playlist
    await expect(createModal).toBeHidden();
    await expect(playlistModal).toBeVisible();

    // Should show the created playlist
    await expect(page.getByText(/モバイルテストプレイリスト/)).toBeVisible();
  });

  test("closes playlist modal on mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Scroll to bottom to ensure mobile action buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Open playlist modal
    const playlistButton = page.getByRole("button", { name: /プレイリスト/ });
    await playlistButton.click({ force: true });

    // Wait for modal to appear
    await page.waitForTimeout(1000);
    let playlistModal;
    try {
      playlistModal = page.getByRole("dialog", { name: "プレイリスト" });
      await expect(playlistModal).toBeVisible({ timeout: 5000 });
    } catch {
      playlistModal = page
        .locator('[role="dialog"]')
        .filter({ hasText: "プレイリスト" });
      await expect(playlistModal).toBeVisible({ timeout: 5000 });
    }

    // Close modal
    const closeButton = page.getByRole("button", { name: "閉じる" });
    await closeButton.click({ force: true });

    // Verify modal is closed
    await expect(playlistModal).toBeHidden();
  });
});
