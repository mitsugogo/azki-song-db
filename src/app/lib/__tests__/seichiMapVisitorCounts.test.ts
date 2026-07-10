import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from "../prisma";
import { loadSeichiMapUniqueVisitorCounts } from "../seichiMapVisitedSheet";

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
});
