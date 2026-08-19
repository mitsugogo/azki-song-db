import { prisma } from "./prisma";

export type SeichiMapProfileItem = {
  nickname: string;
  showNicknameInRanking: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertSeichiMapProfileInput = {
  userId: string;
  nickname: string;
  showNicknameInRanking: boolean;
};

const parseText = (value: unknown): string => String(value ?? "").trim();

export function validateSeichiMapProfileSettings(
  nicknameValue: unknown,
  showNicknameInRankingValue: unknown,
): { nickname: string; showNicknameInRanking: boolean } | { error: string } {
  const nickname = parseText(nicknameValue);
  if (!nickname) {
    return { error: "nickname は必須です" };
  }
  if (nickname.length > 40) {
    return { error: "nickname は40文字以内で入力してください" };
  }
  if (typeof showNicknameInRankingValue !== "boolean") {
    return { error: "showNicknameInRanking はbooleanで指定してください" };
  }
  return { nickname, showNicknameInRanking: showNicknameInRankingValue };
}

export function toSeichiMapProfileItem(record: {
  nickname: string;
  showNicknameInRanking: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SeichiMapProfileItem {
  return {
    nickname: record.nickname,
    showNicknameInRanking: record.showNicknameInRanking,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getSeichiMapProfileByUserId(
  userId: string,
): Promise<SeichiMapProfileItem | null> {
  const record = await prisma.seichiMapProfile.findUnique({
    where: { userId },
  });
  return record ? toSeichiMapProfileItem(record) : null;
}

export async function upsertSeichiMapProfile({
  userId,
  nickname,
  showNicknameInRanking,
}: UpsertSeichiMapProfileInput): Promise<SeichiMapProfileItem> {
  const now = new Date();
  const [profile] = await prisma.$transaction([
    prisma.seichiMapProfile.upsert({
      where: { userId },
      create: {
        userId,
        nickname,
        showNicknameInRanking,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        nickname,
        showNicknameInRanking,
        updatedAt: now,
      },
    }),
    prisma.seichiMapShare.updateMany({
      where: { userId },
      data: { nickname, updatedAt: now },
    }),
  ]);
  return toSeichiMapProfileItem(profile);
}
