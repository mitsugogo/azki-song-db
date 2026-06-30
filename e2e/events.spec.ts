import { expect, test } from "@playwright/test";
import { setupApiMocks } from "./mocks";

const eventDate = (daysFromToday: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString();
};

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
            start_at: eventDate(-1),
            end_at: eventDate(0),
            content: "進行中イベント",
            note: "開催中の表示確認",
            url: "https://example.com/ongoing",
          },
          {
            start_at: eventDate(3),
            end_at: eventDate(5),
            content: "次のイベント",
            note: "未来イベント1",
            url: "",
          },
          {
            start_at: eventDate(7),
            end_at: "",
            content: "単日イベント",
            note: "未来イベント2",
            url: "",
          },
          {
            start_at: eventDate(14),
            end_at: "",
            content: "4件目のイベント",
            note: "最大3件確認用",
            url: "",
          },
          {
            start_at: eventDate(-14),
            end_at: eventDate(-7),
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

    const eventsBox = eventsHeading.locator(
      "xpath=../following-sibling::section",
    );
    await expect(eventsBox.getByText("進行中イベント")).toBeVisible();
    await expect(eventsBox.getByText("次のイベント")).toBeVisible();
    await expect(eventsBox.getByText("単日イベント")).toBeVisible();
    await expect(eventsBox.getByText("開催中", { exact: true })).toBeVisible();
    await expect(eventsBox.getByText("あと0日", { exact: true })).toHaveCount(
      0,
    );
    await expect(eventsBox.getByText("あと3日", { exact: true })).toBeVisible();
    await expect(eventsBox.getByText(/あと\d+日/).first()).toBeVisible();
    await expect(eventsBox.getByText("4件目のイベント")).toHaveCount(0);
    await expect(eventsBox.getByText("過去イベント")).toHaveCount(0);

    const isEventsBeforeAnniversaries = await page.evaluate(() => {
      const headingByText = (text: string) =>
        Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).find(
          (element) => element.textContent?.trim() === text,
        );

      const eventsSection = headingByText("イベント");
      const anniversariesSection = headingByText("記念日");

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
