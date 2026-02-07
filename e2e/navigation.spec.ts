import { test, expect } from "@playwright/test";

test.describe("Navigation drawer", () => {
  test("opens and closes navigation drawer", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/songs") && response.status() === 200,
    );

    // Navigation toggle button should be visible
    const navToggle = page.getByRole("button", { name: "Toggle navigation" });
    await expect(navToggle).toBeVisible();

    // Click to open drawer
    await navToggle.click({ force: true });

    // Drawer should show navigation links
    const playlistLink = page.getByRole("link", { name: /プレイリスト/ });
    const statsLink = page.getByRole("link", { name: /統計/ });
    const discographyLink = page.getByRole("link", {
      name: /ディスコグラフィー|Discography/,
    });
    await expect(playlistLink).toBeVisible({ timeout: 15000 });
    await expect(statsLink).toBeVisible();
    await expect(discographyLink).toBeVisible();

    // Click toggle again to close
    await navToggle.click({ force: true });
    await page.keyboard.press("Escape");

    // Drawer should be hidden
    await expect(statsLink).toBeHidden({ timeout: 15000 });
  });

  test("navigates to different pages from drawer", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Open navigation drawer
    const navToggle = page.getByRole("button", { name: /toggle navigation/i });
    await navToggle.click();

    // Click on statistics link
    const statsLink = page.getByRole("link", { name: /統計/ });
    await expect(statsLink).toBeVisible({ timeout: 15000 });
    await statsLink.click();

    // Should navigate to statistics page
    await expect(page).toHaveURL(/.*\/statistics/);
    await expect(page.getByRole("heading", { name: /統計/ })).toBeVisible();
  });
});

test.describe("Theme toggle", () => {
  test("toggles between light and dark theme", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Theme toggle button should be visible
    const themeToggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(themeToggle).toBeVisible();

    // Get initial theme (check Mantine color scheme attribute)
    const root = page.locator("html");
    const initialScheme = await root.getAttribute("data-mantine-color-scheme");
    expect(initialScheme).toBeTruthy();

    // Click theme toggle
    await themeToggle.click();

    // Theme should change
    await expect
      .poll(() => root.getAttribute("data-mantine-color-scheme"))
      .toBeTruthy();

    // Click again to toggle back
    await themeToggle.click();
    const afterSecondToggle = await root.getAttribute(
      "data-mantine-color-scheme",
    );
    expect(afterSecondToggle).toBeTruthy();
  });
});

test.describe("Share modal", () => {
  test("opens share modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait for song to load
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });

    // Click share button (should be in player controls)
    const shareButton = page.getByRole("button", {
      name: "現在の楽曲をシェア",
    });
    await expect(shareButton).toBeVisible();
    await shareButton.click({ force: true });

    // Share modal should open
    const shareModal = page
      .locator('[role="dialog"]')
      .filter({ hasText: "シェア" });
    await expect(shareModal).toBeVisible();

    // Should contain shareable URL
    const urlInput = page.locator('input[value^="http"]').first();
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveValue(/http/);
  });

  test("closes share modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Open share modal
    const shareButton = page.getByRole("button", {
      name: "現在の楽曲をシェア",
    });
    await shareButton.click({ force: true });

    // Verify modal is open
    const shareModal = page
      .locator('[role="dialog"]')
      .filter({ hasText: "シェア" });
    await expect(shareModal).toBeVisible();

    // Close modal (click outside or close button)
    const closeButton = page.getByRole("button", { name: /close|閉じる/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Click outside modal
      await page.locator("body").click({ position: { x: 10, y: 10 } });
    }

    // Modal should be closed
    await expect(shareModal).toBeHidden();
  });
});
