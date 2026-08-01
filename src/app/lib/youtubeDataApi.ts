import { google } from "googleapis";

export function getYouTubeDataApiKey() {
  return process.env.YOUTUBE_DATA_API_KEY?.trim() || "";
}

function normalizeReferer(value: string | URL) {
  try {
    const url = value instanceof URL ? value : new URL(value);
    return `${url.origin}/`;
  } catch {
    return `${value}`;
  }
}

export function getYouTubeDataApiRequestOptions(requestUrl?: string | URL) {
  if (!requestUrl) {
    return undefined;
  }

  return {
    headers: {
      Referer: normalizeReferer(requestUrl),
    },
  };
}

export function createYouTubeDataApiClient() {
  const apiKey = getYouTubeDataApiKey();
  if (!apiKey) {
    return null;
  }

  return google.youtube({
    version: "v3",
    auth: apiKey,
  });
}

export async function getJapaneseYouTubeChannelName(
  channelId: string,
  requestUrl?: string | URL,
) {
  const normalizedChannelId = channelId.trim();
  if (!normalizedChannelId) {
    throw new Error("channelId が不正です");
  }

  const youtube = createYouTubeDataApiClient();
  if (!youtube) {
    throw new Error("YOUTUBE_DATA_API_KEY が設定されていません");
  }

  try {
    const response = await youtube.channels.list(
      {
        part: ["snippet"],
        id: [normalizedChannelId],
        hl: "ja",
      },
      getYouTubeDataApiRequestOptions(requestUrl),
    );
    const snippet = response.data.items?.[0]?.snippet;
    return snippet?.localized?.title?.trim() || snippet?.title?.trim() || "";
  } catch (error) {
    console.error("Failed to fetch Japanese YouTube channel name:", error);
    throw new Error("日本語のチャンネル名の取得に失敗しました");
  }
}
