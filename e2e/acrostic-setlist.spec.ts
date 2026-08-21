import { expect, test, type Page } from "@playwright/test";
import { setupAuthenticatedApiMocks } from "./mocks";

const songs = [
  {
    title: "曲A",
    title_aliases: ["じゃれあい", "Alpha"],
    artist: "Artist",
    album: "",
    lyricist: "",
    composer: "",
    arranger: "",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    sing: "AZKi",
    sings: ["AZKi"],
    video_title: "Stream A",
    video_uri: "",
    video_id: "video-a",
    start: 10,
    end: 100,
    broadcast_at: "2026-03-01T00:00:00.000Z",
    year: 2026,
    tags: [],
    milestones: [],
    hl: {
      ja: { title: "曲A", artist: "Artist", artists: ["Artist"] },
    },
  },
  {
    title: "Another",
    title_aliases: ["じゃすとびーふれんず"],
    artist: "Artist",
    album: "",
    lyricist: "",
    composer: "",
    arranger: "",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    sing: "AZKi",
    sings: ["AZKi"],
    video_title: "Stream Another",
    video_uri: "",
    video_id: "video-another",
    start: 20,
    end: 100,
    broadcast_at: "2026-02-01T00:00:00.000Z",
    year: 2026,
    tags: [],
    milestones: [],
    hl: {
      ja: { title: "Another", artist: "Artist", artists: ["Artist"] },
    },
  },
  {
    title: "Zebra",
    artist: "Artist",
    album: "",
    lyricist: "",
    composer: "",
    arranger: "",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    sing: "AZKi",
    sings: ["AZKi"],
    video_title: "Stream Z",
    video_uri: "",
    video_id: "video-z",
    start: 30,
    end: 100,
    broadcast_at: "2026-01-01T00:00:00.000Z",
    year: 2026,
    tags: [],
    milestones: [],
    hl: {
      ja: { title: "Zebra", artist: "Artist", artists: ["Artist"] },
    },
  },
];

const setupAcrosticMocks = async (page: Page) => {
  await setupAuthenticatedApiMocks(page);
  await page.route("**/api/songs**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(songs),
    });
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as typeof window & { __copiedText?: string }).__copiedText =
            text;
        },
      },
    });
  });
};

test.describe("縦読みセトリメーカー", () => {
  test.beforeEach(async ({ page }) => {
    await setupAcrosticMocks(page);
  });

  test("生成・候補変更・コピー・保存・再生順を扱える", async ({ page }) => {
    await page.goto("/share/acrostic-setlist");
    await expect(
      page.getByRole("heading", { name: "縦読みセトリメーカー" }),
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "縦読みするフレーズ" })
      .fill("じゃ-Z");
    await page.getByRole("button", { name: "セットリストを生成" }).click();

    const aSelect = page.getByRole("combobox", {
      name: "じゃ から始まる曲",
    });
    await expect(aSelect).toHaveValue("曲A - Artist");
    const zSelect = page.getByRole("combobox", {
      name: "Z から始まる曲",
    });
    const [combinedKanaBox, singleCharacterBox] = await Promise.all([
      aSelect.boundingBox(),
      zSelect.boundingBox(),
    ]);
    expect(combinedKanaBox).not.toBeNull();
    expect(singleCharacterBox).not.toBeNull();
    expect(
      Math.abs(combinedKanaBox!.x - singleCharacterBox!.x),
    ).toBeLessThanOrEqual(1);
    await aSelect.click();
    await page.getByRole("option", { name: "Another - Artist" }).click();
    await expect(aSelect).toHaveValue("Another - Artist");

    await page.getByRole("button", { name: "テキストをコピー" }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & { __copiedText?: string }).__copiedText,
        ),
      )
      .toBe("じゃ｜Another - Artist\nZ｜Zebra - Artist");

    const playHref = await page
      .getByRole("link", { name: "この順番で再生" })
      .getAttribute("href");
    const encodedPlaylist = new URL(
      playHref!,
      "http://localhost:3000",
    ).searchParams.get("playlist");
    const decodedPlaylist = JSON.parse(
      Buffer.from(encodedPlaylist!, "base64").toString("utf8"),
    );
    expect(decodedPlaylist.songs).toEqual([
      { v: "video-another", s: "20" },
      { v: "video-z", s: "30" },
    ]);

    await page.getByRole("button", { name: "プレイリストに保存" }).click();
    const modal = page
      .locator('[role="dialog"]')
      .filter({ hasText: "新規プレイリストを作成" });
    await expect(modal).toBeVisible();
    await expect(
      modal.getByRole("textbox", { name: /プレイリスト名/ }),
    ).toHaveValue("縦読み「じゃ-Z」");

    const playlistRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/library/playlists") &&
        request.method() === "POST",
    );
    await modal.getByRole("button", { name: "作成", exact: true }).click();
    const payload = (await playlistRequest).postDataJSON();
    expect(payload.songs).toEqual([
      { videoId: "video-another", start: "20" },
      { videoId: "video-z", start: "30" },
    ]);
  });
});

test.describe("縦読みセトリメーカーのモバイル表示", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await setupAcrosticMocks(page);
  });

  test("通常のページスクロールで長いセットリストを編集できる", async ({
    page,
  }) => {
    await page.goto("/share/acrostic-setlist");
    await page
      .getByRole("textbox", { name: "縦読みするフレーズ" })
      .fill("AZ".repeat(8));
    await page.getByRole("button", { name: "セットリストを生成" }).click();
    await page.getByRole("switch", { name: "同じ曲を再利用する" }).check();

    await expect(page.getByTestId("acrostic-row-15")).toBeAttached();
    const pageShell = page.getByTestId("acrostic-setlist-page");
    const before = await pageShell.evaluate((element) => ({
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);
    expect(before.scrollWidth).toBeLessThanOrEqual(before.clientWidth + 1);

    await pageShell.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(
      page.getByRole("link", { name: "この順番で再生" }),
    ).toBeVisible();
    expect(
      await pageShell.evaluate((element) => element.scrollTop),
    ).toBeGreaterThan(0);
  });
});
