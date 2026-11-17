/** 1〜9曲を横長の大画像カードに収める共有画像。 */
export const bestNineOgSize = { width: 1200, height: 630 } as const;

const rowCounts = [
  [1],
  [2],
  [3],
  [2, 2],
  [3, 2],
  [3, 3],
  [4, 3],
  [4, 4],
  [5, 4],
];

/** 各段のカード幅を揃え、端数の段は中央に寄せる。サムネイルは常に16:9。 */
export function getBestNineOgLayout(count: number, withThemes = false) {
  const total = Math.max(1, Math.min(9, Math.trunc(count)));
  const rows = rowCounts[total - 1];
  const gap = 16;
  const contentWidth = 1096;
  const contentHeight = 440;
  const columns = Math.max(...rows);
  const cardWidth = (contentWidth - (columns - 1) * gap) / columns;
  const rowHeight = (contentHeight - (rows.length - 1) * gap) / rows.length;
  const horizontal = total === 1 || total === 4;
  const titleFontSize =
    total === 1
      ? 42
      : total === 2
        ? 30
        : total === 3
          ? 26
          : total === 4
            ? 26
            : total <= 8
              ? 22
              : 20;
  const artistFontSize =
    total === 1
      ? 26
      : total === 2
        ? 22
        : total === 3
          ? 20
          : total <= 6
            ? 18
            : 16;
  const titleLines = total === 1 ? 3 : 2;
  const artistLines = total >= 5 && total <= 8 ? 1 : 2;
  const textHeight =
    Math.ceil(titleFontSize * 1.2 * titleLines) +
    Math.ceil(artistFontSize * 1.2 * artistLines) +
    6;
  const themeHeight = withThemes ? 36 : 0;
  const preferredWidth =
    total === 1
      ? 448
      : total === 2
        ? 400
        : total === 3
          ? 304
          : total <= 6
            ? 208
            : total <= 8
              ? 192
              : 176;
  const imageHeightBudget =
    rowHeight -
    themeHeight -
    (withThemes ? 6 : 0) -
    (horizontal ? 0 : textHeight + 10);
  const thumbnailWidth =
    Math.floor(
      Math.min(preferredWidth, cardWidth - 24, (imageHeightBudget * 16) / 9) /
        16,
    ) * 16;
  return {
    rows,
    gap,
    contentWidth,
    contentHeight,
    cardWidth,
    rowHeight,
    horizontal,
    titleFontSize,
    artistFontSize,
    titleLines,
    artistLines,
    textHeight,
    themeHeight,
    thumbnailWidth,
    thumbnailHeight: (thumbnailWidth * 9) / 16,
  };
}

// 既存の画像URLの寸法指定も受け付け、構成全体を収める。
export const getBestNineOgSize = (params: URLSearchParams) => {
  const dimension = (value: string | null, fallback: number) => {
    const parsed = value === null ? fallback : Number(value);
    return Number.isInteger(parsed) && parsed >= 300 && parsed <= 2400
      ? parsed
      : fallback;
  };
  return {
    width: dimension(params.get("w"), bestNineOgSize.width),
    height: dimension(params.get("h"), bestNineOgSize.height),
  };
};
