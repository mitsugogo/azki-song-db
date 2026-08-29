import { expect, test, type Page } from "@playwright/test";

const LOCATION_ID = "aaaaaaaaaaaaaaaa";
const VIDEO_ID = "e2ePopup01A";
const LOCATION_LATITUDE = 35.681236;
const LOCATION_LONGITUDE = 139.767125;
const SECOND_LOCATION_LATITUDE = 34.693725;
const SECOND_LOCATION_LONGITUDE = 135.502254;
const SHARE_ID = "11111111-1111-4111-8111-111111111111";

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
          uniqueVisitorCount: 1,
          singleVisitorNickname: "開拓者A",
        },
        {
          id: "bbbbbbbbbbbbbbbb",
          folder: "E2E レイヤー",
          name: "2回目に選択する地点",
          description: "別の聖地を選択した後も操作欄を表示する地点",
          styleUrl: "#icon-1899-DB4436",
          latitude: SECOND_LOCATION_LATITUDE,
          longitude: SECOND_LOCATION_LONGITUDE,
          uniqueVisitorCount: 1,
          singleVisitorNickname: null,
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
  await expect(controls).toHaveCount(4);

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
  const itineraryAction = actions.getByRole("button", {
    name: /旅程に追加|Add to itinerary/,
  });
  const recordAction = actions.getByRole("button", {
    name: /訪問を記録|Record visit/,
  });
  await expect(itineraryAction).toBeVisible();
  await expect(itineraryAction).toHaveAttribute("data-variant", "light");
  await expect(itineraryAction).toHaveAttribute("data-color", "cyan");
  await expect(recordAction).toBeVisible();
  await expect(recordAction).toHaveAttribute("data-variant", "filled");

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

  test("switches the point layer and shows a public single visitor", async ({
    page,
  }) => {
    const popup = await openLongLocationPopup(page);
    const mapSurface = page.locator(".seichi-map-fullscreen-surface").first();

    await expect(popup.locator(".seichi-map-popup__single-visitor")).toHaveText(
      "開拓者A",
    );
    await expect(
      popup.locator(".seichi-map-popup__single-visitor"),
    ).toHaveAttribute("aria-label", "訪問者: 開拓者A");
    await expect(
      popup.locator(".seichi-map-popup__single-visitor svg"),
    ).toHaveCount(1);
    await expect(mapSurface).toHaveAttribute("data-point-layer", "self");

    await page
      .getByRole("button", {
        name: /地図レイヤーを開く|Open map layers/,
      })
      .click();
    const selfLayer = page.getByRole("radio", { name: /自分|Mine/ });
    const everyoneLayer = page.getByRole("radio", {
      name: /みんな|Everyone/,
    });
    await expect(page.getByText(/地点レイヤー|Location layer/)).toBeVisible();
    await expect(selfLayer).toBeChecked();
    await expect(everyoneLayer).not.toBeChecked();
    const legend = page.getByLabel(/凡例|Legend/);
    await expect(legend).toContainText(/未訪問|Unvisited/);
    await expect(legend).toContainText(/訪問済|Visited/);

    await everyoneLayer.check();
    await expect(mapSurface).toHaveAttribute("data-point-layer", "everyone");
    await expect(legend).toContainText(/0人|0 people/);
    await expect(legend).toContainText(/1人|1 person/);
    await expect(legend).toContainText(/2人以上|2\+ people/);

    await page.route("**/api/seichi-map/share?shareId=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          share: {
            shareId: SHARE_ID,
            nickname: "共有ユーザー",
            createdAt: "2026-08-29T00:00:00.000Z",
            updatedAt: "2026-08-29T00:00:00.000Z",
          },
          items: [],
        }),
      });
    });
    await page.evaluate((shareId) => {
      const url = new URL(window.location.href);
      url.searchParams.set("share", shareId);
      window.history.pushState(window.history.state, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, SHARE_ID);

    await expect(mapSurface).toHaveAttribute("data-point-layer", "self");
    await expect(selfLayer).toHaveCount(0);
    await expect(everyoneLayer).toHaveCount(0);
  });

  test("keeps the anonymous single-visitor count", async ({ page }) => {
    await setupSeichiMapPopupMocks(page);
    await page.goto("/seichi-map?location=bbbbbbbbbbbbbbbb");

    const popup = page.locator(".seichi-map-popup");
    await expect(popup).toBeVisible({ timeout: 15_000 });
    await expect(popup.locator(".seichi-map-popup__visitor-count")).toHaveText(
      "1人が訪問済",
    );
    await expect(
      popup.locator(".seichi-map-popup__single-visitor"),
    ).toHaveCount(0);
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
    await expect(
      page.locator(".seichi-map-fullscreen-surface:visible").first(),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByText("低解像度端末で確認する地点", { exact: true }).click();

    const listActions = page.locator(".seichi-map-list-actions");
    await expect(listActions).toHaveCount(1);
    await expect(listActions).toBeVisible();
    await expect(listActions.locator("a, button")).toHaveCount(4);
    await expect(
      listActions.getByRole("link", { name: "Google Maps" }),
    ).toHaveAttribute("href", /google\.com\/maps\/search/);
    await expect(
      listActions.getByRole("link", { name: /#どこAZ/ }),
    ).toBeVisible();
    await expect(
      listActions.getByRole("button", {
        name: /旅程に追加|Add to itinerary/,
      }),
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

  test("builds and restores a local itinerary from a map popup", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    let popup = await openLongLocationPopup(page);

    await page.getByRole("button", { name: /^旅程$|^Itinerary$/ }).click();
    await expect(
      page.getByText(
        "訪問予定の聖地リストをあらかじめピックアップしておくことができます。端末内に保存されるため、訪問時に利用するスマートフォンなどで設定してください。",
      ),
    ).toBeVisible();
    await page.getByText("聖地リスト", { exact: true }).click();
    await page.getByText("低解像度端末で確認する地点", { exact: true }).click();
    popup = page.locator(".seichi-map-popup");
    await expect(popup).toBeVisible();
    await popup
      .getByRole("button", { name: /旅程に追加|Add to itinerary/ })
      .click();

    await expect(
      page.getByRole("textbox", { name: /出発地点|Starting point/ }),
    ).toHaveCount(0);
    await page
      .getByRole("checkbox", {
        name: /低解像度端末で確認する地点.*訪問済み|Mark .* as visited/,
      })
      .check();
    await expect(
      page
        .getByRole("button", {
          name: /低解像度端末で確認する地点.*地図で表示|Show .* on the map/,
        })
        .getByText(/^訪問済$|^Visited$/),
    ).toBeVisible();

    const routeLink = page.getByRole("link", {
      name: /Google Mapsで経路を開く|Open route in Google Maps/,
    });
    await expect(routeLink).toHaveAttribute("href", /google\.com\/maps\/dir/);
    const routeHref = await routeLink.getAttribute("href");
    expect(new URL(routeHref ?? "").searchParams.has("origin")).toBe(false);
    const routeLabelMetrics = await routeLink
      .locator(".mantine-Button-label")
      .evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
    expect(routeLabelMetrics.scrollWidth).toBeLessThanOrEqual(
      routeLabelMetrics.clientWidth,
    );
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem("azki-seichi-map:itinerary:v1"),
        ),
      )
      .toContain('"completed":true');
    expect(
      await page.evaluate(() =>
        window.localStorage.getItem("azki-seichi-map:itinerary:v1"),
      ),
    ).not.toContain('"startLocation"');

    await page.reload();
    const itineraryTab = page.getByRole("button", {
      name: /^旅程$|^Itinerary$/,
    });
    await expect(itineraryTab).toBeVisible({ timeout: 15_000 });
    await itineraryTab.click();

    await expect(
      page.getByRole("checkbox", {
        name: /低解像度端末で確認する地点.*訪問済み|Mark .* as visited/,
      }),
    ).toBeChecked({ timeout: 15_000 });
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

    const mapSurface = page
      .locator(".seichi-map-fullscreen-surface:visible")
      .first();
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

    for (const { name, viewport } of [
      { name: "portrait", viewport: { width: 320, height: 568 } },
      { name: "landscape", viewport: { width: 568, height: 320 } },
    ]) {
      test(`uses viewport fullscreen in ${name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await setupSeichiMapPopupMocks(page);
        await page.goto(`/seichi-map?location=${LOCATION_ID}`);

        const mapSurface = page.locator(".seichi-map-fullscreen-surface");
        const popup = page.locator(".seichi-map-popup");
        await expect(page.locator(".leaflet-container")).toBeVisible({
          timeout: 15_000,
        });
        await mapSurface.scrollIntoViewIfNeeded();
        await expect(popup).toBeVisible();

        const enterFullscreen = page.getByRole("button", {
          name: /地図を全画面表示|View map fullscreen/,
        });
        await expect(enterFullscreen).toBeVisible();
        await enterFullscreen.click();

        await expect(mapSurface).toHaveAttribute(
          "data-viewport-fullscreen",
          "true",
        );
        await expect(page.locator("html")).toHaveClass(
          /seichi-map-viewport-fullscreen-open/,
        );
        await expect(page.locator("body")).toHaveClass(
          /seichi-map-viewport-fullscreen-open/,
        );
        await expect(
          page.getByRole("button", {
            name: /全画面表示を終了|Exit fullscreen/,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", {
            name: /地図レイヤーを開く|Open map layers/,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", {
            name: /現在地を表示|Show current location/,
          }),
        ).toBeVisible();
        await expect(popup.locator(".seichi-map-popup__actions")).toBeVisible();

        const fullscreenBox = await mapSurface.boundingBox();
        expect(fullscreenBox).not.toBeNull();
        expect(fullscreenBox?.x).toBeCloseTo(0, 0);
        expect(fullscreenBox?.y).toBeCloseTo(0, 0);
        expect(fullscreenBox?.width).toBeCloseTo(viewport.width, 0);
        expect(fullscreenBox?.height).toBeCloseTo(viewport.height, 0);

        await page
          .getByRole("button", {
            name: /全画面表示を終了|Exit fullscreen/,
          })
          .click();

        await expect(mapSurface).not.toHaveAttribute(
          "data-viewport-fullscreen",
          "true",
        );
        await expect(page.locator("html")).not.toHaveClass(
          /seichi-map-viewport-fullscreen-open/,
        );
        await expect(page.locator("body")).not.toHaveClass(
          /seichi-map-viewport-fullscreen-open/,
        );
        await expect(
          popup.getByText("低解像度端末で確認する地点"),
        ).toBeVisible();
      });
    }
  });
});
