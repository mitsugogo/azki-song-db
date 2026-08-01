import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { channelsListMock, youtubeMock } = vi.hoisted(() => {
  const channelsListMock = vi.fn();
  const youtubeMock = vi.fn(() => ({
    channels: { list: channelsListMock },
  }));
  return { channelsListMock, youtubeMock };
});

vi.mock("googleapis", () => ({
  google: { youtube: youtubeMock },
}));

import {
  getJapaneseYouTubeChannelName,
  getYouTubeDataApiKey,
  getYouTubeDataApiRequestOptions,
} from "../youtubeDataApi";

const originalEnv = process.env;

describe("youtubeDataApi", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.YOUTUBE_DATA_API_KEY;
    channelsListMock.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses the YouTube Data API key", () => {
    process.env.YOUTUBE_DATA_API_KEY = "api-key";

    expect(getYouTubeDataApiKey()).toBe("api-key");
  });

  it("uses the request URL origin for the referer header", () => {
    expect(
      getYouTubeDataApiRequestOptions(
        "https://www.example.com/api/yt/video/abcdefghijk?x=1",
      ),
    ).toEqual({
      headers: {
        Referer: "https://www.example.com/",
      },
    });
  });

  it("accepts a URL instance for the referer header", () => {
    expect(
      getYouTubeDataApiRequestOptions(new URL("http://localhost:3000/watch")),
    ).toEqual({
      headers: {
        Referer: "http://localhost:3000/",
      },
    });
  });

  it("omits request options when no request URL is available", () => {
    expect(getYouTubeDataApiRequestOptions()).toBeUndefined();
  });

  it("日本語ローカライズされたチャンネル名を優先する", async () => {
    process.env.YOUTUBE_DATA_API_KEY = "api-key";
    channelsListMock.mockResolvedValue({
      data: {
        items: [
          {
            snippet: {
              title: "Default channel title",
              localized: { title: "日本語チャンネル名" },
            },
          },
        ],
      },
    });

    await expect(
      getJapaneseYouTubeChannelName(
        "UCabcdefghijk",
        "https://example.com/api/admin/google-sheets",
      ),
    ).resolves.toBe("日本語チャンネル名");
    expect(channelsListMock).toHaveBeenCalledWith(
      {
        part: ["snippet"],
        id: ["UCabcdefghijk"],
        hl: "ja",
      },
      { headers: { Referer: "https://example.com/" } },
    );
  });
});
