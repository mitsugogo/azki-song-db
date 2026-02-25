import { describe, expect, it } from "vitest";
import { buildVercelCacheTagHeader } from "../cacheTags";

describe("buildVercelCacheTagHeader", () => {
  it("タグをカンマ区切りで連結する", () => {
    expect(buildVercelCacheTagHeader(["songs", "songs:list"])).toBe(
      "songs,songs:list",
    );
  });

  it("空白と空文字を除去する", () => {
    expect(
      buildVercelCacheTagHeader([" songs ", "", "   ", "milestones"]),
    ).toBe("songs,milestones");
  });

  it("重複タグを除去する", () => {
    expect(buildVercelCacheTagHeader(["songs", "songs", "songs:list"])).toBe(
      "songs,songs:list",
    );
  });
});
