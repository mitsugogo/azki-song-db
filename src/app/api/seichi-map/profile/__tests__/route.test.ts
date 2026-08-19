import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionMock, getProfileMock, upsertProfileMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  getProfileMock: vi.fn(),
  upsertProfileMock: vi.fn(),
}));

vi.mock("@/app/lib/authSession", () => ({
  getOptionalServerSession: sessionMock,
}));

vi.mock("@/app/lib/seichiMapProfile", async () => {
  const actual = await vi.importActual<
    typeof import("@/app/lib/seichiMapProfile")
  >("@/app/lib/seichiMapProfile");
  return {
    ...actual,
    getSeichiMapProfileByUserId: getProfileMock,
    upsertSeichiMapProfile: upsertProfileMock,
  };
});

vi.mock("@/app/lib/seichiMapVisitedSheet", () => ({
  toSeichiMapVisitedWriteError: () => ({
    status: 500,
    message: "保存に失敗しました",
  }),
}));

import { GET, POST } from "../route";

const profile = {
  nickname: "開拓者A",
  showNicknameInRanking: true,
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
};

describe("seichi-map profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue({ user: { id: "user-1" } });
    getProfileMock.mockResolvedValue(profile);
    upsertProfileMock.mockResolvedValue(profile);
  });

  it("未ログインではプロフィールを返さない", async () => {
    sessionMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(getProfileMock).not.toHaveBeenCalled();
  });

  it("内部のuserIdを含めずプロフィールを返す", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ item: profile });
    expect(JSON.stringify(data)).not.toContain("user-1");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("公開設定を含むプロフィールを保存する", async () => {
    const response = await POST(
      new Request("http://localhost/api/seichi-map/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: " 開拓者A ",
          showNicknameInRanking: false,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(upsertProfileMock).toHaveBeenCalledWith({
      userId: "user-1",
      nickname: "開拓者A",
      showNicknameInRanking: false,
    });
  });

  it("空のニックネームを拒否する", async () => {
    const response = await POST(
      new Request("http://localhost/api/seichi-map/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: " ", showNicknameInRanking: true }),
      }),
    );

    expect(response.status).toBe(400);
    expect(upsertProfileMock).not.toHaveBeenCalled();
  });
});
