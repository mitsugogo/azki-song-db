import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/seichiMap", () => ({
  AZKI_SEICHI_MAP_KML_URL: "https://example.com/seichi-map.kml",
  parseSeichiMapKml: vi.fn(),
}));

vi.mock("@/app/lib/seichiMapVisitedSheet", () => ({
  loadSeichiMapUniqueVisitorCounts: vi.fn(),
  loadSeichiMapUserCount: vi.fn(),
}));

import { parseSeichiMapKml } from "@/app/lib/seichiMap";
import { SEICHI_MAP_USER_COUNT_HEADER } from "@/app/lib/seichiMapHeaders";
import {
  loadSeichiMapUniqueVisitorCounts,
  loadSeichiMapUserCount,
} from "@/app/lib/seichiMapVisitedSheet";
import { GET } from "../route";

describe("GET /api/seichi-map/locations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<kml />", {
          status: 200,
          headers: { "Content-Type": "text/xml" },
        }),
      ),
    );
    vi.mocked(parseSeichiMapKml).mockReturnValue([
      {
        id: "aaaaaaaaaaaaaaaa",
        folder: "レイヤー",
        name: "地点A",
        description: "",
        styleUrl: "",
        latitude: 35,
        longitude: 139,
      },
    ]);
    vi.mocked(loadSeichiMapUniqueVisitorCounts).mockResolvedValue({
      aaaaaaaaaaaaaaaa: 2,
    });
    vi.mocked(loadSeichiMapUserCount).mockResolvedValue(3);
  });

  it("地点一覧を維持したまま利用者数をレスポンスヘッダーに含める", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get(SEICHI_MAP_USER_COUNT_HEADER)).toBe("3");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: "aaaaaaaaaaaaaaaa",
        uniqueVisitorCount: 2,
      }),
    ]);
  });

  it("利用者数の集計に失敗しても地点一覧は返す", async () => {
    vi.mocked(loadSeichiMapUserCount).mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get(SEICHI_MAP_USER_COUNT_HEADER)).toBeNull();
    await expect(response.json()).resolves.toHaveLength(1);
  });
});
