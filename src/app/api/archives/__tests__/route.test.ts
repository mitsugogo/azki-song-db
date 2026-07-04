import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { sheetsGetMock, sheetsMock } = vi.hoisted(() => {
  const sheetsGetMock = vi.fn();
  const sheetsMock = vi.fn(() => ({
    spreadsheets: {
      values: {
        get: sheetsGetMock,
      },
    },
  }));

  return {
    sheetsGetMock,
    sheetsMock,
  };
});

vi.mock("googleapis", () => ({
  google: {
    sheets: sheetsMock,
    auth: {
      GoogleAuth: vi.fn(),
    },
  },
}));

import { GET } from "../route";

const originalSpreadsheetId = process.env.SPREADSHEET_ID;
const originalArchivesSpreadsheetId = process.env.ARCHIVES_SPREADSHEET_ID;
const originalApiKey = process.env.GOOGLE_API_KEY;
const originalClientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const originalPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

const restoreEnv = (key: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

describe("archives route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SPREADSHEET_ID = "test-spreadsheet";
    delete process.env.ARCHIVES_SPREADSHEET_ID;
    process.env.GOOGLE_API_KEY = "test-api-key";
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  });

  afterAll(() => {
    restoreEnv("SPREADSHEET_ID", originalSpreadsheetId);
    restoreEnv("ARCHIVES_SPREADSHEET_ID", originalArchivesSpreadsheetId);
    restoreEnv("GOOGLE_API_KEY", originalApiKey);
    restoreEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", originalClientEmail);
    restoreEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", originalPrivateKey);
  });

  it("reads stream_started_at from the stream start column", async () => {
    sheetsGetMock.mockResolvedValue({
      data: {
        values: [
          [
            "連番",
            "配信内容",
            "配信タイトル",
            "動画ID",
            "チャンネルID",
            "動画URL",
            "動画時間",
            "概要欄",
            "公開日時",
            "配信開始日時",
            "タイムスタンプ",
          ],
          [
            "1",
            "ゲーム",
            "Valid Archive",
            "video1",
            "UC1111111111111111111111",
            "",
            "2:00:00",
            "description",
            "2026-01-02T01:30:00.000Z",
            "2026-01-02T00:00:00.000Z",
            "",
          ],
          [
            "2",
            "雑談",
            "Earlier Stream Start",
            "video2",
            "UC2222222222222222222222",
            "",
            "invalid",
            "description",
            "2026-01-03T01:30:00.000Z",
            "2026-01-01T23:30:00.000Z",
            "",
          ],
        ],
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([
      expect.objectContaining({
        title: "Valid Archive",
        channel_id: "UC1111111111111111111111",
        stream_started_at: "2026-01-02T00:00:00.000Z",
      }),
      expect.objectContaining({
        title: "Earlier Stream Start",
        channel_id: "UC2222222222222222222222",
        stream_started_at: "2026-01-01T23:30:00.000Z",
      }),
    ]);
    expect(sheetsGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: "test-spreadsheet",
        range: "配信アーカイブ!A1:K",
      }),
    );
  });
});
