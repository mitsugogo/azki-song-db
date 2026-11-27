/** 地図と一覧に出す地点を、訪問状況で絞り込む */
export type SeichiMapVisitFilter = "all" | "unvisited" | "visited";

export const SEICHI_MAP_VISIT_FILTER_STORAGE_KEY =
  "azki-seichi-map:visit-filter";

export const isSeichiMapVisitFilter = (
  value: unknown,
): value is SeichiMapVisitFilter =>
  value === "all" || value === "unvisited" || value === "visited";

export function filterSeichiMapLocationsByVisit<T>(
  locations: readonly T[],
  isVisited: (location: T) => boolean,
  filter: SeichiMapVisitFilter,
): T[] {
  if (filter === "all") return [...locations];
  const wantVisited = filter === "visited";
  return locations.filter((location) => isVisited(location) === wantVisited);
}

/** 指定した ID の地点だけに絞る（バッジの対象地点で絞り込むときに使う） */
export function filterSeichiMapLocationsByIds<T extends { id: string }>(
  locations: readonly T[],
  ids: ReadonlySet<string>,
): T[] {
  return locations.filter((location) => ids.has(location.id));
}

export function readSeichiMapVisitFilter(
  storage: Pick<Storage, "getItem"> | null | undefined,
): SeichiMapVisitFilter {
  try {
    const value = storage?.getItem(SEICHI_MAP_VISIT_FILTER_STORAGE_KEY);
    return isSeichiMapVisitFilter(value) ? value : "all";
  } catch {
    // localStorage may be unavailable in private browsing contexts.
    return "all";
  }
}

export function saveSeichiMapVisitFilter(
  storage: Pick<Storage, "setItem"> | null | undefined,
  filter: SeichiMapVisitFilter,
) {
  try {
    storage?.setItem(SEICHI_MAP_VISIT_FILTER_STORAGE_KEY, filter);
  } catch {
    // localStorage may be unavailable in private browsing contexts.
  }
}
