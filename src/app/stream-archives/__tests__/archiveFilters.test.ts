import { describe, expect, it } from "vitest";
import {
  getArchiveCastNames,
  getLegacyArchiveListUrl,
  setArchiveCastNames,
} from "../archiveFilters";

describe("archive filter URL state", () => {
  it("reads and writes multiple cast values", () => {
    const params = new URLSearchParams(
      "keyword=live&cast=AZKi&cast=%E9%B7%B9%E5%B6%BA%E3%83%AB%E3%82%A4&cast=AZKi",
    );

    expect(getArchiveCastNames(params)).toEqual(["AZKi", "鷹嶺ルイ"]);

    setArchiveCastNames(params, ["星街すいせい", "AZKi"]);
    expect(params.getAll("cast")).toEqual(["星街すいせい", "AZKi"]);
    expect(params.get("keyword")).toBe("live");

    setArchiveCastNames(params, []);
    expect(params.has("cast")).toBe(false);
  });

  it("moves legacy list state to the list route without changing it", () => {
    expect(
      getLegacyArchiveListUrl(
        "https://example.com/stream-archives?cast=AZKi&cast=%E9%B7%B9%E5%B6%BA%E3%83%AB%E3%82%A4&view=list#archive-video-1",
      ),
    ).toBe(
      "/stream-archives/list?cast=AZKi&cast=%E9%B7%B9%E5%B6%BA%E3%83%AB%E3%82%A4&view=list#archive-video-1",
    );
    expect(
      getLegacyArchiveListUrl(
        "https://example.com/stream-archives#archive-video-2",
      ),
    ).toBe("/stream-archives/list#archive-video-2");
    expect(
      getLegacyArchiveListUrl("https://example.com/stream-archives"),
    ).toBeNull();
    expect(
      getLegacyArchiveListUrl(
        "https://example.com/en/stream-archives?series=chat",
      ),
    ).toBe("/en/stream-archives/list?series=chat");
  });
});
