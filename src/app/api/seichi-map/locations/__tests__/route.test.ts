import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/seichiMap", () => ({
  AZKI_SEICHI_MAP_KML_URL: "https://example.com/seichi-map.kml",
  parseSeichiMapKml: vi.fn(),
}));

vi.mock("@/app/lib/seichiMapVisitedSheet", () => ({
  loadSeichiMapLocationVisitorSummaries: vi.fn(),
  loadSeichiMapUserCount: vi.fn(),
}));

vi.mock("@/app/lib/server/seichiMapIdentityRegistry", () => ({
  loadSeichiMapIdentityRegistry: vi.fn(),
}));

import { loadSeichiMapIdentityRegistry } from "@/app/lib/server/seichiMapIdentityRegistry";

import { parseSeichiMapKml } from "@/app/lib/seichiMap";
import { SEICHI_MAP_USER_COUNT_HEADER } from "@/app/lib/seichiMapHeaders";
import {
  loadSeichiMapLocationVisitorSummaries,
  loadSeichiMapUserCount,
} from "@/app/lib/seichiMapVisitedSheet";
import { GET } from "../route";

describe("GET /api/seichi-map/locations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadSeichiMapIdentityRegistry).mockResolvedValue({
      identities: [],
      version: 1,
      updatedAt: null,
    });
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
    vi.mocked(loadSeichiMapLocationVisitorSummaries).mockResolvedValue({
      aaaaaaaaaaaaaaaa: {
        uniqueVisitorCount: 1,
        singleVisitorNickname: "開拓者A",
      },
    });
    vi.mocked(loadSeichiMapUserCount).mockResolvedValue(3);
  });

  it("地点一覧を維持したまま利用者数をレスポンスヘッダーに含める", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(parseSeichiMapKml).toHaveBeenCalledWith("<kml />", []);
    expect(response.headers.get(SEICHI_MAP_USER_COUNT_HEADER)).toBe("3");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: "aaaaaaaaaaaaaaaa",
        uniqueVisitorCount: 1,
        singleVisitorNickname: "開拓者A",
      }),
    ]);
  });

  it("DBマッピングの読込失敗時は古いJSONへ戻さず取得エラーにする", async () => {
    vi.mocked(loadSeichiMapIdentityRegistry).mockRejectedValue(
      new Error("unavailable"),
    );
    expect((await GET()).status).toBe(500);
    expect(parseSeichiMapKml).not.toHaveBeenCalled();
  });

  it("DBのマッピングを地点IDの解決に渡す", async () => {
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
    expect(parseSeichiMapKml).toHaveBeenCalledWith("<kml />", identities);
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

  it("地点別集計に失敗した場合は人数0・ニックネームなしで地点一覧を返す", async () => {
    vi.mocked(loadSeichiMapLocationVisitorSummaries).mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await GET();

    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: "aaaaaaaaaaaaaaaa",
        uniqueVisitorCount: 0,
        singleVisitorNickname: null,
      }),
    ]);
  });
});
