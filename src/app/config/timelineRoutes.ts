export type RouteConfig = {
  label: string;
  from: string;
  to: string | null;
};

export const ROUTE_RANGES: RouteConfig[] = [
  { label: "ルートα", from: "2018-11-15", to: "2021-04-10" },
  { label: "ルートβ", from: "2021-04-11", to: "2023-06-30" },
  { label: "ルートγ", from: "2023-07-01", to: "2025-06-30" },
  { label: "新たなルート", from: "2025-07-01", to: null },
];

export default ROUTE_RANGES;

// Release (album_release_at) の文字列を受け取り、JST基準で該当するルートを返すユーティリティ
export function findRouteForRelease(
  release?: string | null,
): RouteConfig | null {
  if (!release) return null;

  const s = String(release);

  // 日付文字列を JST に解決して YYYY-MM-DD を作成する
  const toYMD = (dstr: string): string | null => {
    // 時刻・タイムゾーン情報を含む場合は UTC としてパースし、JST(+9h) に変換して日付を決定する
    const hasTime = /T|\d{2}:\d{2}:\d{2}|Z|[+-]\d{2}:?\d{2}/.test(dstr);
    if (hasTime) {
      const dt = new Date(dstr);
      if (isNaN(dt.getTime())) return null;
      const jst = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
      const y = jst.getFullYear();
      const mo = String(jst.getMonth() + 1).padStart(2, "0");
      const da = String(jst.getDate()).padStart(2, "0");
      return `${y}-${mo}-${da}`;
    }

    // 日付部分を直接抽出（YYYY-MM-DD / YYYY/MM/DD）
    const m = dstr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (m) {
      const y = m[1];
      const mo = String(Number(m[2])).padStart(2, "0");
      const da = String(Number(m[3])).padStart(2, "0");
      return `${y}-${mo}-${da}`;
    }

    const dt = new Date(dstr);
    if (isNaN(dt.getTime())) return null;
    const y = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, "0");
    const da = String(dt.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  };

  const ymdToNumber = (ymd?: string | null) =>
    ymd ? Number(ymd.replace(/-/g, "")) : null;

  const ymd = toYMD(s);
  const target = ymdToNumber(ymd);
  if (!target) return null;

  return (
    ROUTE_RANGES.find((r) => {
      const from = ymdToNumber(r.from);
      const to = r.to ? ymdToNumber(r.to) : null;
      return from !== null && from <= target && (to === null || target <= to);
    }) || null
  );
}
