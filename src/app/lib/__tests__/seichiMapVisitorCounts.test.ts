import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from "../prisma";
import {
  loadSeichiMapLocationVisitorRanking,
  loadSeichiMapUniqueVisitorCounts,
  loadSeichiMapVisitorRanking,
  SEICHI_MAP_RANKING_LIMIT,
} from "../seichiMapVisitedSheet";

describe("loadSeichiMapUniqueVisitorCounts", () => {
  const queryRaw = prisma.$queryRaw as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("地点ごとのユニーク訪問者数だけを返す", async () => {
    queryRaw.mockResolvedValue([
      { locationId: "location-a", uniqueVisitorCount: 2n },
      { locationId: "location-b", uniqueVisitorCount: 1n },
    ]);

    await expect(loadSeichiMapUniqueVisitorCounts()).resolves.toEqual({
      "location-a": 2,
      "location-b": 1,
    });

    const sql = (queryRaw.mock.calls[0][0] as TemplateStringsArray).join("?");
    expect(sql).toContain("COUNT(DISTINCT userId)");
    expect(sql).toContain("GROUP BY locationId");
  });

  it("地点ランキング用にlocationIdとユニーク訪問者数を返す", async () => {
    queryRaw.mockResolvedValue([
      { locationId: "location-a", uniqueVisitorCount: 4n },
    ]);

    await expect(loadSeichiMapLocationVisitorRanking()).resolves.toEqual([
      { locationId: "location-a", uniqueVisitorCount: 4 },
    ]);
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
