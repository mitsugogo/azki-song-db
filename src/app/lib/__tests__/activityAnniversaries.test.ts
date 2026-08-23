import { describe, expect, it } from "vitest";
import type { AnniversaryItem } from "../../types/anniversaryItem";
import { buildAnniversaryActivityItems } from "../activityAnniversaries";

function makeAnniversary(
  overrides: Partial<AnniversaryItem> = {},
): AnniversaryItem {
  return {
    date: "06/03",
    first_date_at: "2018-06-02T15:00:00.000Z",
    name: "{year}年・{n}周年",
    url: "https://example.com/anniversary",
    note: "記念日のメモ",
    ...overrides,
  };
}

describe("activity anniversaries", () => {
  it("builds a high-importance JST occurrence for the requested year", () => {
    const items = buildAnniversaryActivityItems(
      [makeAnniversary()],
      { year: 2026, month: 6 },
      "ja",
    );

    expect(items).toEqual([
      expect.objectContaining({
        kind: "anniversary",
        occurredAt: "2026-06-02T15:00:00.000Z",
        displayName: "2026年・8周年",
        href: "https://example.com/anniversary",
        importance: "high",
      }),
    ]);
  });

  it("formats English anniversary numbers as ordinals", () => {
    const items = buildAnniversaryActivityItems(
      [makeAnniversary({ name: "The {n} anniversary in {year}" })],
      { year: 2029, month: 6 },
      "en",
    );

    expect(items[0]?.displayName).toBe("The 11th anniversary in 2029");
  });

  it("uses the anniversary list when the source URL is empty", () => {
    const items = buildAnniversaryActivityItems(
      [
        makeAnniversary({
          first_date_at: "",
          name: "固定の記念日",
          url: "",
        }),
      ],
      { year: 2026, month: 6 },
      "ja",
    );

    expect(items[0]?.href).toBe("/anniversaries");
  });

  it("omits other months, invalid dates, pre-origin dates, and zero anniversaries", () => {
    const items = buildAnniversaryActivityItems(
      [
        makeAnniversary({ date: "07/03" }),
        makeAnniversary({ date: "02/29" }),
        makeAnniversary({ first_date_at: "2027-06-02T15:00:00.000Z" }),
        makeAnniversary({ first_date_at: "2026-06-02T15:00:00.000Z" }),
        makeAnniversary({ date: "invalid" }),
      ],
      { year: 2026, month: 6 },
      "ja",
    );
    const invalidLeapDayItems = buildAnniversaryActivityItems(
      [makeAnniversary({ date: "02/29", first_date_at: "" })],
      { year: 2025, month: 2 },
      "ja",
    );

    expect(items).toEqual([]);
    expect(invalidLeapDayItems).toEqual([]);
  });
});
