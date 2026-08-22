import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";

async function setTheme(
  page: import("@playwright/test").Page,
  target: "light" | "dark",
) {
  const root = page.locator("html");
  const toggle = page.getByRole("button", {
    name: /toggle theme|テーマ|Theme toggle/i,
  });

  for (let i = 0; i < 4; i += 1) {
    const current = await root.getAttribute("data-mantine-color-scheme");
    if (current === target) {
      return;
    }
    await toggle.click();
  }

  await expect(root).toHaveAttribute("data-mantine-color-scheme", target);
}

test.describe("Summary pages", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });
  test.describe("Summary index page", () => {
    test("redirects legacy summary path to activity", async ({ page }) => {
      await page.goto("/summary");

      await expect(page).toHaveURL(/\/activity$/);
      await expect(page).toHaveTitle(/活動記録/);
    });

    test("displays yearly activity summary", async ({ page }) => {
      await page.goto("/activity");

      await expect(page).toHaveTitle(/活動記録/);

      await page.waitForLoadState("domcontentloaded");

      // Check for heading (accept a few possible variants)
      const heading = page.getByRole("heading", {
        name: /年ごとの活動記録|活動記録|活動年表/i,
        level: 1,
      });
      await expect(heading).toBeVisible();
      await expect(page.getByText("歩んできた日々")).toBeVisible();
      await expect(page.getByText("デビュー / ルートα")).toBeVisible();
      await expect(page.getByText("ルートβ", { exact: true })).toBeVisible();
      await expect(page.getByText("ルートγ", { exact: true })).toBeVisible();
      await expect(page.getByText("開拓者の姿が誕生")).toBeVisible();
      await expect(page.getByText("100万人達成")).toBeVisible();
      await expect(page.getByText("今日", { exact: true })).toBeVisible();
    });

    test("displays year links", async ({ page }) => {
      await page.goto("/activity");

      await page.waitForLoadState("domcontentloaded");

      // Wait for year links to appear (rendered client-side)
      await page.waitForSelector('a[href^="/activity/20"]', { timeout: 10000 });
      const yearLinks = page.locator('a[href^="/activity/20"]');
      expect(await yearLinks.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Year detail page", () => {
    test("displays specific year summary", async ({ page }) => {
      // Test with a recent year that likely has data
      await page.goto("/activity/2024");

      await page.waitForLoadState("domcontentloaded");

      // Check that page has loaded some content - look for h1 heading
      await expect(
        page.getByRole("heading", { name: "2024年", exact: true, level: 1 }),
      ).toBeVisible();
    });

    test("shows year-specific statistics", async ({ page }) => {
      await page.goto("/activity/2024");

      await page.waitForLoadState("domcontentloaded");

      // Check for year heading (h1) - wait for it to be visible
      await page.waitForSelector('h1:has-text("2024年")', { timeout: 10000 });
      await expect(
        page.getByRole("heading", { name: "2024年", exact: true, level: 1 }),
      ).toBeVisible();
    });

    test("links from year summary to monthly activity", async ({ page }) => {
      await page.goto("/activity/2026");

      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("button", {
          name: /2026年6月の月別アクティビティへ移動/,
        }),
      ).toBeHidden();

      await page.getByRole("button", { name: "月別アクティビティ" }).click();

      await page
        .getByRole("button", {
          name: /2026年6月の月別アクティビティへ移動/,
        })
        .click();

      await expect(page).toHaveURL(/\/activity\/2026\/06$/);
    });

    test("summary から watch へ遷移してもライトモードを維持する", async ({
      page,
    }) => {
      await page.goto("/watch", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/watch(\?|$)/);
      await page.waitForSelector(
        'iframe[src*="youtube"], [data-testid="main-player"]',
        {
          timeout: 15000,
        },
      );
      await setTheme(page, "dark");

      await page.goto("/activity/2026", { waitUntil: "domcontentloaded" });
      await page.waitForSelector('a[href*="/watch?v="]', { timeout: 15000 });

      await setTheme(page, "light");
      await expect(page.locator("html")).toHaveAttribute(
        "data-mantine-color-scheme",
        "light",
      );

      await page.locator('a[href*="/watch?v="]').first().click();
      await expect(page).toHaveURL(/\/watch\?v=/);

      await expect(page.locator("html")).toHaveAttribute(
        "data-mantine-color-scheme",
        "light",
      );
      await expect
        .poll(() =>
          page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
          ),
        )
        .toBe(false);
    });
  });

  test.describe("Month activity page", () => {
    const mockCalendarEvent = async (
      page: import("@playwright/test").Page,
      archives: Array<Record<string, unknown>> = [],
      songs: Array<Record<string, unknown>> = [],
    ) => {
      await page.route("**/api/songs**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(songs),
        });
      });
      for (const pattern of ["**/api/milestones**", "**/api/yt/channels**"]) {
        await page.route(pattern, async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: "[]",
          });
        });
      }
      await page.route("**/api/archives", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(archives),
        });
      });
      await page.route("**/api/stat/views**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ statistics: {} }),
        });
      });
      await page.route("**/api/events**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              start_at: "2026-06-03T00:00:00.000Z",
              end_at: "2026-06-03T00:00:00.000Z",
              content: "カレンダー表示確認イベント",
              place: "テスト会場",
              place_url: "",
              note: "",
              url: "https://example.com/calendar-event",
              importance: "normal",
            },
            {
              start_at: "2026-06-04T00:00:00.000Z",
              end_at: "2026-06-04T00:00:00.000Z",
              content: "当月全体表示確認イベント",
              place: "別のテスト会場",
              place_url: "",
              note: "",
              url: "https://example.com/month-event",
              importance: "normal",
            },
          ]),
        });
      });
    };

    test("displays monthly activity page with month pager", async ({
      page,
    }) => {
      await page.goto("/activity/2026/06");

      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("heading", { name: "2026年6月", exact: true, level: 1 }),
      ).toBeVisible();
      await expect(
        page.locator('a[href="/activity/2026/05"]').first(),
      ).toBeVisible();
      await expect(
        page.locator('a[href="/activity/2026/07"]').first(),
      ).toBeVisible();
    });

    test("opens month picker from month page year button", async ({ page }) => {
      await page.goto("/activity/2026/06");

      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("button", {
          name: /2026年5月の月別アクティビティへ移動/,
        }),
      ).toBeHidden();

      await page.getByRole("button", { name: "2026 年" }).click();

      await page
        .getByRole("button", {
          name: /2026年5月の月別アクティビティへ移動/,
        })
        .click();

      await expect(page).toHaveURL(/\/activity\/2026\/05$/);
    });

    test("shows the calendar first and keeps day details when switching views", async ({
      page,
    }) => {
      await mockCalendarEvent(page);
      await page.goto("/activity/2026/06");

      const calendar = page
        .locator('[data-testid="activity-calendar"]:visible')
        .last();
      await expect(calendar).toBeVisible();
      await expect(calendar).toHaveAttribute("aria-busy", "false");

      const day = calendar.locator('button[data-date="2026-06-03"]');
      await day.click();
      const selectedDayDetails = page.locator(
        '[data-testid="activity-selected-day-details"]:visible',
      );
      await expect(selectedDayDetails).toHaveAttribute(
        "data-activity-scope",
        "month",
      );
      await expect(
        selectedDayDetails
          .getByRole("button", {
            name: "カレンダー表示確認イベントの詳細を表示",
          })
          .first(),
      ).toBeVisible();
      await expect(
        selectedDayDetails
          .getByRole("button", {
            name: "当月全体表示確認イベントの詳細を表示",
          })
          .first(),
      ).toBeVisible();

      await selectedDayDetails
        .getByRole("button", {
          name: "カレンダー表示確認イベントの詳細を表示",
        })
        .first()
        .click();
      const drawerContent = page.getByTestId("activity-detail-content");
      await expect(drawerContent).toBeVisible();
      await expect(
        drawerContent.getByRole("link", {
          name: "カレンダー表示確認イベント",
        }),
      ).toBeVisible();
      await page.getByRole("button", { name: "詳細を閉じる" }).click();
      await expect(drawerContent).toBeHidden();

      await page.getByText("タイムライン", { exact: true }).click();
      await expect(calendar).toBeHidden();
      await expect(
        page.getByRole("link", { name: "カレンダー表示確認イベント" }),
      ).toBeVisible();
    });

    test("keeps the mobile calendar within the viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await mockCalendarEvent(page);
      await page.goto("/activity/2026/06");

      const calendar = page
        .locator('[data-testid="activity-calendar"]:visible')
        .last();
      const dayCell = calendar.locator('td[data-date-cell="2026-06-03"]');
      await expect(calendar).toBeVisible();
      await expect(calendar).toHaveAttribute("aria-busy", "false");
      await expect(dayCell.getByText("1件", { exact: true })).toBeVisible();
      await expect(
        dayCell.getByText("カレンダー表示確認イベント"),
      ).toBeHidden();
      const selectedDayDetails = page.getByTestId(
        "activity-selected-day-details",
      );
      await expect(selectedDayDetails).toHaveAttribute(
        "data-activity-scope",
        "day",
      );
      await expect(
        selectedDayDetails
          .getByRole("button", {
            name: "カレンダー表示確認イベントの詳細を表示",
          })
          .first(),
      ).toBeVisible();
      await expect(
        selectedDayDetails.getByRole("button", {
          name: "当月全体表示確認イベントの詳細を表示",
        }),
      ).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
          ),
        )
        .toBe(true);
    });

    test("shows up to two archive thumbnails on desktop and hides them on mobile", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1536, height: 900 });
      const archives = [1, 2, 3].map((index) => ({
        sequence: index,
        topic: "ホロライブドリームス",
        title: `カレンダー配信${index}`,
        video_id: `calendar-stream-${index}`,
        channel_id: "UC-test",
        video_url: `https://www.youtube.com/watch?v=calendar-stream-${index}`,
        video_duration: "01:00:00",
        description: "",
        published_at: `2026-06-03T0${index}:00:00.000Z`,
        stream_started_at: `2026-06-03T0${index}:00:00.000Z`,
        timestamp_comment:
          index === 1 ? "00:10 オープニング\n01:23 本編開始" : "",
        importance: "normal",
      }));
      archives.push({
        sequence: 4,
        topic: "ホロライブドリームス",
        title: "カレンダー単独配信",
        video_id: "calendar-stream-single",
        channel_id: "UC-test",
        video_url: "https://www.youtube.com/watch?v=calendar-stream-single",
        video_duration: "01:00:00",
        description: "",
        published_at: "2026-06-04T01:00:00.000Z",
        stream_started_at: "2026-06-04T01:00:00.000Z",
        timestamp_comment: "",
        importance: "normal",
      });
      await mockCalendarEvent(page, archives, [
        {
          title: "データベース対象曲",
          artist: "AZKi",
          sing: "AZKi",
          sings: ["AZKi"],
          lyricist: "",
          composer: "",
          arranger: "",
          video_title: "カレンダー配信1",
          video_uri: "https://www.youtube.com/watch?v=calendar-stream-1",
          video_id: "calendar-stream-1",
          start: 42,
          end: 0,
          broadcast_at: "2025-06-03T01:00:00.000Z",
          year: 2025,
          tags: [],
          song_tags: [],
          milestones: [],
        },
      ]);
      await page.goto("/activity/2026/06");

      const calendar = page
        .locator('[data-testid="activity-calendar"]:visible')
        .last();
      await expect(calendar).toHaveAttribute("aria-busy", "false");
      const day = calendar.locator('button[data-date="2026-06-03"]');
      const dayCell = calendar.locator('td[data-date-cell="2026-06-03"]');
      const emptyDayCell = calendar.locator('td[data-date-cell="2026-06-01"]');
      const emptyDayButton = emptyDayCell.locator(
        'button[data-date="2026-06-01"]',
      );
      const thumbnails = dayCell.getByTestId("activity-calendar-thumbnail");
      const singleDayCell = calendar.locator('td[data-date-cell="2026-06-04"]');
      const singleThumbnailGrid = singleDayCell.getByTestId(
        "activity-calendar-thumbnails",
      );
      const singleThumbnail = singleDayCell.getByTestId(
        "activity-calendar-thumbnail",
      );

      await expect(thumbnails).toHaveCount(2);
      await expect(thumbnails.first()).toBeVisible();
      await expect(thumbnails.nth(1)).toBeVisible();
      await expect(singleThumbnail).toBeVisible();
      await expect
        .poll(async () => {
          const [cellBox, buttonBox] = await Promise.all([
            emptyDayCell.boundingBox(),
            emptyDayButton.boundingBox(),
          ]);

          if (!cellBox || !buttonBox) {
            return Number.POSITIVE_INFINITY;
          }

          return Math.max(
            Math.abs(cellBox.x - buttonBox.x),
            Math.abs(cellBox.y - buttonBox.y),
            Math.abs(cellBox.width - buttonBox.width),
            Math.abs(cellBox.height - buttonBox.height),
          );
        })
        .toBeLessThanOrEqual(1);
      const singleThumbnailWidths = await singleDayCell.evaluate((element) => {
        const grid = element.querySelector(
          '[data-testid="activity-calendar-thumbnails"]',
        );
        const thumbnail = element.querySelector(
          '[data-testid="activity-calendar-thumbnail"]',
        );

        return {
          grid: grid?.getBoundingClientRect().width ?? 0,
          thumbnail: thumbnail?.getBoundingClientRect().width ?? 0,
        };
      });
      expect(singleThumbnailWidths.thumbnail).toBeGreaterThanOrEqual(
        singleThumbnailWidths.grid - 1,
      );

      await thumbnails.first().click();
      const drawerContent = page.getByTestId("activity-detail-content");
      await expect(drawerContent).toBeVisible();
      await expect(
        drawerContent.locator(
          'a[href="/stream-archives#archive-calendar-stream-1"]',
        ),
      ).toBeVisible();
      const detailPlayer = drawerContent.getByTestId("activity-detail-player");
      const detailTitle = drawerContent.getByTestId("activity-detail-title");
      await expect(detailPlayer).toBeVisible();
      await expect(detailTitle).toContainText("カレンダー配信1");
      const databaseLink = drawerContent.getByRole("link", {
        name: "データベースで見る",
      });
      const youtubeLink = drawerContent.getByRole("link", {
        name: "YouTubeで見る",
      });
      await expect(databaseLink).toHaveAttribute(
        "href",
        "/watch?v=calendar-stream-1&t=42s",
      );
      expect(
        await databaseLink.evaluate(
          (databaseElement, youtubeElement) =>
            Boolean(
              databaseElement.compareDocumentPosition(youtubeElement) &
              Node.DOCUMENT_POSITION_FOLLOWING,
            ),
          await youtubeLink.elementHandle(),
        ),
      ).toBe(true);
      const detailMetadata = drawerContent.getByTestId(
        "activity-detail-archive-metadata",
      );
      await expect(detailMetadata).toContainText("配信日時");
      await expect(detailMetadata).toContainText("動画時間");
      await expect(detailMetadata).toContainText("01:00:00");
      await expect(detailMetadata).toContainText("シリーズ");
      await expect(
        detailMetadata.getByRole("link", { name: "ホロライブドリームス" }),
      ).toHaveAttribute(
        "href",
        "/stream-archives?series=%E3%83%9B%E3%83%AD%E3%83%A9%E3%82%A4%E3%83%96%E3%83%89%E3%83%AA%E3%83%BC%E3%83%A0%E3%82%B9",
      );
      const detailTimestamps = drawerContent.getByTestId(
        "activity-detail-timestamps",
      );
      await expect(detailTimestamps).toContainText("タイムスタンプ");
      await expect(
        detailTimestamps.getByRole("link", { name: "00:10" }),
      ).toHaveAttribute(
        "href",
        "https://www.youtube.com/watch?v=calendar-stream-1&t=10",
      );
      await expect(drawerContent.locator(".mantine-Timeline-root")).toHaveCount(
        0,
      );
      const detailWidths = await drawerContent.evaluate((element) => ({
        content: element.getBoundingClientRect().width,
        player:
          element
            .querySelector('[data-testid="activity-detail-player"]')
            ?.getBoundingClientRect().width ?? 0,
        titleFontSize: Number.parseFloat(
          window.getComputedStyle(
            element.querySelector('[data-testid="activity-detail-title"]')!,
          ).fontSize,
        ),
      }));
      expect(detailWidths.player).toBeGreaterThanOrEqual(
        detailWidths.content - 1,
      );
      expect(detailWidths.titleFontSize).toBeGreaterThanOrEqual(20);
      const drawerBox = await page
        .getByTestId("activity-detail-drawer")
        .boundingBox();
      expect(drawerBox).not.toBeNull();
      expect(drawerBox!.x + drawerBox!.width).toBeGreaterThanOrEqual(
        (await page.viewportSize())!.width - 2,
      );
      await page.getByRole("button", { name: "詳細を閉じる" }).click();
      await expect(drawerContent).toBeHidden();

      await page.setViewportSize({ width: 375, height: 812 });
      await expect(thumbnails.first()).toBeHidden();
      await expect(singleThumbnailGrid).toBeHidden();
      await day.click();
      await page
        .getByTestId("activity-selected-day-details")
        .getByRole("button", { name: /の詳細を表示$/ })
        .first()
        .click();
      await expect(drawerContent).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
          ),
        )
        .toBe(true);
    });

    test("normalizes single-digit month URL", async ({ page }) => {
      await page.goto("/activity/2026/6");

      await page.waitForLoadState("domcontentloaded");

      await expect(page).toHaveURL(/\/activity\/2026\/06$/);
    });

    test("summary index links to current monthly activity", async ({
      page,
    }) => {
      await page.goto("/activity");

      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator('a[href^="/activity/"][href$="/07"]').first(),
      ).toBeVisible();
    });
  });
});
