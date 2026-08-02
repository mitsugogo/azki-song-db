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

const numberCell = (value: number) => ({
  userEnteredValue: { numberValue: value },
  formattedValue: String(value),
});

const restoreEnv = (key: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

describe("milestones route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SPREADSHEET_ID = "test-spreadsheet";
    process.env.GOOGLE_API_KEY = "test-api-key";
  });

  afterAll(() => {
    restoreEnv("SPREADSHEET_ID", originalSpreadsheetId);
    restoreEnv("GOOGLE_API_KEY", originalApiKey);
  });

  it("reads numeric importance independently of header position and defaults invalid values", async () => {
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
                      stringCell("priority"),
                      stringCell("日付"),
                      stringCell("URL"),
                    ],
                  },
                  {
                    values: [
                      stringCell("重要なマイルストーン"),
                      numberCell(3),
                      stringCell("2026-07-04"),
                      stringCell("https://example.com/important"),
                    ],
                  },
                  {
                    values: [
                      stringCell("通常のマイルストーン"),
                      stringCell("invalid"),
                      stringCell("2026-07-05"),
                      stringCell(""),
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const response = await GET(new Request("http://localhost/api/milestones"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([
      expect.objectContaining({
        content: "重要なマイルストーン",
        importance: "extra_high",
      }),
      expect.objectContaining({
        content: "通常のマイルストーン",
        importance: "normal",
      }),
    ]);
    expect(sheetsGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: "test-spreadsheet",
        ranges: ["milestones!A:I"],
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
                    values: [stringCell("内容"), stringCell("日付")],
                  },
                  {
                    values: [
                      stringCell("過去形式のマイルストーン"),
                      stringCell("2026-07-06"),
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const response = await GET(new Request("http://localhost/api/milestones"));
    const data = await response.json();

    expect(data[0]).toEqual(
      expect.objectContaining({
        content: "過去形式のマイルストーン",
        importance: "normal",
      }),
    );
  });
});
