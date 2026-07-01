import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { setupApiMocks } from "./mocks";
import { getCachedSongs } from "./test-utils";

const waitForDiscographyTabs = async (page: Page) => {
  await expect(page.getByRole("heading", { name: /Discography/i })).toBeVisible(
    {
      timeout: 10000,
    },
  );
  await expect(page.getByRole("tab").first()).toBeVisible({ timeout: 10000 });
};

function getDiscographyCategory(song: any) {
  const tags = song?.tags ?? [];
  if (
    tags.includes("ユニット曲") ||
    tags.includes("ゲスト参加") ||
    (song?.title || "").includes("feat. AZKi") ||
    (song?.title || "").includes("feat.AZKi")
  ) {
    return "collabo";
  }
  if (tags.includes("カバー曲")) {
    return "covers";
  }
  return "originals";
}

test.describe("Discography page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("renders discography page with album information", async ({ page }) => {
    await page.goto("/discography", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveTitle(/Discography/);

    await expect(
      page.getByRole("heading", { name: "Discography" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("displays album covers and titles", async ({ page }) => {
    await page.goto("/discography", { waitUntil: "domcontentloaded" });

    // Look for images (album covers)
    const images = page.locator("img");
    await expect(images.first()).toBeVisible({ timeout: 10000 });
  });

  test("album page groups MV and art track with variant switcher", async ({
    page,
  }) => {
    const songs: any[] = getCachedSongs();
    const goingMyWay = songs.filter(
      (song) => song.album === "Going My Way" && song.title === "Going My Way",
    );
    const mv = goingMyWay.find((song) =>
      (song.tags ?? []).some((tag: string) => tag.includes("MV")),
    );
    const artTrack = goingMyWay.find((song) =>
      (song.tags ?? []).includes("アートトラック"),
    );
    test.skip(!mv || !artTrack, "Going My Way MV/art track fixtures missing");

    await page.goto("/discography/album/going-my-way", {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("heading", { name: "Going My Way" }),
    ).toBeVisible({ timeout: 10000 });

    const rows = page.locator("section article").filter({
      has: page.getByRole("link", { name: "Going My Way" }),
    });
    await expect(rows).toHaveCount(1);

    const row = rows.first();
    await expect(row.getByTestId("album-release-variant-0")).toBeVisible();
    await expect(
      row.locator(`a[href="https://www.youtube.com/watch?v=${mv.video_id}"]`),
    ).toBeVisible();

    await row.getByText("アートトラック").click();
    await expect(
      row.locator(
        `a[href="https://www.youtube.com/watch?v=${artTrack.video_id}"]`,
      ),
    ).toBeVisible();
  });

  test("album page groups multiple MV variants without album", async ({
    page,
  }) => {
    const songs: any[] = getCachedSongs();
    const mvVariants = songs
      .filter(
        (song) =>
          song.title === "from A to Z" &&
          song.artist === "AZKi" &&
          !song.album &&
          (song.tags ?? []).some((tag: string) => tag.includes("MV")),
      )
      .sort((left, right) => {
        const leftOrder = left.source_order ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.source_order ?? Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder;
      });
    test.skip(
      mvVariants.length < 2,
      "from A to Z multiple MV fixtures missing",
    );

    await page.goto("/discography/album/from-a-to-z", {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("heading", { name: "from A to Z" }),
    ).toBeVisible({ timeout: 10000 });

    const rows = page.locator("section article").filter({
      has: page.getByRole("link", { name: "from A to Z" }),
    });
    await expect(rows).toHaveCount(1);

    const row = rows.first();
    await expect(row.getByText("MV①")).toBeVisible();
    await expect(row.getByText("MV②")).toBeVisible();
    await expect(
      row.locator(
        `a[href="https://www.youtube.com/watch?v=${mvVariants[0].video_id}"]`,
      ),
    ).toBeVisible();

    await row.getByText("MV②").click();
    await expect(
      row.locator(
        `a[href="https://www.youtube.com/watch?v=${mvVariants[1].video_id}"]`,
      ),
    ).toBeVisible();
  });

  test("album page groups AniAZ with original MV across album boundary", async ({
    page,
  }) => {
    const songs: any[] = getCachedSongs();
    const nekoVariants = songs.filter(
      (song) =>
        song.title === "猫ならばいける" &&
        song.artist === "AZKi" &&
        (song.tags ?? []).some((tag: string) => tag.includes("MV")),
    );
    const originalMv = nekoVariants.find(
      (song) => !(song.tags ?? []).includes("アニAZ"),
    );
    const animatedMv = nekoVariants.find((song) =>
      (song.tags ?? []).includes("アニAZ"),
    );
    test.skip(
      !originalMv || !animatedMv,
      "猫ならばいける MV/AniAZ fixtures missing",
    );

    await page.goto(
      `/discography/album/${encodeURIComponent("猫ならばいける")}`,
      {
        waitUntil: "domcontentloaded",
      },
    );

    await expect(
      page.getByRole("heading", { name: "猫ならばいける" }),
    ).toBeVisible({ timeout: 10000 });

    const rows = page.locator("section article").filter({
      has: page.getByRole("link", { name: "猫ならばいける" }),
    });
    await expect(rows).toHaveCount(1);

    const row = rows.first();
    await expect(row.getByText("MV", { exact: true })).toBeVisible();
    await expect(row.getByText("アニAZ", { exact: true })).toBeVisible();
    await expect(
      row.locator(
        `a[href="https://www.youtube.com/watch?v=${originalMv.video_id}"]`,
      ),
    ).toBeVisible();

    await row.getByText("アニAZ", { exact: true }).click();
    await expect(
      row.locator(
        `a[href="https://www.youtube.com/watch?v=${animatedMv.video_id}"]`,
      ),
    ).toBeVisible();
  });

  test("album toggle off opens Neko release variants without album navigation", async ({
    page,
  }) => {
    const songs: any[] = getCachedSongs();
    const nekoVariants = songs.filter(
      (song) =>
        song.title === "猫ならばいける" &&
        song.artist === "AZKi" &&
        (song.tags ?? []).some((tag: string) => tag.includes("MV")),
    );
    const originalMv = nekoVariants.find(
      (song) => !(song.tags ?? []).includes("アニAZ"),
    );
    const animatedMv = nekoVariants.find((song) =>
      (song.tags ?? []).includes("アニAZ"),
    );
    test.skip(
      !originalMv || !animatedMv,
      "猫ならばいける MV/AniAZ fixtures missing",
    );

    await page.goto("/discography/originals", {
      waitUntil: "domcontentloaded",
    });
    await waitForDiscographyTabs(page);

    await page.getByLabel(/Group by album|アルバムごとに表示/).click();
    await page.locator('[title*="猫ならばいける"]').first().click();

    await expect(page).not.toHaveURL(/\/discography\/album\//);
    await expect(
      page.getByRole("heading", { name: "猫ならばいける" }),
    ).toBeVisible();
    await expect(page.getByText("MV", { exact: true })).toBeVisible();
    await expect(page.getByText("アニAZ", { exact: true })).toBeVisible();
    await expect(
      page.locator(
        `a[href="/discography/album/${encodeURIComponent("猫ならばいける")}"]`,
      ),
    ).toHaveCount(0);
    await expect(
      page
        .locator('a[href^="/discography/originals/"]')
        .filter({ hasText: "猫ならばいける" })
        .first(),
    ).toBeVisible();
  });

  test("song detail breadcrumbs point to virtual release album pages", async ({
    page,
  }) => {
    const songs: any[] = getCachedSongs();
    const fromAToZ = songs.find(
      (song) =>
        song.title === "from A to Z" &&
        song.artist === "AZKi" &&
        !song.album &&
        (song.tags ?? []).some((tag: string) => tag.includes("MV")),
    );
    const nekoAniAz = songs.find(
      (song) =>
        song.title === "猫ならばいける" &&
        song.artist === "AZKi" &&
        (song.tags ?? []).includes("アニAZ"),
    );
    test.skip(
      !fromAToZ || !nekoAniAz,
      "from A to Z / 猫ならばいける fixtures missing",
    );

    await page.goto(
      `/discography/originals/${encodeURIComponent(fromAToZ.slugv2 ?? fromAToZ.slug)}`,
      { waitUntil: "domcontentloaded" },
    );
    await expect(
      page.locator('a[href="/discography/album/from-a-to-z"]'),
    ).toBeVisible({ timeout: 10000 });

    await page.goto(
      `/discography/originals/${encodeURIComponent(nekoAniAz.slugv2 ?? nekoAniAz.slug)}`,
      { waitUntil: "domcontentloaded" },
    );
    await expect(
      page.locator(
        `a[href="/discography/album/${encodeURIComponent("猫ならばいける")}"]`,
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test("discography slug page shows details", async ({ page }) => {
    const songs: any[] = getCachedSongs();
    const withSlug = songs.find(
      (s) => s && s.slug && s.tags && s.tags.includes("オリ曲"),
    );
    test.skip(!withSlug, "no song with slug available for testing");
    const slug = withSlug.slug;

    const category = getDiscographyCategory(withSlug);
    await page.goto(`/discography/${category}/${encodeURIComponent(slug)}`, {
      waitUntil: "domcontentloaded",
    });

    // Prefer asserting the song title (or album) header is visible to avoid
    // matching hidden global h1s like the site title.
    const expectedTitle = withSlug.title ?? withSlug.album ?? null;
    await expect(
      page.locator("h1").filter({ hasText: expectedTitle }),
    ).toBeVisible({ timeout: 10000 });
    // iframe (YouTube) should be present
    await expect(page.locator("iframe").first()).toBeVisible({
      timeout: 10000,
    });
    // Breadcrumb link back to discography exists (match by href to avoid exact text changes)
    await expect(page.locator('a[href^="/discography"]').first()).toBeVisible();
  });

  test("tab switching updates selected tab", async ({ page }) => {
    await page.goto("/discography/originals", {
      waitUntil: "domcontentloaded",
    });

    await waitForDiscographyTabs(page);

    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();
    test.skip(
      tabCount < 3,
      "not enough tabs present to perform tab-switching assertions",
    );

    const unitTab = tabs.nth(2);
    const coverTab = tabs.nth(3);

    await unitTab.click();
    await expect(unitTab).toHaveAttribute("aria-selected", "true");

    await coverTab.click();
    await expect(coverTab).toHaveAttribute("aria-selected", "true");
  });

  test("/discography/covers opens Covers tab", async ({ page }) => {
    // Use query param which is resilient to routing changes
    await page.goto("/discography/covers", { waitUntil: "domcontentloaded" });

    await waitForDiscographyTabs(page);

    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();
    test.skip(tabCount < 4, "not enough tabs present to assert covers tab");
    const coverTab = tabs.nth(3);
    await expect(coverTab).toHaveAttribute("aria-selected", "true");
  });
});
