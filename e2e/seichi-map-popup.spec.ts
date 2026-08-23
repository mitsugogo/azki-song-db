import { expect, test, type Page } from "@playwright/test";

const LOCATION_ID = "aaaaaaaaaaaaaaaa";
const VIDEO_ID = "e2ePopup01A";
const LOCATION_LATITUDE = 35.681236;
const LOCATION_LONGITUDE = 139.767125;
const SECOND_LOCATION_LATITUDE = 34.693725;
const SECOND_LOCATION_LONGITUDE = 135.502254;

const setupSeichiMapPopupMocks = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("azki-seichi-map:provider", "osm");
  });

  await page.route("**/api/seichi-map/locations", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "X-Seichi-Map-User-Count": "12" },
      body: JSON.stringify([
        {
          id: LOCATION_ID,
          folder: "E2E レイヤー",
          name: "低解像度端末で確認する地点",
          description: `${Array.from(
            { length: 16 },
            (_, index) => `地点説明 ${index + 1}`,
          ).join("<br>")}<br>https://youtu.be/${VIDEO_ID}?t=90`,
          styleUrl: "#icon-1899-DB4436",
          latitude: LOCATION_LATITUDE,
          longitude: LOCATION_LONGITUDE,
          uniqueVisitorCount: 3,
        },
        {
          id: "bbbbbbbbbbbbbbbb",
          folder: "E2E レイヤー",
          name: "2回目に選択する地点",
          description: "別の聖地を選択した後も操作欄を表示する地点",
          styleUrl: "#icon-1899-DB4436",
          latitude: SECOND_LOCATION_LATITUDE,
          longitude: SECOND_LOCATION_LONGITUDE,
          uniqueVisitorCount: 0,
        },
      ]),
    });
  });

  await page.route("**/api/archives", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          video_id: VIDEO_ID,
          title: "長い地点詳細に表示するアーカイブ",
          stream_started_at: "2026-08-16T12:00:00+09:00",
        },
      ]),
    });
  });

  await page.route("**/api/yt/info**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
};

const openLongLocationPopup = async (page: Page) => {
  await setupSeichiMapPopupMocks(page);
  await page.goto(`/seichi-map?location=${LOCATION_ID}`);

  const mapSurface = page
    .locator(".seichi-map-fullscreen-surface:visible")
    .first();
  await expect(mapSurface).toBeVisible({ timeout: 15_000 });
  await mapSurface.scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: /全画面表示|Enter fullscreen/ }),
  ).toBeVisible();

  const popup = page.locator(".seichi-map-popup");
  await expect(popup).toBeVisible({ timeout: 15_000 });
  return popup;
};

const assertFixedPopupActions = async (page: Page) => {
  const popup = await openLongLocationPopup(page);
  const body = popup.locator(".seichi-map-popup__body");
  const actions = popup.locator(".seichi-map-popup__actions");
  const controls = actions.locator("a, button");

  await expect(body).toBeVisible();
  await expect(actions).toBeVisible();
  await expect(controls).toHaveCount(3);

  const bodyMetrics = await body.evaluate((element) => ({
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
    scrollHeight: element.scrollHeight,
  }));
  expect(bodyMetrics.overflowY).toBe("auto");
  expect(bodyMetrics.scrollHeight).toBeGreaterThan(bodyMetrics.clientHeight);

  const actionsOffsetBeforeScroll = await actions.evaluate((element) => {
    const popup = element.closest(".seichi-map-popup");
    if (!popup) throw new Error("Popup container was not found");
    return (
      element.getBoundingClientRect().top - popup.getBoundingClientRect().top
    );
  });

  await body.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  const actionsOffsetAfterScroll = await actions.evaluate((element) => {
    const popup = element.closest(".seichi-map-popup");
    if (!popup) throw new Error("Popup container was not found");
    return (
      element.getBoundingClientRect().top - popup.getBoundingClientRect().top
    );
  });
  expect(actionsOffsetAfterScroll).toBeCloseTo(actionsOffsetBeforeScroll, 0);

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  for (const control of await controls.all()) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect(box?.y).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
      viewport?.width ?? 0,
    );
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
      viewport?.height ?? 0,
    );
  }

  await expect(
    actions.getByRole("link", { name: "Google Maps" }),
  ).toHaveAttribute("href", /google\.com\/maps\/search/);
  await expect(actions.getByRole("link", { name: /#どこAZ/ })).toBeVisible();
  await expect(
    actions.getByRole("button", { name: /訪問を記録|Record visit/ }),
  ).toBeVisible();

  return popup;
};

test.describe("Seichi map location popup", () => {
  test("shows the number of users with at least one recorded location", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSeichiMapPopupMocks(page);
    await page.goto("/seichi-map");

    const badge = page.getByText(/12人が利用中|12 people using the map/);
    const ranking = page.getByRole("link", { name: /ランキング|Rankings/ });
    const share = page.getByRole("button", { name: /共有|Share/ });
    const settings = page.getByRole("button", { name: /設定|Settings/ });

    await expect(badge).toBeVisible();
    await expect(ranking).toContainText(/ランキング|Rankings/);
    await expect(share).toHaveText("");
    await expect(settings).toHaveText("");

    const [badgeBox, rankingBox, shareBox, settingsBox] = await Promise.all([
      badge.boundingBox(),
      ranking.boundingBox(),
      share.boundingBox(),
      settings.boundingBox(),
    ]);
    expect(badgeBox).not.toBeNull();
    expect(rankingBox).not.toBeNull();
    expect(shareBox).not.toBeNull();
    expect(settingsBox).not.toBeNull();
    expect(badgeBox!.x).toBeLessThan(rankingBox!.x);
    expect(rankingBox!.x).toBeLessThan(shareBox!.x);
    expect(shareBox!.x).toBeLessThan(settingsBox!.x);
  });

  for (const { name, viewport } of [
    { name: "small portrait", viewport: { width: 320, height: 568 } },
    { name: "small landscape", viewport: { width: 568, height: 320 } },
  ]) {
    test(`keeps every action accessible on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const popup = await assertFixedPopupActions(page);
      const mapSurface = page
        .locator(".seichi-map-fullscreen-surface:visible")
        .first();
      const popupBox = await popup.boundingBox();
      const mapBox = await mapSurface.boundingBox();

      expect(popupBox).not.toBeNull();
      expect(mapBox).not.toBeNull();
      expect(mapBox?.height).toBeLessThanOrEqual(viewport.height);
      expect((mapBox?.y ?? 0) + (mapBox?.height ?? 0)).toBeLessThanOrEqual(
        viewport.height + 2,
      );
      expect(popupBox?.width).toBeLessThanOrEqual(
        Math.min(350, viewport.width - 64) + 1,
      );
      expect(popupBox?.height).toBeLessThanOrEqual(
        Math.min(420, viewport.height - 160) + 1,
      );
    });
  }

  test("preserves the desktop popup width and actions", async ({ page }) => {
    const viewport = { width: 1280, height: 720 };
    await page.setViewportSize(viewport);
    const popup = await assertFixedPopupActions(page);
    const popupBox = await popup.boundingBox();

    expect(popupBox).not.toBeNull();
    expect(popupBox?.width).toBeGreaterThanOrEqual(280);
    expect(popupBox?.width).toBeLessThanOrEqual(351);
    expect(popupBox?.height).toBeLessThanOrEqual(421);
    await expect(page.locator(".seichi-map-list-actions")).toBeHidden();
  });

  test("expands actions for only the tapped location on a smartphone", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await setupSeichiMapPopupMocks(page);
    await page.goto("/seichi-map");

    await page.getByText("低解像度端末で確認する地点", { exact: true }).click();

    const listActions = page.locator(".seichi-map-list-actions");
    await expect(listActions).toHaveCount(1);
    await expect(listActions).toBeVisible();
    await expect(listActions.locator("a, button")).toHaveCount(3);
    await expect(
      listActions.getByRole("link", { name: "Google Maps" }),
    ).toHaveAttribute("href", /google\.com\/maps\/search/);
    await expect(
      listActions.getByRole("link", { name: /#どこAZ/ }),
    ).toBeVisible();
    await expect(
      listActions.getByRole("button", { name: /訪問を記録|Record visit/ }),
    ).toBeVisible();

    await page.getByText("2回目に選択する地点", { exact: true }).click();

    await expect(listActions).toHaveCount(1);
    await expect(listActions).toBeVisible();
    await expect(
      listActions.getByRole("link", { name: "Google Maps" }),
    ).toHaveAttribute(
      "href",
      new RegExp(`${SECOND_LOCATION_LATITUDE}%2C${SECOND_LOCATION_LONGITUDE}`),
    );
    await expect(
      page
        .locator(".seichi-map-popup")
        .filter({ hasText: "2回目に選択する地点" }),
    ).toBeVisible();
  });

  test("keeps a seichi pin clickable above the current-location marker", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({
      latitude: LOCATION_LATITUDE,
      longitude: LOCATION_LONGITUDE,
    });
    await setupSeichiMapPopupMocks(page);
    await page.goto("/seichi-map");

    const mapSurface = page.locator(".seichi-map-fullscreen-surface");
    await expect(mapSurface).toBeVisible({ timeout: 15_000 });
    await mapSurface.scrollIntoViewIfNeeded();
    await page
      .getByRole("button", { name: /現在地を表示|Show current location/ })
      .click();

    const currentLocationPane = page.locator(
      ".leaflet-seichi-current-location-pane",
    );
    await expect(currentLocationPane.locator("path")).toBeVisible();
    const paneZIndexes = await page.evaluate(() => ({
      currentLocation: Number.parseInt(
        getComputedStyle(
          document.querySelector<HTMLElement>(
            ".leaflet-seichi-current-location-pane",
          )!,
        ).zIndex,
        10,
      ),
      seichi: Number.parseInt(
        getComputedStyle(
          document.querySelector<HTMLElement>(".leaflet-overlay-pane")!,
        ).zIndex,
        10,
      ),
    }));
    expect(paneZIndexes.currentLocation).toBeLessThan(paneZIndexes.seichi);

    const mapBox = await mapSurface.boundingBox();
    expect(mapBox).not.toBeNull();
    await page.mouse.click(
      (mapBox?.x ?? 0) + (mapBox?.width ?? 0) / 2,
      (mapBox?.y ?? 0) + (mapBox?.height ?? 0) / 2,
    );

    await expect(page.locator(".seichi-map-popup")).toBeVisible();
    await expect(
      page.locator(".seichi-map-popup").getByText("低解像度端末で確認する地点"),
    ).toBeVisible();
  });

  test.describe("on iOS", () => {
    test.use({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    });

    test("hides the Leaflet fullscreen control", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await setupSeichiMapPopupMocks(page);
      await page.goto(`/seichi-map?location=${LOCATION_ID}`);

      await expect(page.locator(".leaflet-container")).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        page.getByRole("button", { name: /全画面表示|Enter fullscreen/ }),
      ).toHaveCount(0);
    });
  });
});
