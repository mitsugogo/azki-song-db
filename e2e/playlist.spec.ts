import { test, expect } from "@playwright/test";

test.describe("Playlist page", () => {
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
