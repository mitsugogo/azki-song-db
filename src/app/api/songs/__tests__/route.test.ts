import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, sheetsMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  const sheetsMock = vi.fn(() => ({
    spreadsheets: {
      get: getMock,
    },
  }));

  return {
    getMock,
    sheetsMock,
  };
});

vi.mock("googleapis", () => ({
  google: {
    sheets: sheetsMock,
  },
}));

import { GET } from "../route";
import {
  createMembersOnlyAccessToken,
  isMembersOnlySongSheetTitle,
  membersOnlySongRanges,
} from "@/app/lib/membersOnlyAccess";

const originalSpreadsheetId = process.env.SPREADSHEET_ID;
const originalApiKey = process.env.GOOGLE_API_KEY;
const originalMembersPassword = process.env.MEMBERS_ONLY_SONGS_PASSWORD;
const originalCookieSecret = process.env.MEMBERS_ONLY_COOKIE_SECRET;

describe("songs route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SPREADSHEET_ID = "test-spreadsheet";
    process.env.GOOGLE_API_KEY = "test-api-key";
    process.env.MEMBERS_ONLY_SONGS_PASSWORD = "open-sesame";
    process.env.MEMBERS_ONLY_COOKIE_SECRET = "cookie-secret";
    getMock.mockResolvedValue({ data: { sheets: [] } });
  });

  afterAll(() => {
    process.env.SPREADSHEET_ID = originalSpreadsheetId;
    process.env.GOOGLE_API_KEY = originalApiKey;
    process.env.MEMBERS_ONLY_SONGS_PASSWORD = originalMembersPassword;
    process.env.MEMBERS_ONLY_COOKIE_SECRET = originalCookieSecret;
  });

  it("Cookieなしではメン限シートを取得しない", async () => {
    const response = await GET(new Request("http://localhost/api/songs?hl=ja"));

    expect(response.status).toBe(200);
    expect(getMock).toHaveBeenCalledTimes(1);

    const args = getMock.mock.calls[0]?.[0];
    expect(args?.ranges).not.toEqual(
      expect.arrayContaining([...membersOnlySongRanges]),
    );
    expect(response.headers.get("vary")).toBe("Cookie");
  });

  it("正しいCookieがあるとメン限シートを取得する", async () => {
    const token = createMembersOnlyAccessToken();
    const response = await GET(
      new Request("http://localhost/api/songs?hl=ja", {
        headers: {
          cookie: `azki_members_only_access=${encodeURIComponent(token ?? "")}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(getMock).toHaveBeenCalledTimes(1);

    const args = getMock.mock.calls[0]?.[0];
    expect(args?.ranges).toEqual(
      expect.arrayContaining([...membersOnlySongRanges]),
    );
  });

  it("メン限シート由来の楽曲にフラグを付与する", async () => {
    getMock.mockResolvedValue({
      data: {
        sheets: [
          {
            properties: { title: "歌枠【メン限】" },
            data: [
              {
                rowData: [
                  {
                    values: [
                      { formattedValue: "ID" },
                      { formattedValue: "有効" },
                      { formattedValue: "曲名" },
                      { formattedValue: "アーティスト" },
                      { formattedValue: "動画" },
                      { formattedValue: "開始" },
                      { formattedValue: "配信日" },
                    ],
                  },
                  {
                    values: [
                      { formattedValue: "1" },
                      { userEnteredValue: { boolValue: true } },
                      { formattedValue: "Member Song" },
                      { formattedValue: "AZKi" },
                      {
                        formattedValue: "https://youtu.be/abcdefghijk",
                        hyperlink: "https://youtu.be/abcdefghijk",
                      },
                      { userEnteredValue: { numberValue: 0 } },
                      { userEnteredValue: { numberValue: 45658 } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            properties: { title: "歌枠2025" },
            data: [
              {
                rowData: [
                  {
                    values: [
                      { formattedValue: "ID" },
                      { formattedValue: "有効" },
                      { formattedValue: "曲名" },
                      { formattedValue: "アーティスト" },
                      { formattedValue: "動画" },
                      { formattedValue: "開始" },
                      { formattedValue: "配信日" },
                    ],
                  },
                  {
                    values: [
                      { formattedValue: "2" },
                      { userEnteredValue: { boolValue: true } },
                      { formattedValue: "Public Song" },
                      { formattedValue: "AZKi" },
                      {
                        formattedValue: "https://youtu.be/lmnopqrstuv",
                        hyperlink: "https://youtu.be/lmnopqrstuv",
                      },
                      { userEnteredValue: { numberValue: 0 } },
                      { userEnteredValue: { numberValue: 45657 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const response = await GET(new Request("http://localhost/api/songs?hl=ja"));
    const songs = await response.json();

    expect(response.status).toBe(200);
    expect(isMembersOnlySongSheetTitle("歌枠【メン限】")).toBe(true);
    expect(songs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Member Song",
          is_members_only: true,
        }),
        expect.objectContaining({
          title: "Public Song",
          is_members_only: false,
        }),
      ]),
    );
  });
});
