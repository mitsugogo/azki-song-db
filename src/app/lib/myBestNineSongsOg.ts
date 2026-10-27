/** 横長の大画像カード内に9枠を収める共有画像。 */
export const bestNineOgSize = { width: 1200, height: 630 } as const;

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
