import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Language switcher", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("switch to EN updates URL and header text (desktop)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByRole("textbox", { name: "曲名、アーティスト、タグなどで検索" }),
    ).toBeVisible();

    const langGroup = page.getByRole("group", {
      name: /言語切替|Language switcher/i,
    });
    await langGroup.getByRole("button", { name: "EN" }).click();

    await expect(page).toHaveURL(/\/en(\/|$)/);

    await expect(
      page.getByRole("textbox", { name: "Search by title, artist, tags" }),
    ).toBeVisible();
  });

  test("direct /en URL shows English texts (mobile fallback)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByRole("textbox", { name: "Search by title, artist, tags" }),
    ).toBeVisible();
  });
});
