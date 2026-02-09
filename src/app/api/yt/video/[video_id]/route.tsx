import { google } from "googleapis";
import { NextResponse } from "next/server";
import { YouTubeApiVideoResult } from "@/app/types/api/yt/video";

type FetchVideoOutcome = {
  result: YouTubeApiVideoResult | null;
  notFound: boolean;
};

// キャッシュ付きで Google スプレッドシートの `channels` シートを読み込み、
// チャンネルID(UC...) と ハンドル(@...) で検索できるマップを返す
type ChannelRegistryEntry = {
  youtubeId?: string | null;
  handle?: string | null;
  name?: string | null;
  artistname?: string | null;
  subscriberCount?: string | null;
  iconUrl?: string | null;
};

let _channelsRegistryPromise: Promise<{
  byId: Map<string, ChannelRegistryEntry>;
  byHandle: Map<string, ChannelRegistryEntry>;
}> | null = null;

const loadChannelsRegistry = async () => {
  if (_channelsRegistryPromise) return _channelsRegistryPromise;

  _channelsRegistryPromise = (async () => {
    const res = {
      byId: new Map<string, ChannelRegistryEntry>(),
      byHandle: new Map<string, ChannelRegistryEntry>(),
    };

    try {
      // スプレッドシートからチャンネル情報を取得
      const sheets = google.sheets({
        version: "v4",
        auth: process.env.GOOGLE_API_KEY,
      });
      const spreadsheetId = process.env.SPREADSHEET_ID;
      if (!spreadsheetId) return res;

      const response = await sheets.spreadsheets.get({
        spreadsheetId,
        ranges: ["channels!A:Z"],
        includeGridData: true,
        fields: "sheets.data.rowData.values(userEnteredValue,formattedValue)",
      });

      const sheet = response.data.sheets?.[0];
      const rows = sheet?.data?.[0]?.rowData || [];
      if (!rows || rows.length < 2) return res;

      const headerValues = rows[0].values || [];
      const headers: string[] = headerValues.map((v: any) => {
        return (
          v?.userEnteredValue?.stringValue ||
          v?.formattedValue ||
          ""
        ).toString();
      });

      const findHeaderIndex = (pred: (h: string) => boolean) =>
        headers.findIndex((h) => pred(h.toString().trim().toLowerCase()));

      const idxYoutubeId = findHeaderIndex(
        (h) =>
          (h.includes("youtube") && h.includes("id")) ||
          h.includes("youtubeid") ||
          h.includes("youtube id"),
      );
      const idxArtist = findHeaderIndex(
        (h) =>
          h.includes("アーティスト") ||
          h.includes("artist") ||
          h.includes("アーティスト名"),
      );
      const idxHandle = findHeaderIndex(
        (h) =>
          h.includes("ハンドル") ||
          h.includes("handle") ||
          h.includes("ハンド"),
      );
      const idxName = findHeaderIndex(
        (h) =>
          h.includes("チャンネル名") ||
          h.includes("channel") ||
          h.includes("name"),
      );
      const idxSubscribers = findHeaderIndex(
        (h) =>
          h.includes("登録") ||
          h.includes("subscriber") ||
          h.includes("登録者"),
      );
      const idxIcon = findHeaderIndex(
        (h) =>
          h.includes("アイコン") ||
          h.includes("icon") ||
          h.includes("thumbnail"),
      );

      const getCell = (row: any[], idx: number) => {
        if (!row || idx < 0) return "";
        const v = row[idx];
        return (
          v?.userEnteredValue?.stringValue ??
          v?.formattedValue ??
          ""
        ).toString();
      };

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].values || [];
        const youtubeId =
          idxYoutubeId >= 0 ? getCell(row, idxYoutubeId).trim() : "";
        const artist = idxArtist >= 0 ? getCell(row, idxArtist).trim() : "";
        const handleRaw = idxHandle >= 0 ? getCell(row, idxHandle).trim() : "";
        const name = idxName >= 0 ? getCell(row, idxName).trim() : "";
        const subs =
          idxSubscribers >= 0 ? getCell(row, idxSubscribers).trim() : "";
        const icon = idxIcon >= 0 ? getCell(row, idxIcon).trim() : "";

        const entry: ChannelRegistryEntry = {
          youtubeId: youtubeId || null,
          handle: handleRaw || null,
          name: name || null,
          artistname: artist || null,
          subscriberCount: subs || null,
          iconUrl: icon || null,
        };

        if (entry.youtubeId) {
          res.byId.set(entry.youtubeId, entry);
        }
        if (entry.handle) {
          const normalized = entry.handle.startsWith("@")
            ? entry.handle
            : `@${entry.handle}`;
          res.byHandle.set(normalized, entry);
          res.byHandle.set(entry.handle.replace(/^@/, ""), entry);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load channels registry from spreadsheet:",
        error,
      );
    }

    return res;
  })();

  return _channelsRegistryPromise;
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
    /(\[?credits?\]?|クレジット|スタッフ|お借りしている音源)/i.test(
      normalizeLine(line),
    ),
  );
  const targetLines = stopIndex >= 0 ? lines.slice(0, stopIndex) : lines;
  const sectionStartPattern =
    /^[-*・◆◇■●]?\s*(ライブゲスト|ゲスト|出演|参加|共演|コラボ|with|guest)\s*[:：]?\s*$/i;
  // ソーシャルメディア表記（Twitter/X, Instagram, SNS 等）、クレジット語、
  // そして配信スケジュール等の短い単独メンションを示す語を除外する
  const ignoreLinePattern =
    /(twitter|ツイッター|\bx\b|instagram|インスタ|sns|次は|宅から|mix|inst|vocal|lyrics|lyric|arrange|composer|illustration|illustrated|illust|animation|director|movie|video|modeling|edited|edited by|directed|production|assist|assistant|assisted|master|mastered|pre-?mix|illustrator|design|costume|constume|衣装|作曲|編曲|作詞|ミックス|インスト|イラスト|アニメ|監督|原画|動画|撮影|編集|歌唱|歌[:：])/i;

  const sectionIndex = targetLines.findIndex((line) =>
    sectionStartPattern.test(normalizeLine(line)),
  );
  const candidateLines =
    sectionIndex >= 0 ? targetLines.slice(sectionIndex + 1) : targetLines;

  const inListSection = sectionIndex >= 0;

  const firstHandleIndex = candidateLines.findIndex((line, idx) => {
    const nl = normalizeLine(line);
    if (!handlePattern.test(nl)) return false;
    // セクションヘッダ（ライブゲスト等）の末尾に続く行なら、
    // 単独のハンドル記載でもコラボ参加とみなす
    if (inListSection) return true;
    // 行内に参加を示す語がある場合は有効
    const participationRegex =
      /\b(Vocal|song|song:|出演|ゲスト|guest|with|feat|feat\.|collab|コラボ)\b|歌|・|／|,/i;
    if (participationRegex.test(nl)) return true;
    // 同一行に複数のハンドルが含まれる場合は参加表記とみなす
    if ((nl.match(handlePatternGlobal) || []).length > 1) return true;
    // 前後の文脈を参照して参加語があればコラボとみなす
    const windowStart = Math.max(0, idx - 2);
    const windowEnd = Math.min(candidateLines.length, idx + 3);
    const context = candidateLines
      .slice(windowStart, windowEnd)
      .map((l) => normalizeLine(l))
      .join(" ");
    if (participationRegex.test(context)) return true;
    return false; // 単独メンションはコラボとして扱わない
  });

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
      if (!line) continue;
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
  const creditHeaderRegex =
    /(^[-_]{3,}$|\[?credits?\]?|クレジット|スタッフ|お借りしている音源)/i;
  const creditMatch = creditHeaderRegex.exec(description);
  const creditIndex = creditMatch ? creditMatch.index : -1;
  while ((hm = localHandleRegex.exec(description)) !== null) {
    const idx = hm.index;
    const inUrl = urlRanges.some(([s, e]) => idx >= s && idx < e);
    if (inUrl) continue;
    if (creditIndex >= 0 && idx > creditIndex) continue;
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
    artistname: string | null;
    subscriberCount: string | null;
    thumbnails: Array<{
      url: string | null;
      width: number | null;
      height: number | null;
    }> | null;
  }>,
  primaryArtistName: string | null = null,
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
        artistname: primaryArtistName ?? null,
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
      artistname: string | null;
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
    const registry = await loadChannelsRegistry();
    for (const handle of collaborationHandles) {
      let channelItem: any = null;
      let regArtistName: string | null = null;

      // まずスプレッドシートのレジストリを参照してみる
      try {
        let regEntry: ChannelRegistryEntry | null = null;
        if (/^UC[0-9A-Za-z_-]{10,}$/i.test(handle)) {
          regEntry = registry.byId.get(handle) ?? null;
        } else {
          const normalized = handle.startsWith("@") ? handle : `@${handle}`;
          regEntry =
            registry.byHandle.get(normalized) ??
            registry.byHandle.get(handle.replace(/^@/, "")) ??
            null;
        }

        if (regEntry) {
          regArtistName = regEntry.artistname ?? null;
          channelItem = {
            id: regEntry.youtubeId ?? (handle.startsWith("@") ? null : handle),
            snippet: {
              title: regEntry.name ?? handle,
              thumbnails: regEntry.iconUrl
                ? { default: { url: regEntry.iconUrl } }
                : undefined,
            },
            statistics: regEntry.subscriberCount
              ? {
                  subscriberCount: String(regEntry.subscriberCount).replace(
                    /[^0-9]/g,
                    "",
                  ),
                }
              : undefined,
          } as any;
        }
      } catch (e) {
        // ignore registry errors and fall back to API
        channelItem = null;
      }

      // レジストリに見つからなければ YouTube Data API を使う
      if (!channelItem) {
        console.log(
          "Fetching collaboration channel from YouTube Data API:",
          handle,
        );
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
      }

      if (!channelItem) {
        collaborationChannels.push({
          id: handle,
          name: handle,
          artistname: null,
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

      // regArtistName が未設定の場合、channelId でスプレッドシートを再検索して補完する
      let finalArtistName: string | null = regArtistName ?? null;
      if (!finalArtistName && channelId) {
        try {
          const regById = registry.byId.get(channelId) ?? null;
          if (regById?.artistname) finalArtistName = regById.artistname;
        } catch (e) {
          // ignore
        }
      }

      collaborationChannels.push({
        id: channelId ?? handle,
        name: channelItem?.snippet?.title ?? handle,
        artistname: finalArtistName ?? null,
        subscriberCount,
        thumbnails,
      });
    }

    const primaryArtistName =
      registry.byId.get(item?.snippet?.channelId ?? "")?.artistname ?? null;

    return {
      result: mapYouTubeDataApiResult(
        item,
        videoId,
        channelThumbnails,
        channelSubscriberCount,
        collaborationChannels,
        primaryArtistName,
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

  // YouTube Data API を使って動画情報を取得
  const result = await fetchFromYouTubeDataApi(video_id);
  if (result.result) {
    return NextResponse.json(result.result, {
      headers: {
        "Cache-Control":
          "max-age=3600, s-maxage=3600, stale-while-revalidate=300",
      },
    });
  }

  if (result.notFound) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json(
    { error: "Failed to fetch video data" },
    { status: 500 },
  );
}
