import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

const searchInputNamePattern =
  /曲名、アーティスト、タグなどで検索|Search by title, artist, tags/i;

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
      page.getByRole("combobox", { name: searchInputNamePattern }),
    ).toBeVisible();

    const langGroup = page.getByRole("radiogroup", {
      name: /言語切替|Language switcher/i,
    });
    await langGroup.getByText("EN", { exact: true }).click();

    await expect(page).toHaveURL(/\/en(\/|$)/);

    await expect(
      page.getByRole("combobox", { name: searchInputNamePattern }),
    ).toBeVisible();
  });

  test("direct /en URL shows English texts (mobile fallback)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByRole("combobox", { name: searchInputNamePattern }),
    ).toBeVisible();
  });
});
