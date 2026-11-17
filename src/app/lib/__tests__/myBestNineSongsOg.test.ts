import { describe, expect, it } from "vitest";
import { getBestNineOgLayout } from "../myBestNineSongsOg";

describe("好きな曲のOGレイアウト", () => {
  it.each([
    { count: 1, rows: [1] },
    { count: 2, rows: [2] },
    { count: 3, rows: [3] },
    { count: 4, rows: [2, 2] },
    { count: 5, rows: [3, 2] },
    { count: 6, rows: [3, 3] },
    { count: 7, rows: [4, 3] },
    { count: 8, rows: [4, 4] },
    { count: 9, rows: [5, 4] },
  ])("$count 曲の各段が画像内に収まる", ({ count, rows }) => {
    for (const withThemes of [false, true]) {
      const layout = getBestNineOgLayout(count, withThemes);
      expect(layout.rows).toEqual(rows);
      expect(layout.thumbnailWidth / layout.thumbnailHeight).toBe(16 / 9);
      expect(layout.thumbnailWidth).toBeGreaterThan(0);
      for (const columns of rows) {
        expect(
          layout.cardWidth * columns + layout.gap * (columns - 1),
        ).toBeLessThanOrEqual(layout.contentWidth);
      }
      const cardHeight = layout.horizontal
        ? Math.max(layout.thumbnailHeight, layout.textHeight)
        : layout.thumbnailHeight + 10 + layout.textHeight;
      expect(
        cardHeight + (withThemes ? layout.themeHeight + 6 : 0),
      ).toBeLessThanOrEqual(layout.rowHeight);
      expect(
        layout.rows.length * layout.rowHeight + (rows.length - 1) * layout.gap,
      ).toBe(layout.contentHeight);
    }
  });
});
