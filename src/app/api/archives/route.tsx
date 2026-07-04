import { google } from "googleapis";
import { NextResponse } from "next/server";
import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";
import { ArchiveItem } from "@/app/types/archiveItem";

type HeaderKey =
  | "sequence"
  | "topic"
  | "title"
  | "video_id"
  | "channel_id"
  | "video_url"
  | "video_duration"
  | "description"
  | "published_at"
  | "stream_started_at"
  | "timestamp_comment";

type HeaderDefinition = {
  key: HeaderKey;
  aliases: string[];
};

const SHEET_NAME = "配信アーカイブ";
const READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

const normalize = (s: string | undefined | null) =>
  String(s || "")
    .replace(/[（）\(\)\s\?？\.,，、!！_]/g, "")
    .toLowerCase();

const HEADER_SCHEMA: HeaderDefinition[] = [
  { key: "sequence", aliases: ["連番", "no", "number", "sequence", "#"] },
  {
    key: "topic",
    aliases: [
      "推測ゲーム配信内容",
      "推測ゲーム・配信内容",
      "配信内容",
      "topic",
      "category",
    ],
  },
  { key: "title", aliases: ["配信タイトル", "動画タイトル", "title"] },
  { key: "video_id", aliases: ["動画ID", "videoid", "video_id"] },
  {
    key: "channel_id",
    aliases: ["チャンネルID", "channelid", "channel_id"],
  },
  { key: "video_url", aliases: ["動画URL", "url", "動画リンク"] },
  {
    key: "video_duration",
    aliases: ["動画時間", "duration", "video_duration"],
  },
  {
    key: "description",
    aliases: [
      "動画詳細情報概要欄",
      "動画詳細情報（概要欄）",
      "概要欄",
      "description",
    ],
  },
  {
    key: "published_at",
    aliases: [
      "配信公開日時",
      "公開日時",
      "配信日",
      "publishedat",
      "published_at",
    ],
  },
  {
    key: "stream_started_at",
    aliases: [
      "配信開始日時",
      "配信日時",
      "streamstartedat",
      "stream_started_at",
      "startat",
      "start_at",
    ],
  },
  {
    key: "timestamp_comment",
    aliases: [
      "タイムスタンプ",
      "タイムスタンプ",
      "timestampcomment",
      "timestamp_comment",
      "timestamps",
    ],
  },
];

const getCellString = (cell: unknown) =>
  cell === undefined || cell === null ? "" : String(cell);

const getCellNumber = (cell: unknown) => Number(getCellString(cell)) || 0;

const getSheetsClient = () => {
  const spreadsheetId =
    process.env.ARCHIVES_SPREADSHEET_ID || process.env.SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!spreadsheetId) {
    throw new Error("SPREADSHEET_ID が未設定です");
  }

  if (clientEmail && privateKey) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: [READONLY_SCOPE],
    });

    return {
      spreadsheetId,
      sheets: google.sheets({ version: "v4", auth }),
    };
  }

  return {
    spreadsheetId,
    sheets: google.sheets({
      version: "v4",
      auth: process.env.GOOGLE_API_KEY,
    }),
  };
};

export async function GET() {
  try {
    const { sheets, spreadsheetId } = getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:K`,
      valueRenderOption: "FORMATTED_VALUE",
    });

    const rows = response.data.values || [];
    const headerValues = rows[0] || [];

    const colMap: Record<HeaderKey, number> = {
      sequence: -1,
      topic: -1,
      title: -1,
      video_id: -1,
      channel_id: -1,
      video_url: -1,
      video_duration: -1,
      description: -1,
      published_at: -1,
      stream_started_at: -1,
      timestamp_comment: -1,
    };

    HEADER_SCHEMA.forEach((def) => {
      const index = headerValues.findIndex((cell) => {
        return def.aliases.some(
          (alias) => normalize(alias) === normalize(getCellString(cell)),
        );
      });
      colMap[def.key] = index;
    });

    const getCell = (values: unknown[], key: HeaderKey) => {
      const index = colMap[key];
      return index !== -1 ? values[index] : undefined;
    };

    const items: ArchiveItem[] = rows
      .slice(1)
      .map((row) => {
        const values = row || [];
        const videoId = getCellString(getCell(values, "video_id")).trim();
        const channelId = getCellString(getCell(values, "channel_id")).trim();
        const videoUrl = getCellString(getCell(values, "video_url")).trim();
        const videoDuration = getCellString(
          getCell(values, "video_duration"),
        ).trim();
        const publishedAt = getCellString(
          getCell(values, "published_at"),
        ).trim();
        const streamStartedAt = getCellString(
          getCell(values, "stream_started_at"),
        ).trim();

        return {
          sequence: getCellNumber(getCell(values, "sequence")),
          topic: getCellString(getCell(values, "topic")).trim(),
          title: getCellString(getCell(values, "title")).trim(),
          video_id: videoId,
          channel_id: channelId,
          video_url:
            videoUrl ||
            (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ""),
          video_duration: videoDuration,
          description: getCellString(getCell(values, "description")).trim(),
          published_at: publishedAt,
          stream_started_at: streamStartedAt,
          timestamp_comment: getCellString(
            getCell(values, "timestamp_comment"),
          ).trim(),
        };
      })
      .filter((item) => item.title && item.video_id);

    items.sort((a, b) => {
      const streamDateA = new Date(a.stream_started_at).getTime();
      const streamDateB = new Date(b.stream_started_at).getTime();
      if (
        !Number.isNaN(streamDateA) &&
        !Number.isNaN(streamDateB) &&
        streamDateA !== streamDateB
      ) {
        return streamDateB - streamDateA;
      }

      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) {
        return dateB - dateA;
      }
      return a.sequence - b.sequence;
    });

    const now = new Date();
    return NextResponse.json(items, {
      headers: {
        "Cache-Control":
          "public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=300",
        "Vercel-Cache-Tag": buildVercelCacheTagHeader([
          cacheTags.coreDataset,
          cacheTags.archives,
          cacheTags.archivesList,
        ]),
        "x-data-updated": now.toISOString(),
        "Last-Modified": now.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error fetching archives from Google Sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch archives" },
      { status: 500 },
    );
  }
}
