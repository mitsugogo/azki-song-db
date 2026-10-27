import { expect, test } from "@playwright/test";
import { setupApiMocks } from "./mocks";

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL });

test("opens AZKi and Else's sourced history without a formation anniversary", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await setupApiMocks(page);
  await page.route("**/api/archives**", (route) => route.fulfill({ json: [] }));

  await page.goto("/units", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("link", { name: "エルあずのユニットヒストリーを見る" })
    .click();
  await expect(page).toHaveURL(/\/units\/azki-else$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "エルあず" }),
  ).toBeVisible();
  const history = page.locator('section[aria-labelledby="unit-history-title"]');
  await expect(
    history.getByRole("heading", {
      name: "深海フェス2026「超・深海」で「mirror」を再びデュエット",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await history.getByRole("heading", { level: 4 }).count(),
  ).toBeGreaterThanOrEqual(20);
  await expect(
    history.locator(
      'a[href="https://hololive.hololivepro.com/events/last-v-standing-vol-2/"]',
    ),
  ).toBeVisible();
  await expect(
    history.locator(
      'a[href="https://x.com/AZKi_VDiVA/status/2111769333496176927"]',
    ),
  ).toBeVisible();
  await expect(page.locator("[data-unit-hero-frame]")).toContainText(
    "2018年10月にエルセ、11月にAZKiがデビュー",
  );
  await expect(page.locator("[data-unit-hero-frame]")).not.toContainText(
    "周年おめでとう",
  );
  await expect(page.locator("[data-unit-hero-frame]")).not.toContainText(
    "Anniversary",
  );

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(
    page.getByRole("heading", { level: 1, name: "エルあず" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.screenshot({
    path: test.info().outputPath("azki-else-mobile.png"),
  });

  await page.goto("/en/units/azki-else", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { level: 1, name: "El-Azu" }),
  ).toBeVisible();
  await expect(page.locator("[data-unit-hero-frame]")).toContainText(
    "Else debuted in October 2018 and AZKi followed in November",
  );
  await expect(page.locator("[data-unit-hero-frame]")).not.toContainText(
    "Anniversary",
  );
  expect(pageErrors).toEqual([]);
});
