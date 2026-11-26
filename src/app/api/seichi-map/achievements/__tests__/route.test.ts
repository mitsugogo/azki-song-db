import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionMock, summaryMock, markSeenMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  summaryMock: vi.fn(),
  markSeenMock: vi.fn(),
}));

vi.mock("@/app/lib/authSession", () => ({
  getOptionalServerSession: sessionMock,
}));

vi.mock("@/app/lib/server/seichiMapAchievements", () => ({
  loadSeichiMapUserAchievementSummary: summaryMock,
  markSeichiMapAchievementsSeen: markSeenMock,
}));

import { GET } from "../route";
import { POST } from "../seen/route";

const seenRequest = (origin: string | null = "http://localhost") =>
  new Request("http://localhost/api/seichi-map/achievements/seen", {
    method: "POST",
    headers: origin ? { origin } : {},
  });

describe("seichi-map achievements routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue({ user: { id: "user-1" } });
    summaryMock.mockResolvedValue({ ready: true, items: [], unseen: [] });
    markSeenMock.mockResolvedValue(2);
  });

  it("未ログインでは一覧を返さない", async () => {
    sessionMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(summaryMock).not.toHaveBeenCalled();
  });

  it("ログインユーザーの一覧をキャッシュさせずに返す", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(summaryMock).toHaveBeenCalledWith("user-1");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      ready: true,
      items: [],
      unseen: [],
    });
  });

  it("一覧の取得に失敗したら500を返す", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    summaryMock.mockRejectedValue(new Error("db down"));

    expect((await GET()).status).toBe(500);
    consoleError.mockRestore();
  });

  it("同一オリジンからだけ通知済みにする", async () => {
    expect((await POST(seenRequest("https://evil.example"))).status).toBe(403);
    expect((await POST(seenRequest(null))).status).toBe(403);
    expect(markSeenMock).not.toHaveBeenCalled();

    const response = await POST(seenRequest());

    expect(response.status).toBe(200);
    expect(markSeenMock).toHaveBeenCalledWith("user-1");
    await expect(response.json()).resolves.toEqual({ updatedCount: 2 });
  });

  it("未ログインでは通知済みにしない", async () => {
    sessionMock.mockResolvedValue(null);

    expect((await POST(seenRequest())).status).toBe(401);
    expect(markSeenMock).not.toHaveBeenCalled();
  });
});
