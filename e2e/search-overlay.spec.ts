import { test, expect } from "@playwright/test";

test.describe("Search overlay (mobile)", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens and closes the song list overlay", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait for the button to be present in DOM
    await page.waitForSelector('button[aria-label="Open song list"]', {
      timeout: 10000,
    });

    const openButton = page.getByRole("button", { name: "Open song list" });
    await expect(openButton).toBeVisible();
    await openButton.click({ force: true });

    const closeButton = page.getByRole("button", { name: "Close song list" });
    await expect(closeButton).toBeVisible();

    const overlayPanel = page
      .locator("div.fixed.inset-x-0.bottom-0.md\\:hidden")
      .filter({ has: closeButton });
    await expect(overlayPanel).toBeVisible();

    const overlaySearchInput = overlayPanel.getByPlaceholder("検索").first();
    await expect(overlaySearchInput).toBeVisible();

    await closeButton.click();
    await expect(closeButton).toBeHidden();
  });
});
