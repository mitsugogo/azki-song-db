import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Anniversaries page", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test.describe("mobile layout", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("renders anniversary cards without dropping metadata", async ({
      page,
    }) => {
      await page.goto("/anniversaries", { waitUntil: "domcontentloaded" });

      await expect(
        page.getByRole("heading", { name: /記念日|Anniversaries/i }),
      ).toBeVisible();

      const firstCard = page.locator("article").first();
      await expect(firstCard).toBeVisible();
      await expect(firstCard).toContainText(/記念日|Anniversary/i);
      await expect(firstCard).toContainText(/次回|Next/i);
      await expect(firstCard).toContainText(/初回|First/i);
      await expect(firstCard).toContainText(/あと何日|Days until/i);
      await expect(firstCard).toContainText(/メモ|Note/i);
      await expect(firstCard).toContainText(/リンク|Link/i);
    });
  });

  test("keeps desktop table layout", async ({ page }) => {
    await page.goto("/anniversaries", { waitUntil: "domcontentloaded" });

    const tableHeader = page.locator("thead");
    await expect(tableHeader).toBeVisible();
    await expect(tableHeader).toContainText(/次回|Next/i);
    await expect(tableHeader).toContainText(/記念日|Anniversary/i);
    await expect(tableHeader).toContainText(/初回|First/i);
    await expect(tableHeader).toContainText(/あと何日|Days until/i);
  });
});
