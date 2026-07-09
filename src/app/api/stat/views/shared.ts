import { prisma } from "@/app/lib/prisma";
import { Period, VALID_PERIODS, ViewStat } from "@/app/types/api/stat/views";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function buildJstBoundaryDate(period: Period): Date {
  const dateString = getGSDate(period);
  return new Date(`${dateString}T00:00:00+09:00`);
}

function sortByDatetimeAsc(stats: ViewStat[]) {
  return [...stats].sort((a, b) => {
    const aTime = a.datetime ? a.datetime.getTime() : 0;
    const bTime = b.datetime ? b.datetime.getTime() : 0;
    return aTime - bTime;
  });
}

function toViewStat(row: {
  datetime: Date | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
}): ViewStat {
  return {
    datetime: row.datetime,
    viewCount: Number(row.viewCount ?? 0),
    likeCount: Number(row.likeCount ?? 0),
    commentCount: Number(row.commentCount ?? 0),
  };
}

function parseRowsByVideoId(
  rows: Array<{
    datetime: Date | null;
    viewCount: number | null;
    likeCount: number | null;
    commentCount: number | null;
    videoId: string | null;
  }>,
  videoIds: string[],
) {
  const grouped: Record<string, ViewStat[]> = Object.fromEntries(
    videoIds.map((videoId) => [videoId, []]),
  );

  rows.forEach((row) => {
    const videoId = row.videoId;
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

  const where: Record<string, unknown> = {
    videoId: { in: uniqueVideoIds },
  };

  if (period && period !== "all") {
    where.datetime = {
      gte: buildJstBoundaryDate(period),
    };
  }

  const rows = await prisma.statistics.findMany({
    where,
    orderBy: { datetime: "asc" },
    select: {
      videoId: true,
      datetime: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
    },
  });

  return parseRowsByVideoId(rows, uniqueVideoIds);
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
