import { prisma } from "./prisma";
import {
  loadSeichiMapVisitedRows,
  toSeichiMapVisitedItem,
  toSeichiMapVisitedWriteError,
} from "./seichiMapVisitedSheet";

export type SeichiMapShareItem = {
  shareId: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
};

type UpsertSeichiMapShareInput = {
  userId: string;
  nickname: string;
};

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseText = (value: unknown): string => String(value ?? "").trim();

export function validateSeichiMapShareId(value: string | null): string | null {
  const shareId = parseText(value).toLowerCase();
  return UUID_V4_PATTERN.test(shareId) ? shareId : null;
}

export function validateSeichiMapShareNickname(
  value: unknown,
): { nickname: string } | { error: string } {
  const nickname = parseText(value);
  if (!nickname) {
    return { error: "nickname は必須です" };
  }
  if (nickname.length > 40) {
    return { error: "nickname は40文字以内で入力してください" };
  }
  return { nickname };
}

export function toSeichiMapShareItem(record: {
  shareId: string;
  nickname: string;
  createdAt: Date;
  updatedAt: Date;
}): SeichiMapShareItem {
  return {
    shareId: record.shareId,
    nickname: record.nickname,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getSeichiMapShareByUserId(
  userId: string,
): Promise<SeichiMapShareItem | null> {
  const record = await prisma.seichiMapShare.findFirst({
    where: { userId },
  });

  return record ? toSeichiMapShareItem(record) : null;
}

export async function getSeichiMapShareByShareId(
  shareId: string,
): Promise<SeichiMapShareItem | null> {
  const record = await prisma.seichiMapShare.findUnique({
    where: { shareId },
  });

  return record ? toSeichiMapShareItem(record) : null;
}

export async function getSeichiMapSharedVisits(shareId: string) {
  const share = await prisma.seichiMapShare.findUnique({
    where: { shareId },
  });

  if (!share) {
    return null;
  }

  const visitedRows = await loadSeichiMapVisitedRows(share.userId);

  return {
    share: toSeichiMapShareItem(share),
    items: visitedRows.map(toSeichiMapVisitedItem),
  };
}

export async function upsertSeichiMapShare({
  userId,
  nickname,
}: UpsertSeichiMapShareInput): Promise<SeichiMapShareItem> {
  const existing = await prisma.seichiMapShare.findFirst({
    where: { userId },
  });
  const now = new Date();

  if (existing) {
    const updated = await prisma.seichiMapShare.update({
      where: { shareId: existing.shareId },
      data: {
        nickname,
        updatedAt: now,
      },
    });
    return toSeichiMapShareItem(updated);
  }

  const shareId = crypto.randomUUID();
  const created = await prisma.seichiMapShare.create({
    data: {
      shareId,
      userId,
      nickname,
      createdAt: now,
      updatedAt: now,
    },
  });

  return toSeichiMapShareItem(created);
}

export async function deleteSeichiMapShareByUserId(
  userId: string,
): Promise<boolean> {
  const result = await prisma.seichiMapShare.deleteMany({
    where: { userId },
  });
  return result.count > 0;
}

export { toSeichiMapVisitedWriteError };
