import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";
import { Locale } from "@/app/types/locale";
import { EventItem } from "@/app/types/eventItem";

type HeaderKey =
  | "enable"
  | "start"
  | "end"
  | "content"
  | "content_en"
  | "place"
  | "place_en"
  | "note"
  | "note_en"
  | "url";

type HeaderDefinition = {
  key: HeaderKey;
  aliases: string[];
};

const normalize = (s: string | undefined | null) =>
  String(s || "")
    .replace(/[（）\(\)\s\?？\.,，、!！_]/g, "")
    .toLowerCase();

const HEADER_SCHEMA: HeaderDefinition[] = [
  { key: "enable", aliases: ["enable", "enabled", "表示", "有効"] },
  { key: "start", aliases: ["start", "startdate", "開始", "開始日"] },
  { key: "end", aliases: ["end", "enddate", "終了", "終了日"] },
  { key: "content", aliases: ["内容", "content"] },
  { key: "place", aliases: ["場所", "place"] },
  {
    key: "place_en",
    aliases: ["場所en", "場所_en", "placeen", "place(en)", "place_en"],
  },
  {
    key: "content_en",
    aliases: ["内容en", "内容_en", "contenten", "content(en)", "content_en"],
  },
  { key: "note", aliases: ["備考", "note", "extra"] },
  {
    key: "note_en",
    aliases: ["備考en", "備考_en", "noteen", "note(en)", "note_en"],
  },
  { key: "url", aliases: ["url", "リンク", "url(リンク)", "URL"] },
];

const jstOffsetMs = 9 * 60 * 60 * 1000;
const dayMs = 24 * 60 * 60 * 1000;
const excelEpochUtcMs = Date.UTC(1899, 11, 30);

const excelSerialToJstIso = (numberValue: number) => {
  if (!numberValue) {
    return "";
  }

  const date = new Date(excelEpochUtcMs + Math.round(numberValue * dayMs));
  const utcMs =
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
    jstOffsetMs;
  return new Date(utcMs).toISOString();
};

const parseStringDateToJstIso = (value: string) => {
  const raw = value.trim();
  if (!raw) {
    return "";
  }

  const dateOnlyMatch = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const utcMs = Date.UTC(year, month - 1, day) - jstOffsetMs;
    return new Date(utcMs).toISOString();
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString();
};

const normalizeBoolean = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return !["false", "0", "off", "no", "disabled", "無効"].includes(normalized);
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
      ranges: ["events!A:J"],
      includeGridData: true,
      fields:
        "sheets(properties/title,data/rowData/values(userEnteredValue,hyperlink,formattedValue))",
    });

    const sheet = response.data.sheets?.[0];
    const rows: sheets_v4.Schema$RowData[] = sheet?.data?.[0]?.rowData || [];
    const headerValues = rows[0]?.values || [];

    const colMap: Record<HeaderKey, number> = {
      enable: -1,
      start: -1,
      end: -1,
      content: -1,
      content_en: -1,
      place: -1,
      place_en: -1,
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
      colMap[def.key] = index;
    });

    const items: EventItem[] = [];

    rows.slice(1).forEach((row) => {
      const values = row.values || [];

      const getString = (key: HeaderKey) => {
        const index = colMap[key];
        return index !== -1 && values[index]
          ? values[index].userEnteredValue?.stringValue ||
              values[index].formattedValue ||
              ""
          : "";
      };

      const getNumber = (key: HeaderKey) => {
        const index = colMap[key];
        return index !== -1 && values[index]
          ? (values[index].userEnteredValue?.numberValue ?? 0)
          : 0;
      };

      const getLink = (key: HeaderKey) => {
        const index = colMap[key];
        return index !== -1 && values[index]
          ? values[index].hyperlink || values[index].formattedValue || ""
          : "";
      };

      const enabled = normalizeBoolean(getString("enable"));
      if (!enabled) {
        return;
      }

      const startAt = getNumber("start")
        ? excelSerialToJstIso(getNumber("start"))
        : parseStringDateToJstIso(getString("start"));
      const endAt = getNumber("end")
        ? excelSerialToJstIso(getNumber("end"))
        : parseStringDateToJstIso(getString("end"));

      const content = getString("content");
      const contentEn = getString("content_en");
      const place = getString("place");
      const placeEn = getString("place_en");
      const note = getString("note");
      const noteEn = getString("note_en");
      const localizedContent =
        locale === "en" && contentEn ? contentEn : content;
      const localizedPlace = locale === "en" && placeEn ? placeEn : place;
      const localizedNote = locale === "en" && noteEn ? noteEn : note;
      const url = getLink("url");

      if (!startAt || !localizedContent) {
        return;
      }

      items.push({
        start_at: startAt,
        end_at: endAt,
        content: localizedContent,
        place: localizedPlace,
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
          cacheTags.events,
          cacheTags.eventsList,
        ]),
        "x-data-updated": now.toISOString(),
        "Last-Modified": now.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error fetching events from Google Sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
