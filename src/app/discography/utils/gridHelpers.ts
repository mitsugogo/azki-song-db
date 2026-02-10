/**
 * グリッドの列数を取得する関数
 */
export function getGridCols(): number {
  if (typeof window === "undefined") return 4;
  if (window.innerWidth >= 1280) return 4; // xl:grid-cols-4
  if (window.innerWidth >= 768) return 3; // md:grid-cols-3
  return 2; // grid-cols-2
}
