import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";

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
        "歌枠2023!A:L",
        "歌枠2024!A:L",
        "歌枠2025!A:L",
        "歌枠2026!A:L",
        "記念ライブ系!A:L",
        "オリ曲!A:Q",
        "カバー!A:O",
        "ゲスト・fesなど!A:L",
        "特殊!A:O",
      ],
      includeGridData: true, // セルの詳細情報を含める
      fields: "sheets.data.rowData.values(userEnteredValue,hyperlink)", // 必要なフィールドのみ取得
    });
    const allRows: sheets_v4.Schema$RowData[] = [];
    response.data.sheets?.forEach((sheet) => {
      const rows = sheet.data?.[0]?.rowData || [];
      allRows.push(...rows);
    });
    const rows = allRows;

    function parseTimeFromNumberValue(numberValue: number): number {
      // 1日を秒単位に変換 (24時間 * 60分 * 60秒)
      return Math.round(numberValue * 24 * 60 * 60);
    }

    // ヘッダー定義：Googleシートのヘッダー名 -> { fieldName, defaultIndex }
    const headerSchema = {
      曲名: { field: "title", defaultIndex: 2 },
      アーティスト: { field: "artist", defaultIndex: 3 },
      歌った人: { field: "sing", defaultIndex: 4 },
      動画: { field: "video", defaultIndex: 5 },
      start: { field: "start", defaultIndex: 6 },
      end: { field: "end", defaultIndex: 7 },
      配信日: { field: "broadcast_at", defaultIndex: 8 },
      "tags（カンマ区切り）": { field: "tags", defaultIndex: 9 },
      備考: { field: "extra", defaultIndex: 10 },
      マイルストーン: { field: "milestones", defaultIndex: 11 },
      アルバム: { field: "album", defaultIndex: 12 },
      アルバム発売日: { field: "album_release_at", defaultIndex: 13 },
      コンピレーションアルバム: {
        field: "album_is_compilation",
        defaultIndex: 14,
      },
      ライブコール: { field: "live_call", defaultIndex: 15 },
      ライブノート: { field: "live_note", defaultIndex: 16 },
    } as const;

    // ヘッダー行からインデックスを構築
    const headerRow = rows[0];
    const headerValues = headerRow?.values || [];
    const headerMap: Record<string, number> = {};

    headerValues.forEach((value, index) => {
      const header = value?.userEnteredValue?.stringValue;
      if (header && header in headerSchema) {
        headerMap[header] = index;
      }
    });

    // フィールドアクセス用のヘルパー関数
    const getHeaderIndex = (sheetHeader: string): number => {
      return (
        headerMap[sheetHeader] ??
        headerSchema[sheetHeader as keyof typeof headerSchema]?.defaultIndex ??
        -1
      );
    };

    const songs = rows
      .slice(1)
      .filter((row) => {
        // ヘッダー行を除外し、曲番号が空でない行のみをフィルタリング
        return (
          row.values &&
          // values[1]のcheckboxがtrueであることを確認
          row.values[1]?.userEnteredValue?.boolValue === true &&
          row.values[2]?.userEnteredValue?.stringValue
        );
      })
      .map((row) => {
        const values = row.values || [];

        const getString = (header: string) =>
          values[getHeaderIndex(header)]?.userEnteredValue?.stringValue || "";
        const getNumber = (header: string) =>
          values[getHeaderIndex(header)]?.userEnteredValue?.numberValue || 0;
        const getBoolean = (header: string) =>
          values[getHeaderIndex(header)]?.userEnteredValue?.boolValue || false;
        const getHyperlink = (header: string) =>
          values[getHeaderIndex(header)]?.hyperlink || "";

        const convertToDate = (numberValue: number) =>
          new Date(
            numberValue * 24 * 60 * 60 * 1000 + new Date(1899, 11, 30).getTime()
          ).toISOString();

        const videoHyperlink = getHyperlink("動画");
        const videoId =
          videoHyperlink.match(
            /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=|shorts\/))([^&\n]{11})/
          )?.[1] || "";

        return {
          title: getString("曲名"),
          artist: getString("アーティスト"),
          sing: getString("歌った人"),
          album: getString("アルバム"),
          album_list_uri: getHyperlink("アルバム"),
          album_release_at: getNumber("アルバム発売日")
            ? convertToDate(getNumber("アルバム発売日"))
            : "",
          album_is_compilation: getBoolean("コンピレーションアルバム"),
          video_title: getString("動画"),
          video_uri: videoHyperlink,
          video_id: videoId,
          start: parseTimeFromNumberValue(getNumber("start")),
          end: parseTimeFromNumberValue(getNumber("end")),
          broadcast_at: convertToDate(getNumber("配信日")),
          year: new Date(convertToDate(getNumber("配信日"))).getFullYear(),
          tags: getString("tags（カンマ区切り）")
            .split(",")
            .filter(Boolean)
            .map((tag) => tag.trim()),
          extra: getString("備考"),
          milestones: getString("マイルストーン")
            .split(",")
            .filter(Boolean)
            .map((val) => val.trim()),
          live_call: getString("ライブコール"),
          live_note: getString("ライブノート"),
        };
      })
      .sort((a, b) => {
        const isAlbum = "album" in a && a.album;
        if (isAlbum && "album" in b && b.album) {
          return (
            new Date(b.album_release_at).getTime() -
            new Date(a.album_release_at).getTime()
          );
        }
        return (
          new Date(b.broadcast_at).getTime() -
          new Date(a.broadcast_at).getTime()
        );
      });

    // VercelのCDNサーバーに結果をキャッシュさせる
    return NextResponse.json(songs, {
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
