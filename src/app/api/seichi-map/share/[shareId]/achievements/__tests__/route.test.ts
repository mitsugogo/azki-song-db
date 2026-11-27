import { beforeEach, describe, expect, it, vi } from "vitest";

const { summaryMock } = vi.hoisted(() => ({ summaryMock: vi.fn() }));

vi.mock("@/app/lib/seichiMapShareSheet", () => ({
  validateSeichiMapShareId: (value: string) =>
    /^[0-9a-f-]{36}$/.test(value) ? value : null,
}));

vi.mock("@/app/lib/server/seichiMapAchievements", () => ({
  loadSharedSeichiMapAchievementSummary: summaryMock,
}));

import { GET } from "../route";

const SHARE_ID = "11111111-2222-3333-4444-555555555555";
const call = (shareId: string) =>
  GET(new Request("http://localhost"), {
    params: Promise.resolve({ shareId }),
  });

describe("GET /api/seichi-map/share/[shareId]/achievements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    summaryMock.mockResolvedValue({
      ready: true,
      profile: null,
      items: [],
      unseen: [],
    });
  });

  it("共有IDの形式が不正なら読み込まない", async () => {
    expect((await call("../etc")).status).toBe(400);
    expect(summaryMock).not.toHaveBeenCalled();
  });

  it("共有設定が無ければ404を返す", async () => {
    summaryMock.mockResolvedValue(null);
    expect((await call(SHARE_ID)).status).toBe(404);
  });

  it("持ち主のバッジ状況をキャッシュさせずに返す", async () => {
    const response = await call(SHARE_ID);

    expect(response.status).toBe(200);
    expect(summaryMock).toHaveBeenCalledWith(SHARE_ID);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
