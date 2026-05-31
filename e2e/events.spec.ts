import { expect, test } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.describe("Home events", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("shows ongoing and upcoming events above anniversaries", async ({
    page,
  }) => {
    await page.route("**/api/events**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            start_at: "2026-05-30T15:00:00.000Z",
            end_at: "2026-06-02T15:00:00.000Z",
            content: "進行中イベント",
            note: "開催中の表示確認",
            url: "https://example.com/ongoing",
          },
          {
            start_at: "2026-06-18T15:00:00.000Z",
            end_at: "2026-06-20T15:00:00.000Z",
            content: "次のイベント",
            note: "未来イベント1",
            url: "",
          },
          {
            start_at: "2026-06-30T15:00:00.000Z",
            end_at: "",
            content: "単日イベント",
            note: "未来イベント2",
            url: "",
          },
          {
            start_at: "2026-07-10T15:00:00.000Z",
            end_at: "",
            content: "4件目のイベント",
            note: "最大3件確認用",
            url: "",
          },
          {
            start_at: "2026-05-01T15:00:00.000Z",
            end_at: "2026-05-03T15:00:00.000Z",
            content: "過去イベント",
            note: "表示されない",
            url: "",
          },
        ]),
      });
    });

    await page.goto("/");

    const eventsHeading = page.getByRole("heading", { name: "イベント" });
    const anniversariesHeading = page.getByRole("heading", {
      name: "記念日",
      exact: true,
    });

    await expect(eventsHeading).toBeVisible();
    await expect(anniversariesHeading).toBeVisible();

    const eventsBox = page.locator("section").filter({ has: eventsHeading });
    await expect(eventsBox.getByText("進行中イベント")).toBeVisible();
    await expect(eventsBox.getByText("次のイベント")).toBeVisible();
    await expect(eventsBox.getByText("単日イベント")).toBeVisible();
    await expect(eventsBox.getByText("開催中", { exact: true })).toBeVisible();
    await expect(eventsBox.getByText("あと3日", { exact: true })).toBeVisible();
    await expect(eventsBox.getByText(/あと\d+日/).first()).toBeVisible();
    await expect(eventsBox.getByText("4件目のイベント")).toHaveCount(0);
    await expect(eventsBox.getByText("過去イベント")).toHaveCount(0);

    const isEventsBeforeAnniversaries = await page.evaluate(() => {
      const headingByText = (tagName: string, text: string) =>
        Array.from(document.querySelectorAll(tagName)).find(
          (element) => element.textContent?.trim() === text,
        );

      const eventsSection = headingByText("h2", "イベント")?.closest("section");
      const anniversariesSection = headingByText("h2", "記念日")?.closest(
        "section",
      );

      if (!eventsSection || !anniversariesSection) {
        return false;
      }

      return Boolean(
        eventsSection.compareDocumentPosition(anniversariesSection) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    expect(isEventsBeforeAnniversaries).toBe(true);
  });
});
