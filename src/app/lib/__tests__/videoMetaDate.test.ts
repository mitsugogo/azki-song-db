import { describe, expect, it } from "vitest";
import type { YouTubeApiVideoResult } from "../../types/api/yt/video";
import { resolveVideoMetaDate } from "../videoMetaDate";

describe("resolveVideoMetaDate", () => {
  it("ライブ配信では actualStartTime を優先する", () => {
    const videoInfo = {
      snippet: {
        publishedAt: "2024-06-28T12:00:00Z",
      },
      liveStreamingDetails: {
        actualStartTime: "2024-07-01T12:00:00Z",
      },
    } as YouTubeApiVideoResult;

    expect(resolveVideoMetaDate(videoInfo)).toBe("2024-07-01T12:00:00Z");
  });

  it("通常動画では publishedAt にフォールバックする", () => {
    const videoInfo = {
      snippet: {
        publishedAt: "2024-06-28T12:00:00Z",
      },
    } as YouTubeApiVideoResult;

    expect(resolveVideoMetaDate(videoInfo)).toBe("2024-06-28T12:00:00Z");
  });

  it("どちらもなければ null を返す", () => {
    expect(resolveVideoMetaDate(null)).toBeNull();
  });
});
