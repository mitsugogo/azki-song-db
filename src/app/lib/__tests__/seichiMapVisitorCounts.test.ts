import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from "../prisma";
import {
  loadSeichiMapLocationVisitorRanking,
  loadSeichiMapLocationVisitorSummaries,
  loadSeichiMapUserCount,
  loadSeichiMapVisitorRanking,
  SEICHI_MAP_RANKING_LIMIT,
} from "../seichiMapVisitedSheet";

describe("loadSeichiMapLocationVisitorSummaries", () => {
  const queryRaw = prisma.$queryRaw as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("地点ごとのユニーク訪問者数と公開中の単独訪問者名を返す", async () => {
    queryRaw.mockResolvedValue([
      {
        locationId: "location-a",
        uniqueVisitorCount: 2n,
        singleVisitorNickname: null,
      },
      {
        locationId: "location-b",
        uniqueVisitorCount: 1n,
        singleVisitorNickname: "開拓者A",
      },
      {
        locationId: "location-c",
        uniqueVisitorCount: 1n,
        singleVisitorNickname: null,
      },
    ]);

    await expect(loadSeichiMapLocationVisitorSummaries()).resolves.toEqual({
      "location-a": {
        uniqueVisitorCount: 2,
        singleVisitorNickname: null,
      },
      "location-b": {
        uniqueVisitorCount: 1,
        singleVisitorNickname: "開拓者A",
      },
      "location-c": {
        uniqueVisitorCount: 1,
        singleVisitorNickname: null,
      },
    });

    const sql = (queryRaw.mock.calls[0][0] as TemplateStringsArray).join("?");
    expect(sql).toContain("COUNT(DISTINCT visited.userId)");
    expect(sql).toContain("LEFT JOIN SeichiMapProfile AS profile");
    expect(sql).toContain("WHEN profile.showNicknameInRanking");
    expect(sql).toContain("GROUP BY visited.locationId");
    expect(sql).not.toContain("SELECT visited.userId");
  });

  it("地点ランキング用にlocationIdとユニーク訪問者数を返す", async () => {
    queryRaw.mockResolvedValue([
      { locationId: "location-a", uniqueVisitorCount: 4n },
    ]);

    await expect(loadSeichiMapLocationVisitorRanking()).resolves.toEqual([
      { locationId: "location-a", uniqueVisitorCount: 4 },
    ]);
  });

  it("1地点以上を登録した利用者をuserIdユニークで数える", async () => {
    queryRaw.mockResolvedValue([{ userCount: 3n }]);

    await expect(loadSeichiMapUserCount()).resolves.toBe(3);

    const sql = (queryRaw.mock.calls[0][0] as TemplateStringsArray).join("?");
    expect(sql).toContain("COUNT(DISTINCT userId)");
    expect(sql).toContain("FROM SeichiMapVisited");
  });

  it("訪問記録がなければ利用者数を0人として返す", async () => {
    queryRaw.mockResolvedValue([]);

    await expect(loadSeichiMapUserCount()).resolves.toBe(0);
  });

  it("開拓者ランキングをニックネーム付きで上位100件に限定する", async () => {
    queryRaw.mockResolvedValue([
      { nickname: "開拓者A", visitCount: 12n },
      { nickname: null, visitCount: 8n },
    ]);

    await expect(
      loadSeichiMapVisitorRanking(["location-a", "location-b", "location-a"]),
    ).resolves.toEqual([
      { nickname: "開拓者A", visitCount: 12 },
      { nickname: null, visitCount: 8 },
    ]);

    const query = queryRaw.mock.calls[0][0] as {
      strings: readonly string[];
      values: readonly unknown[];
    };
    const sql = query.strings.join("?");
    expect(sql).toContain("FROM SeichiMapProfile");
    expect(sql).toContain("WHEN showNicknameInRanking THEN nickname");
    expect(sql).toContain("COUNT(DISTINCT locationId)");
    expect(sql).toContain("WHERE locationId IN (?,?)");
    expect(sql).toContain("GROUP BY userId");
    expect(sql).toContain(`LIMIT ?`);
    expect(query.values).toEqual([
      "location-a",
      "location-b",
      SEICHI_MAP_RANKING_LIMIT,
    ]);
  });

  it("現行KMLに地点がなければ開拓者ランキングを照会しない", async () => {
    await expect(loadSeichiMapVisitorRanking([])).resolves.toEqual([]);
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
