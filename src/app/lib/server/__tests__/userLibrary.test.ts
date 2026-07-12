import { describe, expect, it } from "vitest";
import { sanitizeLegacyEntries } from "../../legacyLibrary";

describe("sanitizeLegacyEntries", () => {
  it("旧データの数値startを文字列へ正規化する", () => {
    expect(
      sanitizeLegacyEntries([
        { videoId: "video-1", start: 0 },
        { videoId: "video-2", start: 12.5 },
      ]),
    ).toEqual([
      { videoId: "video-1", start: "0" },
      { videoId: "video-2", start: "12.5" },
    ]);
  });

  it("一部の不正項目と正規化後の重複を除外する", () => {
    expect(
      sanitizeLegacyEntries([
        { videoId: "video-1", start: 0 },
        { videoId: "video-1", start: "0" },
        { videoId: "", start: 10 },
        null,
      ]),
    ).toEqual([{ videoId: "video-1", start: "0" }]);
  });

  it("全項目が不正なプレイリストは移行を中断する", () => {
    expect(() => sanitizeLegacyEntries([{ start: 0 }])).toThrow(
      "INVALID_MIGRATION",
    );
  });
});
