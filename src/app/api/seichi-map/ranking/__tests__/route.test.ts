import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  loadLocationRankingMock,
  loadVisitorRankingMock,
  loadAdministrativeAreaMock,
  parseSeichiMapKmlMock,
  loadRankingBadgesMock,
} = vi.hoisted(() => ({
  loadRankingBadgesMock: vi.fn(),
  loadLocationRankingMock: vi.fn(),
  loadVisitorRankingMock: vi.fn(),
  loadAdministrativeAreaMock: vi.fn(),
  parseSeichiMapKmlMock: vi.fn(),
}));

vi.mock("@/app/lib/seichiMap", () => ({
  AZKI_SEICHI_MAP_KML_URL: "https://example.test/seichi-map.kml",
  buildSeichiMapGoogleMapsSearchUrl: ({
    latitude,
    longitude,
  }: {
    latitude: number;
    longitude: number;
  }) => `https://example.test/maps?query=${latitude},${longitude}`,
  loadSeichiMapAdministrativeArea: loadAdministrativeAreaMock,
  parseSeichiMapKml: parseSeichiMapKmlMock,
}));

vi.mock("@/app/lib/seichiMapVisitedSheet", () => ({
  SEICHI_MAP_RANKING_LIMIT: 100,
  loadSeichiMapLocationVisitorRanking: loadLocationRankingMock,
  loadSeichiMapVisitorRanking: loadVisitorRankingMock,
}));

vi.mock("@/app/lib/server/seichiMapAchievements", () => ({
  loadSeichiMapRankingBadges: loadRankingBadgesMock,
}));

vi.mock("@/app/lib/server/seichiMapIdentityRegistry", () => ({
  loadSeichiMapIdentityRegistry: vi.fn(),
}));

import { loadSeichiMapIdentityRegistry } from "@/app/lib/server/seichiMapIdentityRegistry";

import { GET } from "../route";

const badge = {
  level: 7,
  points: 540,
  title: {
    achievementId: "rail",
    name: { ja: "鉄分補給", en: "Iron Supplement" },
    metric: "LOCATION_COUNT",
    level: 6,
    thresholdType: "PERCENT",
    thresholdValue: 100,
    rarity: "UR",
    holderRate: 0.01,
  },
};

describe("seichi-map ranking route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.mocked(loadSeichiMapIdentityRegistry).mockResolvedValue({
      identities: [],
      version: 1,
      updatedAt: null,
    });
    loadLocationRankingMock.mockResolvedValue([
      { locationId: "cccccccccccccccc", uniqueVisitorCount: 99 },
      { locationId: "bbbbbbbbbbbbbbbb", uniqueVisitorCount: 2 },
      { locationId: "aaaaaaaaaaaaaaaa", uniqueVisitorCount: 2 },
    ]);
    loadVisitorRankingMock.mockResolvedValue([
      { userId: "user-secret-a", nickname: "開拓者A", visitCount: 8 },
      { userId: "user-secret-b", nickname: null, visitCount: 5 },
    ]);
    loadRankingBadgesMock.mockResolvedValue(
      new Map([["user-secret-a", badge]]),
    );
    loadAdministrativeAreaMock.mockImplementation(
      ({ latitude }: { latitude: number }) =>
        Promise.resolve(latitude === 35 ? "千葉県千葉市" : "千葉県習志野市"),
    );
    parseSeichiMapKmlMock.mockReturnValue([
      { id: "aaaaaaaaaaaaaaaa", name: "地点A", latitude: 35, longitude: 140 },
      { id: "bbbbbbbbbbbbbbbb", name: "地点B", latitude: 34, longitude: 139 },
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<kml />", { status: 200 })),
    );
  });

  it("現行KMLにある地点だけを順位付けし、匿名開拓者を識別子なしで返す", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(parseSeichiMapKmlMock).toHaveBeenCalledWith("<kml />", []);
    expect(data).toEqual({
      locations: [
        {
          id: "aaaaaaaaaaaaaaaa",
          name: "地点A",
          administrativeArea: "千葉県千葉市",
          seichiMapUrl: "/seichi-map?location=aaaaaaaaaaaaaaaa",
          googleMapUrl: "https://example.test/maps?query=35,140",
          uniqueVisitorCount: 2,
        },
        {
          id: "bbbbbbbbbbbbbbbb",
          name: "地点B",
          administrativeArea: "千葉県習志野市",
          seichiMapUrl: "/seichi-map?location=bbbbbbbbbbbbbbbb",
          googleMapUrl: "https://example.test/maps?query=34,139",
          uniqueVisitorCount: 2,
        },
      ],
      visitors: [
        { nickname: "開拓者A", visitCount: 8, achievement: badge },
        { nickname: null, visitCount: 5, achievement: null },
      ],
    });
    expect(loadRankingBadgesMock).toHaveBeenCalledWith([
      "user-secret-a",
      "user-secret-b",
    ]);
    expect(JSON.stringify(data)).not.toContain("userId");
    expect(JSON.stringify(data)).not.toContain("user-secret");
    expect(JSON.stringify(data)).not.toContain("shareId");
    expect(JSON.stringify(data)).not.toContain("cccccccccccccccc");
    expect(loadVisitorRankingMock).toHaveBeenCalledWith([
      "aaaaaaaaaaaaaaaa",
      "bbbbbbbbbbbbbbbb",
    ]);
  });

  it("バッジの集計に失敗してもランキングは返す", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    loadRankingBadgesMock.mockRejectedValue(new Error("table missing"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.visitors).toEqual([
      { nickname: "開拓者A", visitCount: 8, achievement: null },
      { nickname: null, visitCount: 5, achievement: null },
    ]);
    consoleError.mockRestore();
  });

  it("DBマッピングを地点一覧と同じようにランキングにも使う", async () => {
    const identities = [
      {
        id: "aaaaaaaaaaaaaaaa",
        names: ["db"],
        sourceIds: [],
        positions: [],
        descriptionKeys: [],
      },
    ];
    vi.mocked(loadSeichiMapIdentityRegistry).mockResolvedValue({
      identities,
      version: 2,
      updatedAt: null,
    });
    await GET();
    expect(parseSeichiMapKmlMock).toHaveBeenCalledWith("<kml />", identities);
  });

  it("DB読込失敗時は静的JSONを使わず取得エラーにする", async () => {
    vi.mocked(loadSeichiMapIdentityRegistry).mockRejectedValue(
      new Error("unavailable"),
    );
    expect((await GET()).status).toBe(500);
    expect(parseSeichiMapKmlMock).not.toHaveBeenCalled();
  });
});
