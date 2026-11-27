/** ボトムシートの高さの段階。peek は つまみとタブだけが見える状態 */
export type SeichiMapSheetSnap = "peek" | "half" | "full";

const SNAP_ORDER: readonly SeichiMapSheetSnap[] = ["peek", "half", "full"];

/** ドラッグとみなす最小の移動量（px）。これ未満はタップ扱い */
export const SEICHI_MAP_SHEET_DRAG_THRESHOLD = 40;

/** タップで peek → half → full → peek と循環させる */
export const cycleSeichiMapSheetSnap = (
  snap: SeichiMapSheetSnap,
): SeichiMapSheetSnap =>
  SNAP_ORDER[(SNAP_ORDER.indexOf(snap) + 1) % SNAP_ORDER.length];

/** 上向きのドラッグ（deltaY が負）で1段階開き、下向きで1段階閉じる。範囲外には出ない */
export const getSeichiMapSheetSnapAfterDrag = (
  snap: SeichiMapSheetSnap,
  deltaY: number,
  threshold = SEICHI_MAP_SHEET_DRAG_THRESHOLD,
): SeichiMapSheetSnap => {
  if (Math.abs(deltaY) < threshold) return snap;
  const index = SNAP_ORDER.indexOf(snap);
  const nextIndex = Math.min(
    SNAP_ORDER.length - 1,
    Math.max(0, index + (deltaY < 0 ? 1 : -1)),
  );
  return SNAP_ORDER[nextIndex];
};
