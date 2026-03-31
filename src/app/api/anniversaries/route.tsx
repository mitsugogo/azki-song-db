import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";
import { AnniversaryItem } from "@/app/types/anniversaryItem";
import { Locale } from "@/app/types/locale";

type HeaderKey =
  | "date"
  | "first_date"
  | "name"
  | "name_en"
  | "url"
  | "note"
  | "note_en";

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
      ranges: ["Anniversary!A2:G"],
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
      { key: "first_date", aliases: ["初回日", "first date", "first_date"] },
      { key: "name", aliases: ["名称", "name"] },
      { key: "name_en", aliases: ["名称(英)", "name(en)", "name_en"] },
      { key: "url", aliases: ["url", "リンク", "url(リンク)", "URL"] },
      { key: "note", aliases: ["備考", "note", "extra"] },
      { key: "note_en", aliases: ["備考(英)", "note(en)", "note_en"] },
    ];

    // 1行目をヘッダーとして列マップ作成
    const headerValues = rows[0]?.values || [];
    const colMap: Record<HeaderKey, number> = {
      date: -1,
      first_date: -1,
      name: -1,
      name_en: -1,
      url: -1,
      note: -1,
      note_en: -1,
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

    // Excel/Sheets serial -> ISO (JST midnight) helper
    const excelSerialToJstIso = (
      numberValue: number,
      overrideYear?: number,
    ) => {
      if (!numberValue) return "";
      const JST_OFFSET = 9 * 60 * 60 * 1000; // JST = UTC+9
      const DAY_MS = 24 * 60 * 60 * 1000;
      const baseUtc = Date.UTC(1899, 11, 30); // 1899-12-30 UTC base for Excel serial

      // Get UTC date components for the serial value
      const d = new Date(baseUtc + Math.round(numberValue * DAY_MS));
      const year = overrideYear ?? d.getUTCFullYear();
      const month = d.getUTCMonth();
      const day = d.getUTCDate();

      // Build a timestamp that represents JST midnight for that calendar date
      const targetUtcMs = Date.UTC(year, month, day) - JST_OFFSET;
      return new Date(targetUtcMs).toISOString();
    };

    const items: AnniversaryItem[] = [];

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

      const name = getStr("name");
      const name_en = getStr("name_en");
      const localizedName = locale === "en" && name_en ? name_en : name;
      const note = getStr("note");
      const note_en = getStr("note_en");
      const localizedNote = locale === "en" && note_en ? note_en : note;
      items.push({
        // JST基準でMM/DD形式にする
        date: new Date(excelSerialToJstIso(getNum("date")))
          .toLocaleDateString("ja-JP", {
            timeZone: "Asia/Tokyo",
            month: "2-digit",
            day: "2-digit",
          })
          .replace(/\//g, "/"),
        first_date_at: excelSerialToJstIso(getNum("first_date")),

        name: localizedName,
        url: getLink("url"),
        note: localizedNote,
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
