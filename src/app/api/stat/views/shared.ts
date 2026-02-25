import { Period, VALID_PERIODS, ViewStat } from "@/app/types/api/stat/views";
import { cacheTags } from "@/app/lib/cacheTags";

const SHEET_NAME = "statistics";
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function escapeQueryValue(value: string) {
  return value.replace(/'/g, "''");
}

function buildWhereClause(videoIds: string[]) {
  return videoIds
    .map((videoId) => `G = '${escapeQueryValue(videoId)}'`)
    .join(" OR ");
}

function buildQuery(videoIds: string[], period?: Period) {
  const whereClause = buildWhereClause(videoIds);
  const periodClause = period ? ` AND A >= date '${getGSDate(period)}'` : "";
  return `SELECT * WHERE (${whereClause})${periodClause}`;
}

function buildRequestUrl(query: string) {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const apiKey = process.env.GOOGLE_API_KEY;
  const encodedQuery = encodeURIComponent(query);
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&tq=${encodedQuery}&sheet=${SHEET_NAME}&key=${apiKey}`;
}

function parseGvizPayload(text: string) {
  const jsonStr = text.match(
    /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/,
  );
  if (!jsonStr) return null;
  return JSON.parse(jsonStr[1]);
}

function sortByDatetimeAsc(stats: ViewStat[]) {
  return [...stats].sort((a, b) => {
    const aTime = a.datetime ? new Date(a.datetime).getTime() : 0;
    const bTime = b.datetime ? new Date(b.datetime).getTime() : 0;
    return aTime - bTime;
  });
}

function toViewStat(row: any): ViewStat {
  return {
    datetime: parseGoogleDate(row.c[0]?.v),
    viewCount: row.c[3]?.v,
    likeCount: row.c[4]?.v,
    commentCount: row.c[5]?.v,
  } as ViewStat;
}

function parseRowsByVideoId(rows: any[], videoIds: string[]) {
  const grouped: Record<string, ViewStat[]> = Object.fromEntries(
    videoIds.map((videoId) => [videoId, []]),
  );

  rows.forEach((row) => {
    const videoId = row.c[6]?.v;
    if (!videoId || !grouped[videoId]) return;
    grouped[videoId].push(toViewStat(row));
  });

  Object.keys(grouped).forEach((videoId) => {
    grouped[videoId] = sortByDatetimeAsc(grouped[videoId]);
  });

  return grouped;
}

export function parsePeriod(period: string | null): Period | null {
  if (!period) return null;
  if (!VALID_PERIODS.includes(period as Period)) return null;
  return period as Period;
}

export function isValidPeriod(period: string | null) {
  if (!period) return true;
  return VALID_PERIODS.includes(period as Period);
}

export async function getStatisticsByVideoIds(
  videoIds: string[],
  period?: Period,
) {
  const uniqueVideoIds = [...new Set(videoIds.filter(Boolean))];
  if (uniqueVideoIds.length === 0) return {};

  const query = buildQuery(uniqueVideoIds, period);
  const url = buildRequestUrl(query);

  try {
    const response = await fetch(url, {
      next: {
        revalidate: 60,
        tags: [cacheTags.statViews, cacheTags.statViewsList],
      },
    });
    const text = await response.text();
    const data = parseGvizPayload(text);
    if (!data) return null;

    if (data.status === "error") {
      console.error("Query Error:", data.errors);
      return null;
    }

    return parseRowsByVideoId(data.table.rows || [], uniqueVideoIds);
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

export async function getStatisticsByVideoId(videoId: string, period?: Period) {
  const grouped = await getStatisticsByVideoIds([videoId], period);
  if (!grouped) return null;
  return grouped[videoId] || [];
}

function getGSDate(period: Period): string {
  if (period === "all") {
    return "1970-01-01";
  }

  const nowAsJst = new Date(Date.now() + JST_OFFSET_MS);
  let pastDateAsJst: Date;
  switch (period) {
    case "1d":
      pastDateAsJst = new Date(nowAsJst.getTime() - 1 * 24 * 60 * 60 * 1000);
      break;
    case "3d":
      pastDateAsJst = new Date(nowAsJst.getTime() - 3 * 24 * 60 * 60 * 1000);
      break;
    case "7d":
      pastDateAsJst = new Date(nowAsJst.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      pastDateAsJst = new Date(nowAsJst.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      pastDateAsJst = new Date(nowAsJst.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "180d":
      pastDateAsJst = new Date(nowAsJst.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case "365d":
    case "1y":
      pastDateAsJst = new Date(nowAsJst.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      pastDateAsJst = new Date(0);
      break;
  }
  return pastDateAsJst.toISOString().split("T")[0];
}

function parseGoogleDate(dateStr: string): Date | null {
  const match = String(dateStr || "").match(/\((.+)\)/);
  if (!match) return null;

  const parts = match[1].split(",").map(Number);
  const jstMs = Date.UTC(
    parts[0],
    parts[1],
    parts[2],
    parts[3] || 0,
    parts[4] || 0,
    parts[5] || 0,
  );
  return new Date(jstMs - JST_OFFSET_MS);
}
