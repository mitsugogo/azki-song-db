import { describe, expect, it } from "vitest";
import type { LivePerformance, LiveSetlistEntry } from "@/app/types/live";
import {
  buildLiveComparisonRows,
  countLiveSongsByPerformance,
} from "../liveComparison";

const entry = (order: string, title: string): LiveSetlistEntry => ({
  order,
  title,
  artist: "AZKi",
  singers: "",
  note: "",
});

const performance = (setlist: LiveSetlistEntry[]) =>
  ({ setlist }) as LivePerformance;

describe("live setlist comparison", () => {
  it("追加曲を空欄で揃え、以降の曲順表記と行の対応を保つ", () => {
    const rows = buildLiveComparisonRows([
      performance([entry("01", "A"), entry("02a", "B"), entry("EN", "C")]),
      performance([
        entry("01", "A"),
        entry("01-1", "X"),
        entry("02a", "B"),
        entry("EN", "C"),
      ]),
    ]);

    expect(
      rows.map((row) => row.entries.map((item) => item?.title ?? null)),
    ).toEqual([
      ["A", "A"],
      [null, "X"],
      ["B", "B"],
      ["C", "C"],
    ]);
    expect(rows.map((row) => row.kind)).toEqual([
      "same",
      "addition",
      "same",
      "same",
    ]);
    expect(rows[1].entries[1]?.order).toBe("01-1");
    expect(rows[2].entries[0]?.order).toBe("02a");
    expect(rows[3].entries[0]?.order).toBe("EN");
  });

  it("同じ位置の別曲を区別し、空のセットリストにも対応する", () => {
    const rows = buildLiveComparisonRows([
      performance([]),
      performance([entry("01", "A"), entry("02", "B")]),
      performance([entry("01", "A"), entry("02", "C")]),
    ]);
    expect(rows.map((row) => row.kind)).toEqual(["addition", "variant"]);
    expect(rows[1].entries.map((item) => item?.title ?? null)).toEqual([
      null,
      "B",
      "C",
    ]);
    expect(buildLiveComparisonRows([])).toEqual([]);
  });

  it("同じ公演で同じ曲が複数回あっても演奏公演数は一度だけ数える", () => {
    expect(
      countLiveSongsByPerformance([
        performance([entry("01", "A"), entry("EN", "A"), entry("02", "B")]),
        performance([entry("01", "A"), entry("02", "C")]),
      ]),
    ).toEqual([
      { title: "A", count: 2 },
      { title: "B", count: 1 },
      { title: "C", count: 1 },
    ]);
  });
});
