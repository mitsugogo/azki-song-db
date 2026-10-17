import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Anniversaries page", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.clock.setFixedTime(new Date("2026-10-17T03:00:00Z"));
    await page.route("**/api/anniversaries**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            date: "11/15",
            first_date_at: "2018-11-14T15:00:00Z",
            name: "活動開始{n}周年",
            note: "活動のはじまりを振り返る日。",
            url: "https://www.youtube.com/watch?v=example",
          },
          {
            date: "12/05",
            first_date_at: "2021-12-04T15:00:00Z",
            name: "ライブ開催記念日",
            note: "ライブの思い出を振り返る日。",
            url: "https://example.com/live",
          },
        ]),
      }),
    );
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1280, height: 900 },
  ]) {
    test.describe(`${viewport.width}px layout`, () => {
      test.use({ viewport });

      test("shows the hero and compact month cards with all metadata", async ({
        page,
      }) => {
        await page.goto("/anniversaries", { waitUntil: "domcontentloaded" });
        const hero = page.getByRole("region", { name: "次の記念日" });
        await expect(hero).toBeVisible();
        await expect(hero).toContainText("活動開始8周年");
        await expect(hero.getByLabel("あと29日")).toBeVisible();

        const card = page.getByRole("article", { name: "活動開始8周年" });
        await expect(card).toContainText("あと29日");
        await expect(card).toContainText("初回");
        await expect(card).toContainText("2018年11月15日");
        await expect(card).toContainText("活動のはじまりを振り返る日。");
        await expect(
          card.getByRole("link", { name: "活動開始8周年のYouTubeを開く" }),
        ).toHaveAttribute("href", "https://www.youtube.com/watch?v=example");
        await expect(page.getByRole("article")).toHaveCount(2);

        const nav = page.getByRole("navigation", { name: "記念日の月へ移動" });
        await nav.getByRole("link", { name: "2026年12月" }).click();
        await expect(page).toHaveURL(/#anniversary-month-2026-12$/);
        await expect(
          page.getByRole("heading", { name: "2026年12月" }),
        ).toBeInViewport();
        await expect(
          page
            .getByRole("article", { name: "ライブ開催記念日" })
            .getByRole("link"),
        ).toHaveAttribute("href", "https://example.com/live");
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      });
    });
  }
});
