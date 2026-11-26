import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionMock, setTitleMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  setTitleMock: vi.fn(),
}));

vi.mock("@/app/lib/authSession", () => ({
  getOptionalServerSession: sessionMock,
}));

vi.mock("@/app/lib/server/seichiMapAchievements", () => ({
  setSeichiMapUserTitle: setTitleMock,
}));

import { PUT } from "../route";

const request = (body: unknown, origin: string | null = "http://localhost") =>
  new Request("http://localhost/api/seichi-map/achievements/title", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });

describe("PUT /api/seichi-map/achievements/title", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue({ user: { id: "user-1" } });
    setTitleMock.mockResolvedValue(true);
  });

  it("未ログインや別オリジンからは設定できない", async () => {
    sessionMock.mockResolvedValueOnce(null);
    expect(
      (await PUT(request({ achievementId: "rail", level: 1 }))).status,
    ).toBe(401);
    expect(
      (
        await PUT(
          request({ achievementId: "rail", level: 1 }, "https://evil.example"),
        )
      ).status,
    ).toBe(403);
    expect(setTitleMock).not.toHaveBeenCalled();
  });

  it("不正な指定を拒否する", async () => {
    for (const body of [
      {},
      [],
      { achievementId: "rail" },
      { achievementId: "rail", level: 0 },
      { achievementId: "rail", level: 1.5 },
      { achievementId: "Rail!", level: 1 },
      { achievementId: "rail", level: 1, extra: true },
      { achievementId: null, level: 1 },
    ]) {
      expect((await PUT(request(body))).status).toBe(400);
    }
    expect(setTitleMock).not.toHaveBeenCalled();
  });

  it("獲得済みのグレードを設定し、null で自動に戻す", async () => {
    expect(
      (await PUT(request({ achievementId: "rail", level: 2 }))).status,
    ).toBe(200);
    expect(setTitleMock).toHaveBeenCalledWith("user-1", {
      achievementId: "rail",
      level: 2,
    });

    expect((await PUT(request({ achievementId: null }))).status).toBe(200);
    expect(setTitleMock).toHaveBeenLastCalledWith("user-1", null);
  });

  it("獲得していないグレードは409を返す", async () => {
    setTitleMock.mockResolvedValue(false);
    expect(
      (await PUT(request({ achievementId: "rail", level: 6 }))).status,
    ).toBe(409);
  });
});
