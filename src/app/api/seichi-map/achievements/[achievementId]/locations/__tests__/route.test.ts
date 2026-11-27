import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadTargetsMock } = vi.hoisted(() => ({ loadTargetsMock: vi.fn() }));

vi.mock("@/app/lib/server/seichiMapAchievements", () => ({
  loadSeichiMapAchievementTargetLocationIds: loadTargetsMock,
}));

import { GET } from "../route";

const call = (achievementId: string) =>
  GET(new Request("http://localhost/api"), {
    params: Promise.resolve({ achievementId }),
  });

describe("seichi-map achievement target locations route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("対象地点の ID を返す", async () => {
    loadTargetsMock.mockResolvedValue(["aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb"]);

    const response = await call("rail");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      locationIds: ["aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb"],
    });
    expect(loadTargetsMock).toHaveBeenCalledWith("rail");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("形式が不正な ID は 400 にして、検索しない", async () => {
    for (const id of ["", "Rail", "a b", "../x", "a".repeat(65)]) {
      expect((await call(id)).status).toBe(400);
    }
    expect(loadTargetsMock).not.toHaveBeenCalled();
  });

  it("存在しないバッジや同期前は 404", async () => {
    loadTargetsMock.mockResolvedValue(null);
    expect((await call("missing")).status).toBe(404);
  });

  it("取得に失敗したら 500", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    loadTargetsMock.mockRejectedValue(new Error("db down"));

    expect((await call("rail")).status).toBe(500);
    consoleError.mockRestore();
  });
});
