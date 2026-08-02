import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { sheetsGetMock, sheetsMock } = vi.hoisted(() => {
  const sheetsGetMock = vi.fn();
  const sheetsMock = vi.fn(() => ({
    spreadsheets: {
      get: sheetsGetMock,
    },
  }));

  return { sheetsGetMock, sheetsMock };
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

const stringCell = (value: string) => ({
  userEnteredValue: { stringValue: value },
  formattedValue: value,
});

const restoreEnv = (key: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

describe("events route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SPREADSHEET_ID = "test-spreadsheet";
    process.env.GOOGLE_API_KEY = "test-api-key";
  });

  afterAll(() => {
    restoreEnv("SPREADSHEET_ID", originalSpreadsheetId);
    restoreEnv("GOOGLE_API_KEY", originalApiKey);
  });

  it("reads importance independently of header position and normalizes invalid values", async () => {
    sheetsGetMock.mockResolvedValue({
      data: {
        sheets: [
          {
            data: [
              {
                rowData: [
                  {
                    values: [
                      stringCell("priority"),
                      stringCell("内容"),
                      stringCell("開始"),
                      stringCell("終了"),
                      stringCell("表示"),
                    ],
                  },
                  {
                    values: [
                      stringCell("3"),
                      stringCell("重要なイベント"),
                      stringCell("2026-07-01"),
                      stringCell("2026-07-01"),
                      stringCell("TRUE"),
                    ],
                  },
                  {
                    values: [
                      stringCell("invalid"),
                      stringCell("通常のイベント"),
                      stringCell("2026-07-02"),
                      stringCell("2026-07-02"),
                      stringCell("TRUE"),
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const response = await GET(new Request("http://localhost/api/events"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([
      expect.objectContaining({
        content: "重要なイベント",
        importance: "extra_high",
      }),
      expect.objectContaining({
        content: "通常のイベント",
        importance: "normal",
      }),
    ]);
    expect(sheetsGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: "test-spreadsheet",
        ranges: ["events!A:N"],
      }),
    );
  });

  it("defaults to normal when the sheet has no importance column", async () => {
    sheetsGetMock.mockResolvedValue({
      data: {
        sheets: [
          {
            data: [
              {
                rowData: [
                  {
                    values: [
                      stringCell("内容"),
                      stringCell("開始"),
                      stringCell("終了"),
                    ],
                  },
                  {
                    values: [
                      stringCell("過去形式のイベント"),
                      stringCell("2026-07-03"),
                      stringCell("2026-07-03"),
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const response = await GET(new Request("http://localhost/api/events"));
    const data = await response.json();

    expect(data[0]).toEqual(
      expect.objectContaining({
        content: "過去形式のイベント",
        importance: "normal",
      }),
    );
  });
});
