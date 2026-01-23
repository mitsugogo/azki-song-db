import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders header controls and navigation drawer", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "AZKi Song Database" }),
    ).toBeVisible();

    const navToggle = page.getByRole("button", { name: /toggle navigation/i });
    await expect(navToggle).toBeVisible();

    const youtubeLink = page
      .getByRole("link", { name: /AZKi Channel/i })
      .first();
    await expect(youtubeLink).toHaveAttribute(
      "href",
      "https://www.youtube.com/@AZKi",
    );

    await navToggle.click();
    await expect(
      page.getByRole("link", { name: "プレイリスト" }),
    ).toBeVisible();
  });
});
