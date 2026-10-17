import { describe, expect, it } from "vitest";
import type { AnniversaryItem } from "../../types/anniversaryItem";
import { buildAnniversaryPresentation } from "../presentation";

const item = (overrides: Partial<AnniversaryItem> = {}): AnniversaryItem => ({
  date: "11/15",
  first_date_at: "2018-11-14T15:00:00.000Z",
  name: "活動開始{n}周年",
  url: "",
  note: "",
  ...overrides,
});
const now = Date.parse("2026-10-17T03:00:00.000Z");

describe("anniversary presentation", () => {
  it("groups every item once in next-occurrence order across years", () => {
    const items = [
      item({ name: "年始", date: "01/01", first_date_at: "" }),
      item(),
      item({ name: "今月の過ぎた日", date: "10/01", first_date_at: "" }),
      item({ name: "今月のこれから", date: "10/20", first_date_at: "" }),
      item({ name: "年末", date: "12/31", first_date_at: "" }),
    ];
    const { groups, featured } = buildAnniversaryPresentation(items, "ja", now);
    expect(groups.map((group) => group.key)).toEqual([
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-10",
    ]);
    expect(groups.flatMap((group) => group.rows)).toHaveLength(items.length);
    expect(
      new Set(groups.flatMap((group) => group.rows.map((row) => row.id))).size,
    ).toBe(items.length);
    expect(featured.map((row) => row.name)).toEqual(["今月のこれから"]);
    expect(featured[0].daysUntil).toBe(3);
  });

  it("features all entries on the closest date without a day-limit cutoff", () => {
    const items = [item(), item({ name: "別の記念日" })];
    const { featured, groups } = buildAnniversaryPresentation(
      items,
      "ja",
      Date.parse("2026-01-01T00:00:00Z"),
    );
    expect(featured).toHaveLength(2);
    expect(featured.every((row) => row.daysUntil! > 35)).toBe(true);
    expect(groups[0].rows).toEqual(featured);
  });

  it("uses JST for next date, initial date, and anniversary year", () => {
    const { featured } = buildAnniversaryPresentation([item()], "ja", now);
    expect(featured[0]).toMatchObject({
      name: "活動開始8周年",
      nextDate: "2026年11月15日",
      firstDate: "2018年11月15日",
      monthDay: "11/15",
      daysUntil: 29,
    });
  });

  it("switches from tomorrow to today at JST midnight and keeps today for the whole day", () => {
    const before = Date.parse("2026-11-14T14:59:59Z");
    const midnight = before + 1000;
    const lateToday = Date.parse("2026-11-15T14:59:59Z");
    expect(
      buildAnniversaryPresentation([item()], "ja", before).featured[0]
        .daysUntil,
    ).toBe(1);
    for (const time of [midnight, lateToday]) {
      expect(
        buildAnniversaryPresentation(
          [item(), item({ name: "同日の記念日" })],
          "ja",
          time,
        ).featured,
      ).toHaveLength(2);
      expect(
        buildAnniversaryPresentation([item()], "ja", time).featured[0],
      ).toMatchObject({ daysUntil: 0, monthKey: "2026-11" });
    }
    expect(
      buildAnniversaryPresentation([item()], "ja", lateToday + 1000)
        .featured[0],
    ).toMatchObject({ name: "活動開始9周年", monthKey: "2027-11" });
  });

  it("uses the initial date before the date field and falls back when it is absent", () => {
    const { groups } = buildAnniversaryPresentation(
      [
        item({ date: "01/01" }),
        item({ name: "初回日なし", date: "11/16", first_date_at: "" }),
      ],
      "ja",
      now,
    );
    expect(groups[0].rows.map((row) => row.monthDay)).toEqual([
      "11/15",
      "11/16",
    ]);
    expect(groups[0].rows[1].firstDate).toBe("");
  });

  it("keeps undated items at the end without featuring them or dropping notes", () => {
    const undated = item({
      date: "",
      first_date_at: "invalid",
      name: "日付不明",
      note: "補足",
      url: "https://example.com",
    });
    const { groups, featured } = buildAnniversaryPresentation(
      [undated, item()],
      "ja",
      now,
    );
    expect(groups.map((group) => group.key)).toEqual(["2026-11", "undated"]);
    expect(groups[1].rows[0]).toMatchObject({
      item: undated,
      daysUntil: null,
      firstDate: "",
    });
    expect(featured).toHaveLength(1);
    expect(buildAnniversaryPresentation([undated], "ja", now).featured).toEqual(
      [],
    );
  });

  it.each([
    [2029, "11th"],
    [2030, "12th"],
    [2031, "13th"],
    [2039, "21st"],
  ])("formats English names in %i", (year, ordinal) => {
    const { featured } = buildAnniversaryPresentation(
      [item({ name: "The {n} anniversary in {year}" })],
      "en",
      Date.parse(`${year}-01-01T00:00:00Z`),
    );
    expect(featured[0].name).toBe(`The ${ordinal} anniversary in ${year}`);
    expect(featured[0].monthLabel).toBe(`November ${year}`);
  });

  it("returns an empty presentation for no items", () => {
    expect(buildAnniversaryPresentation([], "ja", now)).toEqual({
      groups: [],
      featured: [],
    });
  });
});
