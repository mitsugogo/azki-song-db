import { expect, test, type Page } from "@playwright/test";
import { setupApiMocks } from "./mocks";

const icon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%23faa2c1'/%3E%3C/svg%3E";

const channel = (
  talentName: string,
  branch: string,
  youtubeId: string,
  generation = "",
) => ({
  branch,
  generation,
  talentName,
  artistName: talentName,
  youtubeId,
  channelName: `${talentName} Channel`,
  handle: "",
  subscriberCount: 0,
  iconUrl: icon,
});

async function setupStreamArchiveMocks(page: Page) {
  await setupApiMocks(page);

  await page.route("**/build-info.json", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });

  for (const pattern of [
    "https://i.ytimg.com/**",
    "https://img.youtube.com/**",
  ]) {
    await page.route(pattern, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='320' height='180' fill='#faa2c1'/></svg>",
      });
    });
  }

  await page.route("**/api/yt/channels**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        channel("AZKi", "JP", "UC-azki"),
        channel("星街すいせい", "JP", "UC-suisei", "0期生"),
        channel("風真いろは", "DEV_IS", "UC-iroha", "holoX"),
        channel("夜空メル", "JP", "UC-mel", "1期生、卒業生"),
      ]),
    });
  });

  await page.route("**/api/archives", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          sequence: 1,
          topic: "コラボ",
          title: "AZKiとすいちゃんのコラボ",
          video_id: "collaboration-1",
          channel_id: "UC-azki",
          video_url: "https://www.youtube.com/watch?v=collaboration-1",
          video_duration: "PT1H",
          description: "",
          published_at: "2026-01-01T01:00:00.000Z",
          stream_started_at: "2026-01-01T00:00:00.000Z",
          timestamp_comment: "",
          participants: ["AZKi", "星街すいせい"],
        },
        {
          sequence: 2,
          topic: "コラボ",
          title: "AZKiとメルのコラボ",
          video_id: "collaboration-2",
          channel_id: "UC-azki",
          video_url: "https://www.youtube.com/watch?v=collaboration-2",
          video_duration: "PT2H",
          description: "",
          published_at: "2026-02-01T01:00:00.000Z",
          stream_started_at: "2026-02-01T00:00:00.000Z",
          timestamp_comment: "",
          participants: ["AZKi", "夜空メル"],
        },
      ]),
    });
  });
}

test.describe("Stream archives statistics", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await setupStreamArchiveMocks(page);
  });

  test("fits the activity heatmap and shows members without collabs", async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/stream-archives", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/stream-archives$/);
    await expect(page).toHaveTitle(/配信アーカイブ/);
    await expect(
      page.locator(
        "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
      ),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "配信アーカイブ" }),
    ).toBeVisible();

    const suiseiRanking = page.getByRole("link", { name: /星街すいせい/ });
    await expect(suiseiRanking.getByText("0期生")).toBeVisible();
    await expect(suiseiRanking.getByText("1h")).toBeVisible();
    await expect(suiseiRanking.getByText("1件")).toBeVisible();
    const avatarBox = await suiseiRanking
      .locator(".mantine-Avatar-root")
      .boundingBox();
    const nameBox = await suiseiRanking.getByText("星街すいせい").boundingBox();
    expect(avatarBox).not.toBeNull();
    expect(nameBox).not.toBeNull();
    expect(avatarBox!.x + avatarBox!.width).toBeLessThanOrEqual(nameBox!.x);
    await expect(suiseiRanking.locator(".mantine-Badge-root")).toHaveCSS(
      "background-color",
      "rgb(164, 235, 245)",
    );
    await expect(suiseiRanking.locator(".mantine-Progress-section")).toHaveCSS(
      "background-color",
      "rgb(164, 235, 245)",
    );

    const melRanking = page.getByRole("link", { name: /夜空メル/ });
    await expect(melRanking.getByText("1期生")).toBeVisible();
    await expect(melRanking.getByText(/卒業生/)).toBeVisible();
    await expect(melRanking.getByText("2h")).toBeVisible();
    await expect(melRanking.getByText("1件")).toBeVisible();

    const activityCalendar = page.getByRole("region", { name: "活動量" });
    await expect(activityCalendar).toBeVisible();
    await expect
      .poll(() =>
        activityCalendar.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
    await activityCalendar.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("activity-mobile.png"),
    });

    const noCollaborationGroup = page.getByRole("group", { name: "未コラボ" });
    await expect(noCollaborationGroup).toBeVisible();
    await expect(
      noCollaborationGroup.getByRole("img", { name: "風真いろは" }),
    ).toBeVisible();
    await expect(
      noCollaborationGroup.getByRole("img", { name: "夜空メル" }),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        noCollaborationGroup.evaluate(
          (element) => getComputedStyle(element).borderTopStyle,
        ),
      )
      .toBe("solid");
    await noCollaborationGroup.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("no-collaboration-mobile.png"),
    });

    await page
      .getByRole("radiogroup", { name: "コラボランキングの表示切替" })
      .locator("label")
      .nth(1)
      .click();
    await expect(noCollaborationGroup).toBeHidden();
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("Stream archives statistics desktop layout", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test.beforeEach(async ({ page }) => {
    await setupStreamArchiveMocks(page);
  });

  test("places horizontal charts on full-width rows", async ({
    page,
  }, testInfo) => {
    await page.goto("/stream-archives", { waitUntil: "domcontentloaded" });

    const getCard = (heading: string) =>
      page
        .locator("section")
        .filter({
          has: page.getByRole("heading", { name: heading, exact: true }),
        })
        .first();

    const getCardBox = async (heading: string) => {
      const card = getCard(heading);
      await expect(card).toBeVisible();
      return card.boundingBox();
    };

    const activityBox = await getCardBox("活動量");
    const collaborationBox = await getCardBox("よくコラボしたホロメン");
    const categoryBox = await getCardBox("配信数の多いカテゴリ");
    const longestStreamBox = await getCardBox("配信時間が長い配信");
    const timeBox = await getCardBox("配信開始時間");

    expect(activityBox).not.toBeNull();
    expect(collaborationBox).not.toBeNull();
    expect(categoryBox).not.toBeNull();
    expect(longestStreamBox).not.toBeNull();
    expect(timeBox).not.toBeNull();
    expect(activityBox!.width).toBeGreaterThan(collaborationBox!.width * 1.8);
    expect(activityBox!.y + activityBox!.height).toBeLessThanOrEqual(
      collaborationBox!.y,
    );
    expect(Math.abs(collaborationBox!.y - categoryBox!.y)).toBeLessThan(2);
    expect(Math.abs(collaborationBox!.y - longestStreamBox!.y)).toBeLessThan(2);
    expect(timeBox!.y).toBeGreaterThanOrEqual(
      Math.max(
        collaborationBox!.y + collaborationBox!.height,
        categoryBox!.y + categoryBox!.height,
        longestStreamBox!.y + longestStreamBox!.height,
      ),
    );

    const collaborationName = getCard("よくコラボしたホロメン").getByText(
      "夜空メル",
      { exact: true },
    );
    const categoryName = getCard("配信数の多いカテゴリ").getByText("コラボ", {
      exact: true,
    });
    const longestStreamTitle = getCard("配信時間が長い配信").getByText(
      "AZKiとメルのコラボ",
      { exact: true },
    );
    const referenceTypography = await collaborationName.evaluate((element) => {
      const style = getComputedStyle(element);
      return { fontSize: style.fontSize, fontWeight: style.fontWeight };
    });
    await expect
      .poll(() =>
        categoryName.evaluate((element) => {
          const style = getComputedStyle(element);
          return { fontSize: style.fontSize, fontWeight: style.fontWeight };
        }),
      )
      .toEqual(referenceTypography);
    await expect
      .poll(() =>
        longestStreamTitle.evaluate((element) => {
          const style = getComputedStyle(element);
          return { fontSize: style.fontSize, fontWeight: style.fontWeight };
        }),
      )
      .toEqual(referenceTypography);
    await expect(
      page
        .getByRole("progressbar", { name: "コラボの配信数" })
        .locator(".mantine-Progress-section"),
    ).toHaveCSS("background-color", "rgb(164, 235, 245)");
    await expect(
      page.getByRole("button", { name: /1位 AZKiとメルのコラボ 2h/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: "AZKiとメルのコラボのサムネイル",
      }),
    ).toBeVisible();
    const longestStreamGauge = page.getByRole("progressbar", {
      name: "AZKiとメルのコラボの配信時間 2h",
    });
    await expect(
      longestStreamGauge.locator(".mantine-Progress-section"),
    ).toHaveCSS("background-color", "rgb(164, 235, 245)");
    await page
      .getByRole("button", { name: /1位 AZKiとメルのコラボ 2h/ })
      .click();
    const detailContent = page.getByTestId("archive-detail-content");
    await expect(
      detailContent.getByRole("heading", {
        name: "AZKiとメルのコラボ",
      }),
    ).toBeVisible();
    await expect(
      detailContent.getByRole("link", { name: "再生" }),
    ).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=collaboration-2",
    );
    await page.getByRole("button", { name: "詳細を閉じる" }).click();
    await expect(detailContent).toBeHidden();
    const longestStreamPeriod = page.getByRole("combobox", {
      name: "配信時間ランキングの表示期間",
    });
    await expect(longestStreamPeriod).toHaveValue("全期間");
    await longestStreamPeriod.click();
    await page.getByRole("option", { name: "2026" }).click();
    await expect(longestStreamPeriod).toHaveValue("2026");
    await page.screenshot({
      path: testInfo.outputPath("statistics-desktop-layout.png"),
      fullPage: true,
    });
  });
});
