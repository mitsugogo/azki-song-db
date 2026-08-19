import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueMock,
  profileUpsertMock,
  shareUpdateManyMock,
  transactionMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  profileUpsertMock: vi.fn(),
  shareUpdateManyMock: vi.fn(),
  transactionMock: vi.fn(async (operations: Promise<unknown>[]) =>
    Promise.all(operations),
  ),
}));

vi.mock("../prisma", () => ({
  prisma: {
    seichiMapProfile: {
      findUnique: findUniqueMock,
      upsert: profileUpsertMock,
    },
    seichiMapShare: {
      updateMany: shareUpdateManyMock,
    },
    $transaction: transactionMock,
  },
}));

import {
  getSeichiMapProfileByUserId,
  upsertSeichiMapProfile,
  validateSeichiMapProfileSettings,
} from "../seichiMapProfile";

describe("seichiMapProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ニックネームを整形し、ランキング公開設定を検証する", () => {
    expect(validateSeichiMapProfileSettings("  開拓者A  ", true)).toEqual({
      nickname: "開拓者A",
      showNicknameInRanking: true,
    });
    expect(validateSeichiMapProfileSettings("", true)).toEqual({
      error: "nickname は必須です",
    });
    expect(validateSeichiMapProfileSettings("a".repeat(41), true)).toEqual({
      error: "nickname は40文字以内で入力してください",
    });
    expect(validateSeichiMapProfileSettings("開拓者A", "true")).toEqual({
      error: "showNicknameInRanking はbooleanで指定してください",
    });
  });

  it("認証ユーザーのプロフィールから内部IDを除いた項目を返す", async () => {
    findUniqueMock.mockResolvedValue({
      userId: "internal-user-id",
      nickname: "開拓者A",
      showNicknameInRanking: false,
      createdAt: new Date("2026-08-19T00:00:00.000Z"),
      updatedAt: new Date("2026-08-19T01:00:00.000Z"),
    });

    await expect(
      getSeichiMapProfileByUserId("internal-user-id"),
    ).resolves.toEqual({
      nickname: "開拓者A",
      showNicknameInRanking: false,
      createdAt: "2026-08-19T00:00:00.000Z",
      updatedAt: "2026-08-19T01:00:00.000Z",
    });
  });

  it("プロフィール保存時に既存の共有ニックネームも同期する", async () => {
    profileUpsertMock.mockResolvedValue({
      userId: "user-1",
      nickname: "新しい名前",
      showNicknameInRanking: false,
      createdAt: new Date("2026-08-19T00:00:00.000Z"),
      updatedAt: new Date("2026-08-19T02:00:00.000Z"),
    });
    shareUpdateManyMock.mockResolvedValue({ count: 1 });

    await expect(
      upsertSeichiMapProfile({
        userId: "user-1",
        nickname: "新しい名前",
        showNicknameInRanking: false,
      }),
    ).resolves.toMatchObject({
      nickname: "新しい名前",
      showNicknameInRanking: false,
    });

    expect(profileUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        update: expect.objectContaining({
          nickname: "新しい名前",
          showNicknameInRanking: false,
        }),
      }),
    );
    expect(shareUpdateManyMock).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: expect.objectContaining({ nickname: "新しい名前" }),
    });
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });
});
