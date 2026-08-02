import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  loadLocationRankingMock,
  loadVisitorRankingMock,
  loadAdministrativeAreaMock,
  parseSeichiMapKmlMock,
} = vi.hoisted(() => ({
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

import { GET } from "../route";

describe("seichi-map ranking route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    loadLocationRankingMock.mockResolvedValue([
      { locationId: "cccccccccccccccc", uniqueVisitorCount: 99 },
      { locationId: "bbbbbbbbbbbbbbbb", uniqueVisitorCount: 2 },
      { locationId: "aaaaaaaaaaaaaaaa", uniqueVisitorCount: 2 },
    ]);
    loadVisitorRankingMock.mockResolvedValue([
      { nickname: "開拓者A", visitCount: 8 },
      { nickname: null, visitCount: 5 },
    ]);
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
        { nickname: "開拓者A", visitCount: 8 },
        { nickname: null, visitCount: 5 },
      ],
    });
    expect(JSON.stringify(data)).not.toContain("userId");
    expect(JSON.stringify(data)).not.toContain("shareId");
    expect(JSON.stringify(data)).not.toContain("cccccccccccccccc");
    expect(loadVisitorRankingMock).toHaveBeenCalledWith([
      "aaaaaaaaaaaaaaaa",
      "bbbbbbbbbbbbbbbb",
    ]);
  });
});
