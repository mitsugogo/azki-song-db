import { describe, expect, it } from "vitest";
import { buildDokoAzPostText, buildDokoAzPostUrl } from "../xShare";

describe("buildDokoAzPostText", () => {
  it("地点名と #どこAZ を指定の書式にする", () => {
    expect(buildDokoAzPostText("AZKiタワー")).toBe(
      "AZKiタワーをGUESS！\n#どこAZ",
    );
  });
});

describe("buildDokoAzPostUrl", () => {
  it("Xの投稿画面に本文を渡す", () => {
    const url = new URL(buildDokoAzPostUrl("テスト地点"));

    expect(url.origin + url.pathname).toBe("https://x.com/intent/tweet");
    expect(url.searchParams.get("text")).toBe("テスト地点をGUESS！\n#どこAZ");
  });
});
