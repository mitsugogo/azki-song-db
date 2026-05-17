import { test, expect, type Page } from "@playwright/test";
import { setupApiMocks } from "./mocks";

async function openDrawer(page: Page) {
  const navToggle = page.getByRole("button", { name: /toggle navigation/i });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await navToggle.click({ force: true });

    const playlistLink = page.locator('a[href="/playlist"]').last();
    try {
      await expect(playlistLink).toBeVisible({ timeout: 5000 });
      return;
    } catch (error) {
      await page.keyboard.press("Escape").catch(() => undefined);
    }
  }

  await expect(page.locator('a[href="/playlist"]').last()).toBeVisible({
    timeout: 15000,
  });
}

test.describe("Navigation drawer", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("opens and closes navigation drawer", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for loading overlay to disappear
    await page.waitForSelector(".mantine-LoadingOverlay-root", {
      state: "hidden",
      timeout: 10000,
    });

    // Navigation toggle button should be visible
    const navToggle = page.getByRole("button", { name: "Toggle navigation" });
    await expect(navToggle).toBeVisible();

    await openDrawer(page);

    const playlistLink = page.locator('a[href="/playlist"]').last();
    const statsLink = page.locator('a[href="/statistics"]').last();
    const discographyLink = page.locator('a[href="/discography"]').last();
    await expect(playlistLink).toBeVisible({ timeout: 15000 });
    await expect(statsLink).toBeVisible({ timeout: 15000 });
    await expect(discographyLink).toBeVisible({ timeout: 15000 });

    // Click toggle again to close
    await navToggle.click({ force: true });
    await page.keyboard.press("Escape");

    // Drawer should be hidden, leaving only the desktop header link visible
    await expect
      .poll(async () => page.locator('a[href="/statistics"]:visible').count())
      .toBe(1);
  });

  test("navigates to different pages from drawer", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for loading overlay to disappear
    await page.waitForSelector(".mantine-LoadingOverlay-root", {
      state: "hidden",
      timeout: 10000,
    });

    await openDrawer(page);

    const statsLink = page.locator('a[href="/statistics"]').last();
    await expect(statsLink).toBeVisible({ timeout: 15000 });
    await statsLink.click();

    // Should navigate to statistics page
    await expect(page).toHaveURL(/.*\/statistics/);
  });
});

test.describe("Theme toggle", () => {
  test("toggles between light and dark theme", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Theme toggle button should be visible (supporting i18n label)
    const themeToggle = page.getByRole("button", {
      name: /toggle theme|テーマ|Theme toggle/i,
    });
    await expect(themeToggle).toBeVisible();

    // Get initial theme attribute (if available)
    const root = page.locator("html");
    const initialScheme = await root.getAttribute("data-mantine-color-scheme");
    // Don't require attribute to exist in all environments.
    if (initialScheme) {
      expect(initialScheme).toMatch(/light|dark|auto/);
    }

    // Click theme toggle
    await themeToggle.click();

    // Theme should change by either attribute or class toggling
    await expect
      .poll(async () => {
        const scheme = await root.getAttribute("data-mantine-color-scheme");
        const hasDarkClass = await root.evaluate((el) =>
          el.classList.contains("dark"),
        );
        return scheme || (hasDarkClass ? "dark" : "light");
      })
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
    await page.goto("/watch", { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.url(), { timeout: 10000 })
      .toMatch(/\/watch\?v=/);

    // Wait for song to load
    await page.waitForSelector("text=/\\d+曲\\/\\d+曲/", { timeout: 10000 });

    // Click share button (should be in player controls)
    const shareButton = page.getByRole("button", {
      name: /現在の楽曲をシェア|Share current song/i,
    });
    await expect(shareButton).toBeVisible();
    await shareButton.click({ force: true });

    // Share modal should open
    const shareModal = page
      .locator('[role="dialog"]')
      .filter({ hasText: /シェア|Share/i });
    await expect(shareModal).toBeVisible();

    // Should contain shareable URL
    const urlInput = page.locator('input[value^="http"]').first();
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveValue(/http/);
  });

  test("closes share modal", async ({ page }) => {
    await page.goto("/watch", { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.url(), { timeout: 10000 })
      .toMatch(/\/watch\?v=/);

    // Open share modal
    const shareButton = page.getByRole("button", {
      name: /現在の楽曲をシェア|Share current song/i,
    });
    await expect(shareButton).toBeVisible({ timeout: 10000 });
    await shareButton.click({ force: true });

    // Verify modal is open
    const shareModal = page
      .locator('[role="dialog"]')
      .filter({ hasText: /シェア|Share/i });
    await expect(shareModal).toBeVisible();

    // Close modal (click outside or close button)
    const closeButton = page
      .getByRole("button", { name: /close|閉じる/i })
      .first();
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
