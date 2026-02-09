import { Client } from "youtubei";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { YouTubeApiVideoResult } from "@/app/types/api/yt/video";

const youtube = new Client({
  // 日本語ロケールを明示
  youtubeClientOptions: {
    hl: "ja",
    gl: "JP",
  },
  fetchOptions: {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36",
      "Accept-Language": "ja-JP,ja;q=0.8,en-US;q=0.5,en;q=0.3",
    },
  },
});

type FetchVideoOutcome = {
  result: YouTubeApiVideoResult | null;
  notFound: boolean;
};

const parseIsoDurationToSeconds = (duration: string | null | undefined) => {
  if (!duration) return null;
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(duration) ?? [];
  const hours = match[1] ? Number.parseInt(match[1], 10) : 0;
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
  const seconds = match[3] ? Number.parseInt(match[3], 10) : 0;
  return hours * 3600 + minutes * 60 + seconds;
};

const formatSubscriberCountLabel = (
  count: string | null | undefined,
): string | null => {
  if (!count) return null;
  const value = Number.parseInt(count, 10);
  if (!Number.isFinite(value)) return count;
  if (value < 10_000) {
    return `チャンネル登録者数 ${value.toLocaleString()}人`;
  }
  const man = value / 10_000;
  const display =
    man >= 100 ? `${Math.round(man)}` : `${Math.round(man * 10) / 10}`;
  return `チャンネル登録者数 ${display.replace(/\.0$/, "")}万人`;
};

export const extractCollaborationHandles = (description?: string | null) => {
  if (!description) return [];
  const lines = description.split(/\r\n|\n/).splice(0, 50);
  const normalizeLine = (line: string) =>
    line.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\uFEFF]/g, "").trim();
  const handlePattern = /[@＠][0-9A-Za-z._-]{2,30}/;
  const handlePatternGlobal = /[@＠][0-9A-Za-z._-]{2,30}/g;
  const stopIndex = lines.findIndex((line) =>
    /(^[-_]{3,}$|\[?credits?\]?|クレジット|スタッフ)/i.test(
      normalizeLine(line),
    ),
  );
  const targetLines = stopIndex >= 0 ? lines.slice(0, stopIndex) : lines;
  const sectionStartPattern =
    /^[-*・◆◇■●]?\s*(ライブゲスト|ゲスト|出演|参加|共演|コラボ|with|guest)\s*[:：]?\s*$/i;
  const ignoreLinePattern =
    /(mix|inst|vocal|lyrics|lyric|arrange|composer|illustration|illustrated|illust|animation|director|movie|video|modeling|edited|edited by|directed|production|assist|assistant|assisted|master|mastered|pre-?mix|illustrator|作曲|編曲|作詞|ミックス|インスト|イラスト|アニメ|監督|原画|動画|撮影)/i;

  const sectionIndex = targetLines.findIndex((line) =>
    sectionStartPattern.test(normalizeLine(line)),
  );
  const candidateLines =
    sectionIndex >= 0 ? targetLines.slice(sectionIndex + 1) : targetLines;

  const firstHandleIndex = candidateLines.findIndex((line) =>
    handlePattern.test(normalizeLine(line)),
  );

  // ハンドルが見つからない場合、candidateLines 内の YouTube チャンネル URL を探す
  if (firstHandleIndex < 0) {
    const channelUrlRegex =
      /https?:\/\/(?:www\.)?youtube\.com\/(?:@([0-9A-Za-z._-]{2,30})|channel\/([0-9A-Za-z_-]{20,}))/i;
    const urlHandles: string[] = [];
    for (const rawLine of candidateLines) {
      const line = normalizeLine(rawLine);
      if (!line) continue;
      const m = channelUrlRegex.exec(line);
      if (!m) continue;
      if (m[1]) {
        const h = m[1].replace("＠", "@");
        urlHandles.push(h.startsWith("@") ? h : `@${h}`);
      } else if (m[2]) {
        urlHandles.push(m[2]);
      }
    }

    if (urlHandles.length > 0)
      return Array.from(new Set(urlHandles)).slice(0, 12);
  }

  const handles: string[] = [];
  if (firstHandleIndex >= 0) {
    for (const rawLine of candidateLines.slice(firstHandleIndex)) {
      const line = normalizeLine(rawLine);
      if (!line) break;
      // URL 行でも @ ハンドルや /channel/ID を含む場合は処理を継続する
      if (/https?:\/\//i.test(line) && !/@|channel\//i.test(line)) break;
      if (ignoreLinePattern.test(line)) continue;

      const matches = line.match(handlePatternGlobal) ?? [];
      if (matches.length === 0) {
        // /channel/UC... のような URL からチャンネルIDを抽出
        const ch = /youtube\.com\/channel\/([0-9A-Za-z_-]{20,})/i.exec(line);
        if (ch && ch[1]) {
          handles.push(ch[1]);
          continue;
        }
        continue;
      }

      handles.push(...matches.map((handle) => handle.replace("＠", "@")));
    }
  }

  const unique = Array.from(new Set(handles));
  if (unique.length > 0) return unique;

  // フォールバック：URL内のマッチを除外してハンドルを抽出する
  const urlRegex = /\bhttps?:\/\/[^\s]+/gi;
  const urlRanges: Array<[number, number]> = [];
  let um: RegExpExecArray | null = null;
  while ((um = urlRegex.exec(description)) !== null) {
    urlRanges.push([um.index, um.index + um[0].length]);
  }

  const fallbackHandles: string[] = [];
  const localHandleRegex = /[@＠][0-9A-Za-z._-]{2,30}/g;
  let hm: RegExpExecArray | null = null;
  while ((hm = localHandleRegex.exec(description)) !== null) {
    const idx = hm.index;
    const inUrl = urlRanges.some(([s, e]) => idx >= s && idx < e);
    if (inUrl) continue;
    // フォールバックでも、該当ハンドルがクレジット系の行に含まれている場合は除外する
    const lineStart = Math.max(0, description.lastIndexOf("\n", idx) + 1);
    const lineEnd = description.indexOf("\n", idx);
    const rawLine = description.slice(
      lineStart,
      lineEnd === -1 ? description.length : lineEnd,
    );
    const norm = normalizeLine(rawLine);
    if (ignoreLinePattern.test(norm)) continue;
    fallbackHandles.push(hm[0].replace("＠", "@"));
  }

  return Array.from(new Set(fallbackHandles)).slice(0, 12);
};

const fetchChannelByHandle = async (
  youtubeData: ReturnType<typeof google.youtube>,
  handle: string,
) => {
  const normalizedHandle = handle.startsWith("@") ? handle : `@${handle}`;
  try {
    const response = await youtubeData.channels.list({
      part: ["id", "snippet", "statistics"],
      forHandle: normalizedHandle,
    });
    return response?.data?.items?.[0] ?? null;
  } catch (error) {
    console.error("Failed to fetch YouTube channel by handle:", error);
    return null;
  }
};

const mapYoutubeiResult = (v: any, videoId: string): YouTubeApiVideoResult => {
  const safeThumbnails = Array.isArray(v.thumbnails)
    ? v.thumbnails.map((t: any) => ({
        url: t.url ?? null,
        width: t.width ?? null,
        height: t.height ?? null,
      }))
    : null;

  const safeChannel = v.channel
    ? {
        id: v.channel.id ?? null, // channel id
        name: v.channel.name ?? null,
        subscriberCount: v.channel.subscriberCount ?? null,
        thumbnails: Array.isArray(v.channel.thumbnails)
          ? v.channel.thumbnails.map((t: any) => ({
              url: t.url ?? null,
              width: t.width ?? null,
              height: t.height ?? null,
            }))
          : null,
      }
    : null;

  const safeChannels = Array.isArray(v.channels)
    ? v.channels.map((ch: any) => ({
        id: ch.id ?? null,
        name: ch.name ?? null,
        subscriberCount: ch.subscriberCount ?? null,
        thumbnails: Array.isArray(ch.thumbnails)
          ? ch.thumbnails.map((t: any) => ({
              url: t.url ?? null,
              width: t.width ?? null,
              height: t.height ?? null,
            }))
          : null,
      }))
    : null;

  return {
    id: v.id ?? v.videoId ?? videoId,
    title: v.title ?? null,
    uploadDate: v.uploadDate ?? v.published ?? null,
    viewCount: v.viewCount ?? v.views ?? null,
    isLiveContent: v.isLiveContent ?? v.isLive ?? false,
    thumbnails: safeThumbnails,
    channel: safeChannel,
    channels: safeChannels,
    likeCount: v.likeCount ?? null,
    tags: Array.isArray(v.tags) ? v.tags : [],
    description: v.description ?? null,
    duration: v.duration ?? v.lengthSeconds ?? null,
    chapters: Array.isArray(v.chapters) ? v.chapters : [],
    music: v.music
      ? {
          imageUrl: v.music.imageUrl ?? v.music.image ?? null,
          title: v.music.title ?? null,
          artist: v.music.artist ?? null,
          album: v.music.album ?? null,
        }
      : null,
    lastFetchedAt: new Date().toISOString(),
  };
};

const mapYouTubeDataApiResult = (
  item: any,
  videoId: string,
  channelThumbnails: Array<{
    url: string | null;
    width: number | null;
    height: number | null;
  }> | null,
  channelSubscriberCount: string | null,
  collaborationChannels: Array<{
    id: string | null;
    name: string | null;
    subscriberCount: string | null;
    thumbnails: Array<{
      url: string | null;
      width: number | null;
      height: number | null;
    }> | null;
  }>,
): YouTubeApiVideoResult => {
  const thumbnails = item?.snippet?.thumbnails
    ? Object.values(item.snippet.thumbnails).map((t: any) => ({
        url: t?.url ?? null,
        width: t?.width ?? null,
        height: t?.height ?? null,
      }))
    : null;

  const primaryChannel = item?.snippet?.channelId
    ? {
        id: item.snippet.channelId ?? null,
        name: item.snippet.channelTitle ?? null,
        subscriberCount: channelSubscriberCount,
        thumbnails: channelThumbnails,
      }
    : null;

  const channels = primaryChannel
    ? [primaryChannel, ...collaborationChannels]
    : collaborationChannels.length > 0
      ? collaborationChannels
      : null;

  return {
    id: item?.id ?? videoId,
    title: item?.snippet?.title ?? null,
    uploadDate: item?.snippet?.publishedAt ?? null,
    viewCount: item?.statistics?.viewCount
      ? Number.parseInt(item.statistics.viewCount, 10)
      : null,
    isLiveContent: item?.snippet?.liveBroadcastContent === "live",
    thumbnails,
    channel: primaryChannel,
    channels,
    likeCount: item?.statistics?.likeCount
      ? Number.parseInt(item.statistics.likeCount, 10)
      : null,
    tags: Array.isArray(item?.snippet?.tags) ? item.snippet.tags : [],
    description: item?.snippet?.description ?? null,
    duration: parseIsoDurationToSeconds(item?.contentDetails?.duration),
    chapters: [],
    music: null,
    lastFetchedAt: new Date().toISOString(),
  };
};

const fetchFromYoutubei = async (
  videoId: string,
): Promise<FetchVideoOutcome> => {
  try {
    const video = await youtube.getVideo(videoId);
    if (!video) {
      return { result: null, notFound: true };
    }
    const v: any = video;
    return { result: mapYoutubeiResult(v, videoId), notFound: false };
  } catch (error) {
    console.error("Failed to fetch YouTube video data (youtubei):", error);
    return { result: null, notFound: false };
  }
};

const fetchFromYouTubeDataApi = async (
  videoId: string,
): Promise<FetchVideoOutcome> => {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return { result: null, notFound: false };
  }

  try {
    const youtubeData = google.youtube({
      version: "v3",
      auth: apiKey,
    });

    const response = await youtubeData.videos.list({
      part: ["id", "snippet", "statistics", "contentDetails"],
      id: [videoId],
    });

    const item = response?.data?.items?.[0];
    if (!item) {
      return { result: null, notFound: true };
    }

    let channelThumbnails: Array<{
      url: string | null;
      width: number | null;
      height: number | null;
    }> | null = null;
    let channelSubscriberCount: string | null = null;
    const collaborationChannels: Array<{
      id: string | null;
      name: string | null;
      subscriberCount: string | null;
      thumbnails: Array<{
        url: string | null;
        width: number | null;
        height: number | null;
      }> | null;
    }> = [];

    if (item?.snippet?.channelId) {
      try {
        const channelResponse = await youtubeData.channels.list({
          part: ["snippet", "statistics"],
          id: [item.snippet.channelId],
        });

        const channelItem = channelResponse?.data?.items?.[0];
        if (channelItem?.snippet?.thumbnails) {
          channelThumbnails = Object.values(channelItem.snippet.thumbnails).map(
            (t: any) => ({
              url: t?.url ?? null,
              width: t?.width ?? null,
              height: t?.height ?? null,
            }),
          );
        }

        if (channelItem?.statistics?.subscriberCount) {
          channelSubscriberCount = formatSubscriberCountLabel(
            channelItem.statistics.subscriberCount,
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch YouTube channel thumbnails (data api):",
          error,
        );
      }
    }

    const collaborationHandles = extractCollaborationHandles(
      item?.snippet?.description,
    );
    for (const handle of collaborationHandles) {
      let channelItem: any = null;

      // チャンネル ID の可能性 (例: UC...)
      if (/^UC[0-9A-Za-z_-]{10,}$/i.test(handle)) {
        try {
          const chResp = await youtubeData.channels.list({
            part: ["snippet", "statistics"],
            id: [handle],
          });
          channelItem = chResp?.data?.items?.[0] ?? null;
        } catch (error) {
          channelItem = null;
        }
      } else {
        channelItem = await fetchChannelByHandle(youtubeData, handle);
      }

      if (!channelItem) {
        collaborationChannels.push({
          id: handle,
          name: handle,
          subscriberCount: null,
          thumbnails: null,
        });
        continue;
      }

      const channelId =
        channelItem.id ?? (handle.startsWith("@") ? null : handle);
      if (channelId && channelId === item?.snippet?.channelId) {
        continue;
      }

      const thumbnails = channelItem?.snippet?.thumbnails
        ? Object.values(channelItem.snippet.thumbnails).map((t: any) => ({
            url: t?.url ?? null,
            width: t?.width ?? null,
            height: t?.height ?? null,
          }))
        : null;
      const subscriberCount = channelItem?.statistics?.subscriberCount
        ? formatSubscriberCountLabel(channelItem.statistics.subscriberCount)
        : null;

      collaborationChannels.push({
        id: channelId ?? handle,
        name: channelItem?.snippet?.title ?? handle,
        subscriberCount,
        thumbnails,
      });
    }

    return {
      result: mapYouTubeDataApiResult(
        item,
        videoId,
        channelThumbnails,
        channelSubscriberCount,
        collaborationChannels,
      ),
      notFound: false,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube video data (data api):", error);
    return { result: null, notFound: false };
  }
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ video_id: string }> },
) {
  const { video_id } = await params;
  if (!video_id) {
    return NextResponse.json(
      { error: "video_id is required" },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  let forceFallback = url.searchParams.get("fallback") === "1";

  // [temporary] 常にフォールバックを使う
  // TODO: うまくいったら戻したい
  forceFallback = true;

  if (!forceFallback) {
    const primary = await fetchFromYoutubei(video_id);
    if (primary.result) {
      return NextResponse.json(primary.result, {
        headers: {
          "Cache-Control":
            "max-age=3600, s-maxage=3600, stale-while-revalidate=300",
        },
      });
    }

    const fallback = await fetchFromYouTubeDataApi(video_id);
    if (fallback.result) {
      return NextResponse.json(fallback.result, {
        headers: {
          "Cache-Control":
            "max-age=3600, s-maxage=3600, stale-while-revalidate=300",
        },
      });
    }

    if (primary.notFound || fallback.notFound) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to fetch video data" },
      { status: 500 },
    );
  }

  const fallback = await fetchFromYouTubeDataApi(video_id);
  if (fallback.result) {
    return NextResponse.json(fallback.result, {
      headers: {
        "Cache-Control":
          "max-age=3600, s-maxage=3600, stale-while-revalidate=300",
      },
    });
  }

  if (fallback.notFound) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json(
    { error: "Failed to fetch video data" },
    { status: 500 },
  );
}
