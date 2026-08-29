import { join, sqltag } from "@prisma/client/runtime/client";
import { prisma } from "./prisma";

export const SEICHI_MAP_RANKING_LIMIT = 100;

export type SeichiMapVisitedRow = {
  id: string;
  userId: string;
  locationName: string;
  visitedAt: string;
  note: string;
  updatedAt: string;
  url: string;
  locationId: string;
};

export type SeichiMapVisitedItem = Omit<SeichiMapVisitedRow, "userId">;

export type SeichiMapLocationVisitorRankingRow = {
  locationId: string;
  uniqueVisitorCount: number;
};

export type SeichiMapLocationVisitorSummary = {
  uniqueVisitorCount: number;
  singleVisitorNickname: string | null;
};

export type SeichiMapVisitorRankingItem = {
  nickname: string | null;
  visitCount: number;
};

export type UpsertSeichiMapVisitedBody = {
  id?: string;
  locationId?: string;
  locationName?: string;
  visitedAt?: string;
  note?: string;
  url?: string;
};

type GoogleApiLikeError = {
  status?: number;
  code?: number;
  response?: { status?: number };
  cause?: { message?: string };
  message?: string;
};

const parseText = (value: unknown): string => String(value ?? "").trim();

const toIsoDate = (value?: string): string => {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
};

export type ValidatedSeichiMapVisitedBody = {
  locationId: string;
  locationName: string;
  visitedAt: string;
  note: string;
  url: string;
};

export function validateSeichiMapVisitedBody(
  body: UpsertSeichiMapVisitedBody,
): ValidatedSeichiMapVisitedBody | { error: string } {
  const locationName = parseText(body.locationName);
  if (!locationName) {
    return { error: "locationName は必須です" };
  }
  if (locationName.length > 160) {
    return { error: "locationName は160文字以内で入力してください" };
  }

  const locationId = parseText(body.locationId);
  if (locationId && !/^[0-9a-f]{16}$/.test(locationId)) {
    return { error: "locationId の形式が不正です" };
  }

  const note = parseText(body.note);
  if (note.length > 500) {
    return { error: "note は500文字以内で入力してください" };
  }

  const url = parseText(body.url);
  if (url.length > 2000) {
    return { error: "url は2000文字以内で入力してください" };
  }
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { error: "url は http/https の形式で入力してください" };
      }
    } catch {
      return { error: "url の形式が不正です" };
    }
  }

  return {
    locationId,
    locationName,
    note,
    visitedAt: toIsoDate(body.visitedAt),
    url,
  };
}

export function toSeichiMapVisitedItem(
  row: SeichiMapVisitedRow,
): SeichiMapVisitedItem {
  return {
    id: row.id,
    locationName: row.locationName,
    visitedAt: row.visitedAt,
    note: row.note,
    updatedAt: row.updatedAt,
    url: row.url,
    locationId: row.locationId,
  };
}

export async function loadSeichiMapVisitedRows(
  userId?: string,
): Promise<SeichiMapVisitedRow[]> {
  const records = await prisma.seichiMapVisited.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { visitedAt: "desc" },
  });

  return records.map((record) => ({
    id: record.id,
    userId: record.userId,
    locationName: record.locationName,
    visitedAt: record.visitedAt.toISOString(),
    note: record.note ?? "",
    updatedAt: record.updatedAt.toISOString(),
    url: record.url ?? "",
    locationId: record.locationId ?? "",
  }));
}

export async function loadSeichiMapLocationVisitorSummaries(): Promise<
  Record<string, SeichiMapLocationVisitorSummary>
> {
  const rows = await prisma.$queryRaw<
    {
      locationId: string;
      uniqueVisitorCount: bigint;
      singleVisitorNickname: string | null;
    }[]
  >`
    SELECT
      visited.locationId,
      COUNT(DISTINCT visited.userId) AS uniqueVisitorCount,
      CASE
        WHEN COUNT(DISTINCT visited.userId) = 1 THEN
          MAX(
            CASE
              WHEN profile.showNicknameInRanking THEN profile.nickname
              ELSE NULL
            END
          )
        ELSE NULL
      END AS singleVisitorNickname
    FROM SeichiMapVisited AS visited
    LEFT JOIN SeichiMapProfile AS profile ON profile.userId = visited.userId
    WHERE visited.locationId IS NOT NULL AND visited.locationId <> ''
    GROUP BY visited.locationId
  `;

  return Object.fromEntries(
    rows.map(({ locationId, uniqueVisitorCount, singleVisitorNickname }) => {
      const count = Number(uniqueVisitorCount);
      return [
        locationId,
        {
          uniqueVisitorCount: count,
          singleVisitorNickname:
            count === 1 ? (singleVisitorNickname ?? null) : null,
        },
      ];
    }),
  );
}

export async function loadSeichiMapUserCount(): Promise<number> {
  const [row] = await prisma.$queryRaw<{ userCount: bigint }[]>`
    SELECT COUNT(DISTINCT userId) AS userCount
    FROM SeichiMapVisited
  `;

  return Number(row?.userCount ?? 0);
}

export async function loadSeichiMapLocationVisitorRanking(): Promise<
  SeichiMapLocationVisitorRankingRow[]
> {
  const rows = await prisma.$queryRaw<
    { locationId: string; uniqueVisitorCount: bigint }[]
  >`
    SELECT locationId, COUNT(DISTINCT userId) AS uniqueVisitorCount
    FROM SeichiMapVisited
    WHERE locationId IS NOT NULL AND locationId <> ''
    GROUP BY locationId
  `;

  return rows.map(({ locationId, uniqueVisitorCount }) => ({
    locationId,
    uniqueVisitorCount: Number(uniqueVisitorCount),
  }));
}

export async function loadSeichiMapVisitorRanking(
  currentLocationIds: readonly string[],
): Promise<SeichiMapVisitorRankingItem[]> {
  const locationIds = [...new Set(currentLocationIds.filter(Boolean))];
  if (locationIds.length === 0) return [];

  const rows = await prisma.$queryRaw<
    { nickname: string | null; visitCount: bigint }[]
  >(sqltag`
    SELECT
      (
        SELECT CASE
          WHEN showNicknameInRanking THEN nickname
          ELSE NULL
        END
        FROM SeichiMapProfile
        WHERE SeichiMapProfile.userId = SeichiMapVisited.userId
        LIMIT 1
      ) AS nickname,
      COUNT(DISTINCT locationId) AS visitCount
    FROM SeichiMapVisited
    WHERE locationId IN (${join(locationIds)})
    GROUP BY userId
    ORDER BY visitCount DESC, nickname ASC, userId ASC
    LIMIT ${SEICHI_MAP_RANKING_LIMIT}
  `);

  return rows.map(({ nickname, visitCount }) => ({
    nickname,
    visitCount: Number(visitCount),
  }));
}

export async function createSeichiMapVisited(
  userId: string,
  body: ValidatedSeichiMapVisitedBody,
): Promise<SeichiMapVisitedItem> {
  const now = new Date();
  const record = await prisma.seichiMapVisited.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      locationName: body.locationName,
      visitedAt: new Date(body.visitedAt),
      note: body.note || null,
      updatedAt: now,
      url: body.url || null,
      locationId: body.locationId || null,
    },
  });

  return toSeichiMapVisitedItem({
    id: record.id,
    userId: record.userId,
    locationName: record.locationName,
    visitedAt: record.visitedAt.toISOString(),
    note: record.note ?? "",
    updatedAt: record.updatedAt.toISOString(),
    url: record.url ?? "",
    locationId: record.locationId ?? "",
  });
}

export async function updateSeichiMapVisited(
  id: string,
  userId: string,
  body: ValidatedSeichiMapVisitedBody,
): Promise<SeichiMapVisitedItem | null> {
  const existing = await prisma.seichiMapVisited.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== userId) {
    return null;
  }

  const record = await prisma.seichiMapVisited.update({
    where: { id },
    data: {
      locationName: body.locationName,
      visitedAt: new Date(body.visitedAt),
      note: body.note || null,
      updatedAt: new Date(),
      url: body.url || null,
      locationId: body.locationId || null,
    },
  });

  return toSeichiMapVisitedItem({
    id: record.id,
    userId: record.userId,
    locationName: record.locationName,
    visitedAt: record.visitedAt.toISOString(),
    note: record.note ?? "",
    updatedAt: record.updatedAt.toISOString(),
    url: record.url ?? "",
    locationId: record.locationId ?? "",
  });
}

export async function deleteSeichiMapVisited(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.seichiMapVisited.deleteMany({
    where: { id, userId },
  });

  return result.count > 0;
}

export function toSeichiMapVisitedWriteError(error: unknown): {
  status: number;
  message: string;
  detail?: string;
} {
  const maybeError = error as GoogleApiLikeError;
  const status =
    typeof maybeError.status === "number"
      ? maybeError.status
      : typeof maybeError.code === "number"
        ? maybeError.code
        : typeof maybeError.response?.status === "number"
          ? maybeError.response.status
          : 500;
  const detail =
    maybeError.cause?.message || maybeError.message || "unknown error";

  if (status === 401) {
    return {
      status: 401,
      message: "認証エラーです。再ログインしてください",
      detail,
    };
  }

  return {
    status: Number.isFinite(status) ? status : 500,
    message: "データの保存に失敗しました",
    detail,
  };
}
