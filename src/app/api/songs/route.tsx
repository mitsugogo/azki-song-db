import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import slugify, { slugifyV2 } from "../../lib/slugify";

export async function GET() {
  try {
    const sheets = google.sheets({
      version: "v4",
      auth: process.env.GOOGLE_API_KEY,
    });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: [
        "歌枠2021以前!A:L",
        "歌枠2022!A:L",
        "歌枠2023!A:M", // 列範囲を少し広めに設定
        "歌枠2024!A:L",
        "歌枠2025!A:M",
        "歌枠2026!A:M",
        "記念ライブ系!A:R",
        "オリ曲!A:V",
        "カバー!A:U",
        "ゲスト・fesなど!A:M",
        "特殊!A:R",
      ],
      includeGridData: true,
      fields:
        "sheets(properties/title,data/rowData/values(userEnteredValue,hyperlink,formattedValue))",
    });

    /**
     * Googleスプレッドシートのシリアル値を秒に変換
     */
    function parseTimeFromNumberValue(numberValue: number): number {
      return Math.round(numberValue * 24 * 60 * 60);
    }

    /**
     * Googleスプレッドシートのシリアル値をISO文字列に変換
     */
    function convertToDate(numberValue: number): string {
      if (!numberValue) return "";
      return new Date(
        numberValue * 24 * 60 * 60 * 1000 + new Date(1899, 11, 30).getTime(),
      ).toISOString();
    }

    /**
     * ヘッダー文字列の正規化（全角半角、空白、記号の差異を吸収）
     */
    const normalize = (s: any) =>
      String(s || "")
        .replace(/[（）\(\)\s\?\？\.,，、!！]/g, "")
        .toLowerCase();

    // 取得したいフィールドと、スプレッドシート上の見出し名（エイリアス）の定義
    const HEADER_SCHEMA = [
      { key: "title", aliases: ["曲名", "title"] },
      { key: "artist", aliases: ["アーティスト", "artist"] },
      { key: "sing", aliases: ["歌った人", "sing"] },
      { key: "video", aliases: ["動画", "video", "video_uri"] },
      { key: "start", aliases: ["start", "開始", "開始時刻"] },
      { key: "end", aliases: ["end", "終了", "終了時刻"] },
      { key: "broadcast_at", aliases: ["配信日", "date", "broadcast_at"] },
      { key: "tags", aliases: ["tags（カンマ区切り）", "タグ", "tags"] },
      { key: "extra", aliases: ["備考", "extra", "note"] },
      { key: "milestones", aliases: ["マイルストーン", "milestones"] },
      { key: "album", aliases: ["アルバム", "album"] },
      { key: "album_release_at", aliases: ["アルバム発売日", "発売日"] },
      {
        key: "album_is_compilation",
        aliases: ["コンピレーションアルバム", "compilation"],
      },
      { key: "lyricist", aliases: ["作詞", "lyricist"] },
      { key: "composer", aliases: ["作曲", "composer"] },
      { key: "arranger", aliases: ["編曲", "arranger"] },
      { key: "live_call", aliases: ["ライブコール", "live_call"] },
      { key: "live_note", aliases: ["ライブノート", "live_note"] },
      { key: "view_count", aliases: ["再生数", "view_count"] },
    ] as const;

    const songs: any[] = [];

    response.data.sheets?.forEach((sheet) => {
      const sheetRows = sheet.data?.[0]?.rowData || [];
      if (sheetRows.length < 2) return; // ヘッダーとデータが必要

      const headerValues = sheetRows[0].values || [];

      // 1. このシートにおける列インデックスのマップを作成
      // 例: { title: 2, artist: 3, ... }
      const colMap: Record<string, number> = {};
      HEADER_SCHEMA.forEach((def) => {
        const index = headerValues.findIndex((cell) => {
          const cellStr =
            cell.userEnteredValue?.stringValue || cell.formattedValue || "";
          return def.aliases.some(
            (alias) => normalize(alias) === normalize(cellStr),
          );
        });
        colMap[def.key] = index; // 見つからない場合は -1
      });

      // 2. データ行の処理
      sheetRows.slice(1).forEach((row) => {
        const vals = row.values || [];

        // 有効フラグ(B列)チェック ※B列固定なのは運用ルールに準拠
        const isEnabled = vals[1]?.userEnteredValue?.boolValue === true;

        // 曲名の取得（動的な列から）
        const titleIdx = colMap["title"];
        const titleValue =
          titleIdx !== -1
            ? vals[titleIdx]?.userEnteredValue?.stringValue ||
              vals[titleIdx]?.formattedValue ||
              ""
            : "";

        if (!isEnabled || !titleValue) return;

        // 値取得ヘルパー
        const getStr = (key: string) => {
          const i = colMap[key];
          return i !== -1 && vals[i]
            ? vals[i].userEnteredValue?.stringValue ||
                vals[i].formattedValue ||
                ""
            : "";
        };
        const getNum = (key: string) => {
          const i = colMap[key];
          return i !== -1 && vals[i]
            ? (vals[i].userEnteredValue?.numberValue ?? 0)
            : 0;
        };
        const getBool = (key: string) => {
          const i = colMap[key];
          return i !== -1 && vals[i]
            ? (vals[i].userEnteredValue?.boolValue ?? false)
            : false;
        };
        const getLink = (key: string) => {
          const i = colMap[key];
          return i !== -1 && vals[i] ? vals[i].hyperlink || "" : "";
        };

        const videoUri = getLink("video");
        const videoId =
          videoUri.match(
            /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^?&]{11})/,
          )?.[1] || "";
        const broadcastAt = convertToDate(getNum("broadcast_at"));

        // 組み合わせてユニークな文字列にする

        songs.push({
          title: titleValue,
          slug: slugify(titleValue) || videoId,
          slugv2: slugifyV2(titleValue + "_" + videoId) || videoId,
          artist: getStr("artist"),
          sing: getStr("sing"),
          lyricist: getStr("lyricist"),
          composer: getStr("composer"),
          arranger: getStr("arranger"),
          album: getStr("album"),
          album_list_uri: getLink("album"),
          album_release_at: getNum("album_release_at")
            ? convertToDate(getNum("album_release_at"))
            : "",
          album_is_compilation: getBool("album_is_compilation"),
          video_title: getStr("video"),
          video_uri: videoUri,
          video_id: videoId,
          start: parseTimeFromNumberValue(getNum("start")),
          end: parseTimeFromNumberValue(getNum("end")),
          broadcast_at: broadcastAt,
          year: broadcastAt ? new Date(broadcastAt).getFullYear() : null,
          tags: getStr("tags")
            .split(/[,,、]/)
            .map((t) => t.trim())
            .filter(Boolean),
          extra: getStr("extra"),
          milestones: getStr("milestones")
            .split(/[,,、]/)
            .map((t) => t.trim())
            .filter(Boolean),
          live_call: getStr("live_call"),
          live_note: getStr("live_note"),
          view_count: getNum("view_count"),
        });
      });
    });

    // ソート処理
    songs.sort((a, b) => {
      const timeA = a.album
        ? new Date(a.album_release_at).getTime()
        : new Date(a.broadcast_at).getTime();
      const timeB = b.album
        ? new Date(b.album_release_at).getTime()
        : new Date(b.broadcast_at).getTime();
      return (timeB || 0) - (timeA || 0);
    });

    const now = new Date();
    return NextResponse.json(songs, {
      headers: {
        "Cache-Control":
          "max-age=300, s-maxage=86400, stale-while-revalidate=300",
        "x-data-updated": now.toISOString(),
        "Last-Modified": now.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
