import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { batchGetMock, sheetsMock } = vi.hoisted(() => {
  const batchGetMock = vi.fn();
  const sheetsMock = vi.fn(() => ({
    spreadsheets: { values: { batchGet: batchGetMock } },
  }));
  return { batchGetMock, sheetsMock };
});

vi.mock("googleapis", () => ({
  google: {
    sheets: sheetsMock,
    auth: { GoogleAuth: vi.fn() },
  },
}));

import { GET } from "../route";

const originalSpreadsheetId = process.env.SPREADSHEET_ID;
const originalApiKey = process.env.GOOGLE_API_KEY;
const originalClientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const originalPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

const restoreEnv = (key: string, value: string | undefined) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
};

describe("GET /api/lives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SPREADSHEET_ID = "test-spreadsheet";
    process.env.GOOGLE_API_KEY = "test-api-key";
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    batchGetMock.mockResolvedValue({
      data: {
        valueRanges: [
          {
            values: [
              [
                "ライブID",
                "ライブタイトル",
                "カテゴリ",
                "公演",
                "開催日",
                "開場",
                "開演",
                "場所",
                "URL",
                "出演者",
                "チケット",
                "備考",
                "ページslug",
                "公演slug",
              ],
              [
                "LIVE-001",
                "Test Live",
                "ソロライブ",
                "",
                "2026-01-02",
                "17:00",
                "18:00",
                "Test Venue",
                "",
                "AZKi",
                "",
                "",
                "test-live",
                "main",
              ],
            ],
          },
          {
            values: [
              [
                "ライブID",
                "曲順",
                "楽曲タイトル",
                "アーティスト名",
                "歌った人",
                "備考",
              ],
              ["LIVE-001", "EN", "Encore", "AZKi", "AZKi", ""],
            ],
          },
        ],
      },
    });
  });

  afterAll(() => {
    restoreEnv("SPREADSHEET_ID", originalSpreadsheetId);
    restoreEnv("GOOGLE_API_KEY", originalApiKey);
    restoreEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", originalClientEmail);
    restoreEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", originalPrivateKey);
  });

  it("2シートを一括取得してキャッシュ可能なグループJSONを返す", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(batchGetMock).toHaveBeenCalledWith({
      spreadsheetId: "test-spreadsheet",
      ranges: ["ライブ!A1:N", "ライブセトリ!A1:F"],
      valueRenderOption: "FORMATTED_VALUE",
    });
    expect(data[0]).toMatchObject({
      canonicalId: "LIVE-001",
      pageSlug: "test-live",
      title: "Test Live",
      totalSongs: 1,
    });
    expect(data[0].performances[0].setlist[0].order).toBe("EN");
    expect(data[0].performances[0]).toMatchObject({
      pageSlug: "test-live",
      performanceSlug: "main",
    });
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
    expect(response.headers.get("vercel-cache-tag")).toBe(
      "dataset:core,lives,lives:list",
    );
  });

  it("取得失敗時は500を返す", async () => {
    batchGetMock.mockRejectedValueOnce(new Error("failed"));
    const response = await GET();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch live setlists",
    });
  });
});
