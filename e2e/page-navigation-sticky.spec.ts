import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test("page navigation keeps nested table headers at their own viewport top", async ({
  page,
}) => {
  // 共通CSSだけを再現ケースへ読み込み、実データや開発サーバーなしで固定位置を確認する。
  const navigationCss = readFileSync(
    resolve(__dirname, "../src/app/components/PageNavigationLayout.module.css"),
    "utf8",
  ).replace(/:global\(([^)]+)\)/g, "$1");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.setContent(`
    <style>
      @layer utilities {
        .sticky { position: sticky; }
        .top-0 { top: 0; }
      }
      body { margin: 0; --navigation-header-height: 64px; }
      #site-header { height: 64px; }
      .windowContent { padding: 24px; }
      #table-viewport { height: 220px; overflow: auto; }
      #table-header { height: 36px; background: white; }
      #table-rows { height: 1200px; }
      #archive-controls { height: 40px; margin-top: 40px; }
      #archive-rows { height: 1200px; }
      ${navigationCss}
    </style>
    <header id="site-header" class="sticky top-0">Site header</header>
    <main class="windowContent">
      <div id="table-viewport">
        <div id="table-header" class="sticky top-0">Table header</div>
        <div id="table-rows">Rows</div>
      </div>
      <div id="archive-controls" class="sticky top-0"
        style="top: var(--navigation-header-height)">Archive controls</div>
      <div id="archive-rows">Archives</div>
    </main>
  `);

  const tableHeaderOffset = () =>
    page.locator("#table-header").evaluate((header) => {
      const viewport = header.parentElement!;
      return Math.round(
        header.getBoundingClientRect().top -
          viewport.getBoundingClientRect().top,
      );
    });

  await expect.poll(tableHeaderOffset).toBe(0);
  await page.locator("#table-viewport").evaluate((viewport) => {
    viewport.scrollTop = 160;
  });
  await expect.poll(tableHeaderOffset).toBe(0);

  // ウィンドウに固定する要素は、明示されたサイトヘッダーの高さを維持する。
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect
    .poll(() =>
      page
        .locator("#archive-controls")
        .evaluate((controls) =>
          Math.round(controls.getBoundingClientRect().top),
        ),
    )
    .toBe(64);
});
