import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionMock, createMock, updateMock, evaluateMock } = vi.hoisted(
  () => ({
    sessionMock: vi.fn(),
    createMock: vi.fn(),
    updateMock: vi.fn(),
    evaluateMock: vi.fn(),
  }),
);

vi.mock("@/app/lib/authSession", () => ({
  getOptionalServerSession: sessionMock,
}));

vi.mock("@/app/lib/prisma", () => ({ prisma: {} }));

vi.mock("@/app/lib/seichiMapVisitedSheet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/seichiMapVisitedSheet")>()),
  createSeichiMapVisited: createMock,
  updateSeichiMapVisited: updateMock,
}));

vi.mock("@/app/lib/server/seichiMapAchievements", () => ({
  evaluateSeichiMapUserAchievements: evaluateMock,
}));

import { POST, PUT } from "../route";

const item = {
  id: "visit-1",
  locationId: "aaaaaaaaaaaaaaaa",
  locationName: "地点A",
  visitedAt: "2026-11-26T00:00:00.000Z",
  note: "",
  updatedAt: "2026-11-26T00:00:00.000Z",
  url: "",
};

const unlocked = [
  {
    achievementId: "real-guess-first",
    name: { ja: "初めてのリアルGuess", en: "First Real Guess" },
    metric: "LOCATION_COUNT",
    level: 1,
    thresholdType: "COUNT",
    thresholdValue: 1,
    source: "LIVE",
  },
];

const request = (method: "POST" | "PUT", body: Record<string, unknown>) =>
  new Request("http://localhost/api/seichi-map/visited", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("seichi-map visited route achievements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue({ user: { id: "user-1" } });
    createMock.mockResolvedValue(item);
    updateMock.mockResolvedValue(item);
    evaluateMock.mockResolvedValue(unlocked);
  });

  it("訪問の登録後にバッジを判定し、獲得分を返す", async () => {
    const response = await POST(
      request("POST", {
        locationId: "aaaaaaaaaaaaaaaa",
        locationName: "地点A",
      }),
    );

    expect(response.status).toBe(201);
    expect(evaluateMock).toHaveBeenCalledWith("user-1", "LIVE");
    await expect(response.json()).resolves.toEqual({
      item,
      unlockedAchievements: unlocked,
    });
  });

  it("訪問の更新後にもバッジを判定する", async () => {
    const response = await PUT(
      request("PUT", { id: "visit-1", locationName: "地点A" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      unlockedAchievements: unlocked,
    });
  });

  it("バッジの判定に失敗しても訪問の保存は成功扱いにする", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    evaluateMock.mockRejectedValue(new Error("db down"));

    const response = await POST(request("POST", { locationName: "地点A" }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      item,
      unlockedAchievements: [],
    });
    consoleError.mockRestore();
  });

  it("保存に失敗した場合はバッジを判定しない", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    createMock.mockRejectedValue(new Error("db down"));

    const response = await POST(request("POST", { locationName: "地点A" }));

    expect(response.status).toBe(500);
    expect(evaluateMock).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
