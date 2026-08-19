import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  sessionMock,
  getProfileMock,
  upsertProfileMock,
  validateProfileMock,
  deleteShareMock,
  upsertShareMock,
} = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  getProfileMock: vi.fn(),
  upsertProfileMock: vi.fn(),
  validateProfileMock: vi.fn(),
  deleteShareMock: vi.fn(),
  upsertShareMock: vi.fn(),
}));

vi.mock("@/app/lib/authSession", () => ({
  getOptionalServerSession: sessionMock,
}));

vi.mock("@/app/lib/seichiMapProfile", () => ({
  getSeichiMapProfileByUserId: getProfileMock,
  upsertSeichiMapProfile: upsertProfileMock,
  validateSeichiMapProfileSettings: validateProfileMock,
}));

vi.mock("@/app/lib/seichiMapShareSheet", () => ({
  deleteSeichiMapShareByUserId: deleteShareMock,
  getSeichiMapSharedVisits: vi.fn(),
  getSeichiMapShareByUserId: vi.fn(),
  toSeichiMapVisitedWriteError: () => ({
    status: 500,
    message: "保存に失敗しました",
  }),
  upsertSeichiMapShare: upsertShareMock,
  validateSeichiMapShareId: vi.fn(() => null),
}));

import { DELETE, POST } from "../route";

const profile = {
  nickname: "開拓者A",
  showNicknameInRanking: false,
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
};

const share = {
  shareId: "00000000-0000-4000-8000-000000000001",
  nickname: "開拓者A",
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
};

describe("seichi-map share route profile integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue({ user: { id: "user-1" } });
    getProfileMock.mockResolvedValue(null);
    validateProfileMock.mockReturnValue({
      nickname: "開拓者A",
      showNicknameInRanking: false,
    });
    upsertProfileMock.mockResolvedValue(profile);
    upsertShareMock.mockResolvedValue(share);
    deleteShareMock.mockResolvedValue(true);
  });

  it("共有保存時にランキング公開設定を含むプロフィールも保存する", async () => {
    const response = await POST(
      new Request("http://localhost/api/seichi-map/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: "開拓者A",
          showNicknameInRanking: false,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ item: share, profile });
    expect(validateProfileMock).toHaveBeenCalledWith("開拓者A", false);
    expect(upsertProfileMock).toHaveBeenCalledWith({
      userId: "user-1",
      nickname: "開拓者A",
      showNicknameInRanking: false,
    });
    expect(upsertShareMock).toHaveBeenCalledWith({
      userId: "user-1",
      nickname: "開拓者A",
    });
  });

  it("既存クライアントが公開設定を省略した場合は現在値を維持する", async () => {
    getProfileMock.mockResolvedValue(profile);

    await POST(
      new Request("http://localhost/api/seichi-map/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: "開拓者A" }),
      }),
    );

    expect(validateProfileMock).toHaveBeenCalledWith("開拓者A", false);
  });

  it("共有停止では共有レコードだけを削除しプロフィールを維持する", async () => {
    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(deleteShareMock).toHaveBeenCalledWith("user-1");
    expect(upsertProfileMock).not.toHaveBeenCalled();
  });
});
