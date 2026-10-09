import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks";
import type { Song } from "../src/app/types/song";

const song = (title: string, overrides: Partial<Song> = {}) =>
  ({
    title,
    lyricist: "",
    composer: "",
    arranger: "",
    album: "",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    video_uri: "https://youtu.be/abcdefghijk",
    end: 0,
    year: 2026,
    artist: "原曲歌手",
    sings: ["AZKi"],
    sing: "AZKi",
    tags: ["歌枠"],
    song_tags: ["アニソン"],
    milestones: [],
    hl: {
      ja: { title, artist: "原曲歌手", artists: ["原曲歌手"], sings: ["AZKi"] },
    },
    video_id: "abcdefghijk",
    start: 45,
    broadcast_at: "2026-01-01T15:00:00.000Z",
    video_title: "歌枠動画",
    ...overrides,
  }) satisfies Song;

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
  const thumbnail = (route: import("@playwright/test").Route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#d11c76"/></svg>',
    });
  await page.route("**/*ytimg.com/**", thumbnail);
  await page.route("**/img.youtube.com/**", thumbnail);
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: {} }),
  );
  await page.route("**/api/songs**", (route) =>
    route.fulfill({
      json: [
        song("曲A"),
        song("曲A", {
          video_id: "lmnopqrstuv",
          broadcast_at: "2026-02-01T15:00:00.000Z",
          tags: ["ゲスト出演"],
          video_title: "ゲスト歌唱の最新動画",
        }),
        song("曲B", { song_tags: ["ボカロ"] }),
        song("対象外", { sings: ["別の歌手"], hl: undefined }),
      ],
    }),
  );
});

test("searches, filters, restores URLs and links to the latest performance", async ({
  page,
}) => {
  await page.goto("/repertoire");
  await expect(
    page.getByRole("heading", { name: "歌唱レパートリー", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "並び順" })).toHaveCount(0);
  await expect(page.locator("tbody > tr h2")).toHaveText(["曲A", "曲B"]);
  await page
    .getByRole("button", { name: "曲名で並び替え", exact: true })
    .click();
  await expect(page.locator("tbody > tr h2")).toHaveText(["曲B", "曲A"]);
  await expect(
    page.getByRole("columnheader", { name: "曲名" }),
  ).toHaveAttribute("aria-sort", "descending");
  await page
    .getByRole("button", { name: "曲名で並び替え", exact: true })
    .click();
  await expect(page.locator("tbody > tr h2")).toHaveText(["曲A", "曲B"]);
  const first = page
    .locator("tbody > tr")
    .filter({ has: page.getByRole("heading", { name: "曲A", exact: true }) });
  await expect(first.getByText("歌枠", { exact: true }).first()).toBeVisible();
  await expect(
    first.getByText("コラボ・ゲスト・ライブ等", { exact: true }),
  ).toBeVisible();
  await expect(
    first.getByRole("link", { name: "曲Aの最新の歌唱をSongDB内で再生" }),
  ).toHaveAttribute("href", "/watch?v=lmnopqrstuv&t=45");
  await expect(
    first.getByRole("link", { name: "曲Aの最新の歌唱をYouTubeで開く" }),
  ).toHaveAttribute(
    "href",
    "https://www.youtube.com/watch?v=lmnopqrstuv&t=45s",
  );
  const youtube = first.getByRole("link", {
    name: "曲Aの最新の歌唱をYouTubeで開く",
  });
  await youtube.hover();
  const preview = page.getByRole("tooltip");
  await expect(preview).toBeVisible();
  await expect(
    preview.getByRole("heading", { name: "ゲスト歌唱の最新動画" }),
  ).toBeVisible();
  await expect(
    preview.getByRole("img", { name: "ゲスト歌唱の最新動画" }),
  ).toHaveAttribute("src", /lmnopqrstuv/);
  await expect(preview).toContainText("配信日: 2026/02/02");
  await page
    .getByRole("heading", { name: "歌唱レパートリー", exact: true })
    .hover();
  await expect(preview).not.toBeVisible();
  await first.getByRole("button", { name: "アニソン", exact: true }).click();
  await expect(page.locator("tbody > tr")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("tbody > tr")).toHaveCount(1);
  await page.getByLabel("検索", { exact: true }).fill("存在しない曲");
  await expect(
    page.getByText("条件に一致する楽曲がありません。"),
  ).toBeVisible();
  await page.getByRole("button", { name: "絞り込みを解除" }).click();
  await expect(page.locator("tbody > tr")).toHaveCount(2);
  await page.evaluate(() => window.history.pushState(null, "", "/repertoire"));
  await page.getByRole("combobox", { name: "種類", exact: true }).click();
  await page
    .getByRole("option", {
      name: "コラボ・ゲスト・ライブ等",
      exact: true,
    })
    .click();
  await expect(page.locator("tbody > tr")).toHaveCount(1);
  await page.goBack();
  await expect(page).not.toHaveURL(/source=collaboration/);
  await expect(page.locator("tbody > tr")).toHaveCount(2);
});

test("supports English, dark mode and a narrow mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() =>
    localStorage.setItem("mantine-color-scheme-value", "dark"),
  );
  await page.goto("/en/repertoire");
  await expect(
    page.getByRole("heading", { name: "Singing Repertoire", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-mantine-color-scheme",
    "dark",
  );
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("combobox", { name: "Sort by", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Sort by Song title", exact: true })
    .click();
  await expect(page.locator("tbody > tr h2")).toHaveText(["曲B", "曲A"]);
  await page
    .getByRole("button", { name: "Sort by Song title", exact: true })
    .click();
  await expect(page.locator("tbody > tr h2")).toHaveText(["曲A", "曲B"]);
  const card = page.locator("tbody > tr").first();
  await expect(
    card.getByText("Collaborations, guests & live shows", { exact: true }),
  ).toBeVisible();
  await expect(
    card.getByRole("link", { name: /Play the latest performance/ }),
  ).toHaveAttribute("href", "/en/watch?v=lmnopqrstuv&t=45");
  await card.getByRole("link", { name: /Open the latest performance/ }).hover();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
