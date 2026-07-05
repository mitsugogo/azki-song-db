import { describe, expect, it } from "vitest";
import {
  findArchiveSearchHighlightRange,
  normalizeArchiveSearchText,
  normalizeArchiveSeriesKey,
} from "../archiveSearch";

describe("archiveSearch", () => {
  it("matches hiragana, full-width katakana, and half-width katakana variants", () => {
    const source = normalizeArchiveSearchText("ｻﾗﾐｨ");

    expect(source).toBe("サラミィ");
    expect(source).toContain(normalizeArchiveSearchText("サラミィ"));
    expect(source).toContain(normalizeArchiveSearchText("さらみぃ"));
    expect(source).toContain(normalizeArchiveSearchText("ｻﾗﾐｨ"));
  });

  it("keeps archive series keys punctuation-insensitive after kana normalization", () => {
    expect(normalizeArchiveSeriesKey("【さらみぃ #1】")).toBe("【サラミィ1】");
    expect(normalizeArchiveSeriesKey("【ｻﾗﾐｨ＃１】")).toBe("【サラミィ1】");
  });

  it("maps kana-insensitive matches back to original highlight ranges", () => {
    expect(
      findArchiveSearchHighlightRange("今日はｻﾗﾐｨ回です", "さらみぃ"),
    ).toEqual({
      start: 3,
      end: 7,
    });
  });
});
