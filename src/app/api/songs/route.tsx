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
        "記念ライブ系!A:L",
        "オリ曲!A:Q",
        "カバー!A:O",
        "ゲスト・fesなど!A:L",
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

    // ヘッダー行からvalueのマッピングindexを決める
    const headerMappers = {
      "#": "num",
      Enable: "enable",
      曲名: "title",
      アーティスト: "artist",
      アルバム: "album",
      アルバム発売日: "album_release_at",
      コンピレーションアルバム: "album_is_compilation",
      歌った人: "sing",
      動画: "video",
      start: "start",
      end: "end",
      配信日: "broadcast_at",
      "tags（カンマ区切り）": "tags",
      備考: "extra",
      マイルストーン: "milestones",
      ライブコール: "live_call",
      ライブノート: "live_note",
    };
    // ヘッダー行だけ取得してみて、対応するindexを決める
    const headerRow = rows[0];
    const headerValues = headerRow?.values || [];
    const headerMap: Record<string, number> = {};
    headerValues.forEach((value, index) => {
      const header = value?.userEnteredValue?.stringValue;
      if (header) {
        // headerMapperから合致するものを探してindexを求める
        const mappedHeader = Object.entries(headerMappers).find(
          ([key]) => key === header
        );
        if (mappedHeader) {
          headerMap[mappedHeader[0]] = index;
        }
      }
    });

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
        return {
          title:
            values[headerMap["曲名"] ?? 2]?.userEnteredValue?.stringValue || "", // 曲名
          artist:
            values[headerMap["アーティスト"] ?? 3]?.userEnteredValue
              ?.stringValue || "", // アーティスト
          sing:
            values[headerMap["歌った人"] ?? 4]?.userEnteredValue?.stringValue ||
            "", // 歌った人
          album:
            values[headerMap["アルバム"] ?? 12]?.userEnteredValue
              ?.stringValue || "", // アルバム
          album_list_uri: values[headerMap["アルバム"] ?? 12]?.hyperlink || "",
          album_release_at: values[headerMap["アルバム発売日"] ?? 13]
            ?.userEnteredValue
            ? new Date(
                (values[headerMap["アルバム発売日"] ?? 13]?.userEnteredValue
                  ?.numberValue || 0) *
                  24 *
                  60 *
                  60 *
                  1000 +
                  new Date(1899, 11, 30).getTime()
              ).toISOString()
            : "", // アルバム発売日
          album_is_compilation:
            values[headerMap["コンピレーションアルバム"] ?? 14]
              ?.userEnteredValue?.boolValue || false, // コンピレーションアルバム
          video_title:
            values[headerMap["動画"] ?? 5]?.userEnteredValue?.stringValue || "", // 動画タイトル
          video_uri: values[headerMap["動画"] ?? 5]?.hyperlink || "", // ハイパーリンクURL
          video_id:
            values[headerMap["動画"] ?? 5]?.hyperlink?.match(
              /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=|shorts\/))([^&\n]{11})/
            )?.[1] || "", // 動画IDの抽出
          start: parseTimeFromNumberValue(
            values[headerMap["start"] ?? 6]?.userEnteredValue?.numberValue || 0
          ), // 開始時間 (秒)
          end: parseTimeFromNumberValue(
            values[headerMap["end"] ?? 7]?.userEnteredValue?.numberValue || 0
          ), // 終了時間 (秒)
          broadcast_at:
            new Date(
              (values[headerMap["配信日"] ?? 8]?.userEnteredValue
                ?.numberValue || 0) *
                24 *
                60 *
                60 *
                1000 +
                new Date(1899, 11, 30).getTime()
            ).toISOString() || "", // 放送日時
          tags:
            values[
              headerMap["tags（カンマ区切り）"] ?? 9
            ]?.userEnteredValue?.stringValue
              ?.split(",")
              .map((tag) => tag.trim()) || [], // タグをカンマ区切りで分割
          extra:
            values[headerMap["備考"] ?? 10]?.userEnteredValue?.stringValue ||
            "", // オプションのフィールド
          milestones:
            values[
              headerMap["マイルストーン"] ?? 11
            ]?.userEnteredValue?.stringValue
              ?.split(",")
              .map((val) => val.trim()) || [],

          live_call:
            values[headerMap["ライブコール"] ?? 15]?.userEnteredValue
              ?.stringValue || "",
          live_note:
            values[headerMap["ライブノート"] ?? 16]?.userEnteredValue
              ?.stringValue || "",
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
