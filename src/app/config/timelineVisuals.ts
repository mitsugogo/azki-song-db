export type VisualChange = {
  label: string;
  from: string; // YYYY-MM-DD
  to: string | null;
  color?: string;
};

export const VISUAL_CHANGES: VisualChange[] = [
  { label: "1st衣装", from: "2018-11-15", to: "2019-05-25", color: "#7c3aed" },
  { label: "2nd衣装", from: "2019-05-26", to: "2021-02-22", color: "#06b6d4" },
  { label: "3rd衣装", from: "2021-02-23", to: "2022-11-14", color: "#f97316" },
  { label: "4th衣装", from: "2022-11-15", to: null, color: "#ef4444" },
];

export default VISUAL_CHANGES;

// release (album_release_at) の文字列を受け取り、JST基準で該当する衣装を返すユーティリティ
export function findVisualForRelease(
  release?: string | null,
): VisualChange | null {
  if (!release) return null;
  const s = String(release);

  const toYMD = (dstr: string): string | null => {
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
    VISUAL_CHANGES.find((v) => {
      const from = ymdToNumber(v.from);
      const to = v.to ? ymdToNumber(v.to) : null;
      return from !== null && from <= target && (to === null || target <= to);
    }) || null
  );
}
