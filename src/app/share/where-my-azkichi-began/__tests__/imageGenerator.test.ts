import { describe, expect, it } from "vitest";
import {
  MAX_TIMELINE_ROWS,
  buildXPostText,
  sanitizeTimelineRows,
  type TimelineRowInput,
} from "../imageGenerator";

describe("where-my-azkichi-began image generator helpers", () => {
  it("sanitizeTimelineRows は年と内容があれば月未入力でも有効として扱う", () => {
    const rows: TimelineRowInput[] = [
      { year: "2020", month: "8", content: "初見配信" },
      { year: "", month: "10", content: "無効" },
      { year: "2021", month: "", content: "有効" },
      { year: "2022", month: "11", content: "ワンマンライブ" },
    ];

    const result = sanitizeTimelineRows(rows, 3);

    expect(result).toEqual([
      { year: "2020", month: "8", content: "初見配信" },
      { year: "2021", month: "", content: "有効" },
      { year: "2022", month: "11", content: "ワンマンライブ" },
    ]);
  });

  it("sanitizeTimelineRows は既定上限を超えない", () => {
    const rows = Array.from({ length: MAX_TIMELINE_ROWS + 5 }, (_, index) => ({
      year: `20${index}`,
      month: "1",
      content: `entry-${index}`,
    }));

    const result = sanitizeTimelineRows(rows);
    expect(result).toHaveLength(MAX_TIMELINE_ROWS);
  });

  it("buildXPostText は日本語テンプレートを返す", () => {
    const result = buildXPostText("みつごご", 7, "ja");

    expect(result).toContain("みつごご");
    expect(result).toContain("あなたのあずきちはどこから");
    expect(result).toContain("#あなたのあずきちはどこから");
    expect(result).toContain("#AZSongDB");
  });

  it("buildXPostText は英語テンプレートを返す", () => {
    const result = buildXPostText("Alice", 3, "en");

    expect(result).toContain("Alice");
    expect(result).toContain("3 entries");
    expect(result).toContain("#WhereDidYourAZKiJourneyBegin");
    expect(result).toContain("#AZSongDB");
  });
});
