import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";
import { Locale } from "@/app/types/locale";

type HeaderKey = "date" | "content" | "content_en" | "note" | "note_en" | "url";

type HeaderDefinition = {
  key: HeaderKey;
  aliases: string[];
};

export async function GET(request: Request) {
  try {
    const localeParam = new URL(request.url).searchParams.get("hl");
    const localeCode = localeParam?.toLowerCase().split("-")[0];
    const locale: Locale = localeCode === "en" ? "en" : "ja";

    const sheets = google.sheets({
      version: "v4",
      auth: process.env.GOOGLE_API_KEY,
    });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: ["milestones!A:F"],
      includeGridData: true,
      fields:
        "sheets(properties/title,data/rowData/values(userEnteredValue,hyperlink,formattedValue))",
    });

    const sheet = response.data.sheets?.[0];
    const rows: sheets_v4.Schema$RowData[] = sheet?.data?.[0]?.rowData || [];

    // ヘッダー正規化
    const normalize = (s: string | undefined | null) =>
      String(s || "")
        .replace(/[（）\(\)\s\?\？\.,，、!！]/g, "")
        .toLowerCase();

    const HEADER_SCHEMA: HeaderDefinition[] = [
      { key: "date", aliases: ["日付", "date", "日"] },
      { key: "content", aliases: ["内容", "content"] },
      { key: "content_en", aliases: ["内容_en", "content(en)", "content_en"] },
      { key: "note", aliases: ["備考", "note", "extra"] },
      { key: "note_en", aliases: ["備考_en", "note(en)", "note_en"] },
      { key: "url", aliases: ["url", "リンク", "url(リンク)", "URL"] },
    ];

    // 1行目をヘッダーとして列マップ作成
    const headerValues = rows[0]?.values || [];
    const colMap: Record<HeaderKey, number> = {
      date: -1,
      content: -1,
      content_en: -1,
      note: -1,
      note_en: -1,
      url: -1,
    };
    HEADER_SCHEMA.forEach((def) => {
      const index = headerValues.findIndex((cell) => {
        const cellStr =
          cell?.userEnteredValue?.stringValue || cell?.formattedValue || "";
        return def.aliases.some(
          (alias) => normalize(alias) === normalize(cellStr),
        );
      });
      colMap[def.key] = index; // 見つからない場合は -1
    });

    const convertToDate = (numberValue: number) => {
      if (!numberValue) return "";
      return new Date(
        numberValue * 24 * 60 * 60 * 1000 + new Date(1899, 11, 30).getTime(),
      ).toISOString();
    };

    const items: any[] = [];

    rows.slice(1).forEach((row) => {
      const vals = row.values || [];

      const getStr = (key: HeaderKey) => {
        const i = colMap[key];
        return i !== -1 && vals[i]
          ? vals[i].userEnteredValue?.stringValue ||
              vals[i].formattedValue ||
              ""
          : "";
      };
      const getNum = (key: HeaderKey) => {
        const i = colMap[key];
        return i !== -1 && vals[i]
          ? (vals[i].userEnteredValue?.numberValue ?? 0)
          : 0;
      };
      const getLink = (key: HeaderKey) => {
        const i = colMap[key];
        return i !== -1 && vals[i]
          ? vals[i].hyperlink || vals[i].formattedValue || ""
          : "";
      };

      const rawDateNum = getNum("date");
      const dateStr = rawDateNum ? convertToDate(rawDateNum) : getStr("date");
      const content = getStr("content");
      const contentEn = getStr("content_en");
      const localizedContent =
        locale === "en" && contentEn ? contentEn : content;
      const note = getStr("note");
      const noteEn = getStr("note_en");
      const localizedNote = locale === "en" && noteEn ? noteEn : note;
      const url = getLink("url");

      // 日付か内容のいずれかがある行だけ取り込む
      if (!dateStr && !localizedContent) return;

      items.push({
        date: dateStr,
        content: localizedContent,
        note: localizedNote,
        url,
      });
    });

    const now = new Date();
    return NextResponse.json(items, {
      headers: {
        "Cache-Control":
          "public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=300",
        "Vercel-Cache-Tag": buildVercelCacheTagHeader([
          cacheTags.coreDataset,
          cacheTags.milestones,
          cacheTags.milestonesList,
        ]),
        "x-data-updated": now.toISOString(),
        "Last-Modified": now.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error fetching milestones from Google Sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 },
    );
  }
}
