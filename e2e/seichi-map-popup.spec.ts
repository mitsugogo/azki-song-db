import { expect, test, type Page } from "@playwright/test";

const LOCATION_ID = "aaaaaaaaaaaaaaaa";
const VIDEO_ID = "e2ePopup01A";

const setupSeichiMapPopupMocks = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("azki-seichi-map:provider", "osm");
  });

  await page.route("**/api/seichi-map/locations", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
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
          latitude: 35.681236,
          longitude: 139.767125,
          uniqueVisitorCount: 3,
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
