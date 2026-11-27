import { describe, expect, it } from "vitest";
import {
  filterSeichiMapLocationsByIds,
  filterSeichiMapLocationsByVisit,
  isSeichiMapVisitFilter,
  readSeichiMapVisitFilter,
  saveSeichiMapVisitFilter,
  SEICHI_MAP_VISIT_FILTER_STORAGE_KEY,
} from "../visitFilter";

const locations = [
  { id: "a", visited: true },
  { id: "b", visited: false },
  { id: "c", visited: true },
  { id: "d", visited: false },
];
const isVisited = (location: { visited: boolean }) => location.visited;

describe("seichi map visit filter", () => {
  it("すべて: そのまま返す（元の配列は変えない）", () => {
    const result = filterSeichiMapLocationsByVisit(locations, isVisited, "all");
    expect(result).toEqual(locations);
    expect(result).not.toBe(locations);
  });

  it("未訪問: 訪問していない地点だけを返す", () => {
    expect(
      filterSeichiMapLocationsByVisit(locations, isVisited, "unvisited").map(
        ({ id }) => id,
      ),
    ).toEqual(["b", "d"]);
  });

  it("訪問済: 訪問した地点だけを返す", () => {
    expect(
      filterSeichiMapLocationsByVisit(locations, isVisited, "visited").map(
        ({ id }) => id,
      ),
    ).toEqual(["a", "c"]);
  });

  it("値の検証", () => {
    expect(isSeichiMapVisitFilter("unvisited")).toBe(true);
    expect(isSeichiMapVisitFilter("done")).toBe(false);
    expect(isSeichiMapVisitFilter(null)).toBe(false);
  });

  it("保存した値を読み戻し、不正な値や読み出しの失敗は all にする", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    };

    expect(readSeichiMapVisitFilter(storage)).toBe("all");
    saveSeichiMapVisitFilter(storage, "unvisited");
    expect(store.get(SEICHI_MAP_VISIT_FILTER_STORAGE_KEY)).toBe("unvisited");
    expect(readSeichiMapVisitFilter(storage)).toBe("unvisited");

    store.set(SEICHI_MAP_VISIT_FILTER_STORAGE_KEY, "broken");
    expect(readSeichiMapVisitFilter(storage)).toBe("all");

    expect(
      readSeichiMapVisitFilter({
        getItem: () => {
          throw new Error("denied");
        },
      }),
    ).toBe("all");
    expect(() =>
      saveSeichiMapVisitFilter(
        {
          setItem: () => {
            throw new Error("denied");
          },
        },
        "visited",
      ),
    ).not.toThrow();
    expect(readSeichiMapVisitFilter(null)).toBe("all");
  });

  it("ID の集合に含まれる地点だけを、元の並びのまま返す", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(
      filterSeichiMapLocationsByIds(items, new Set(["c", "a", "x"])),
    ).toEqual([{ id: "a" }, { id: "c" }]);
    expect(filterSeichiMapLocationsByIds(items, new Set())).toEqual([]);
  });
});
