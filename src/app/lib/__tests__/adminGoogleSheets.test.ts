import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, appendMock, batchUpdateMock, GoogleAuthMock, sheetsMock } =
  vi.hoisted(() => {
    const getMock = vi.fn();
    const appendMock = vi.fn();
    const batchUpdateMock = vi.fn();
    const GoogleAuthMock = vi.fn();
    const sheetsMock = vi.fn(() => ({
      spreadsheets: {
        get: getMock,
        values: {
          append: appendMock,
          batchUpdate: batchUpdateMock,
        },
      },
    }));

    return {
      getMock,
      appendMock,
      batchUpdateMock,
      GoogleAuthMock,
      sheetsMock,
    };
  });

vi.mock("googleapis", () => ({
  google: {
    auth: { GoogleAuth: GoogleAuthMock },
    sheets: sheetsMock,
  },
}));

import { updateSongMetadata, upsertChannel } from "../adminGoogleSheets";

const originalSpreadsheetId = process.env.SPREADSHEET_ID;
const originalServiceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const originalPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

const row = (values: unknown[]) => ({
  values: values.map((value) =>
    typeof value === "object" && value !== null
      ? value
      : { formattedValue: value },
  ),
});

describe("adminGoogleSheets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SPREADSHEET_ID = "test-spreadsheet";
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "service@example.com";
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = "private-key";
    appendMock.mockResolvedValue({ data: {} });
    batchUpdateMock.mockResolvedValue({ data: {} });
  });

  afterAll(() => {
    process.env.SPREADSHEET_ID = originalSpreadsheetId;
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = originalServiceAccountEmail;
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = originalPrivateKey;
  });

  it("未掲載のチャンネルをchannelsシートの列位置に追加する", async () => {
    getMock.mockResolvedValue({
      data: {
        sheets: [
          {
            properties: { title: "channels" },
            data: [
              {
                rowData: [row(["YouTube ID", "チャンネル名"])],
              },
            ],
          },
        ],
      },
    });

    const result = await upsertChannel({
      channelId: "UCabcdefghijk",
      channelName: "New Channel",
    });

    expect(result).toEqual({
      added: true,
      channelId: "UCabcdefghijk",
      channelName: "New Channel",
    });
    expect(appendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        range: "'channels'!A:Z",
        requestBody: {
          values: [expect.arrayContaining(["UCabcdefghijk", "New Channel"])],
        },
      }),
    );
  });

  it("動画IDと開始秒が一致する楽曲行だけを更新し、リンクを保持する", async () => {
    getMock.mockResolvedValue({
      data: {
        sheets: [
          {
            properties: { title: "歌枠2026" },
            data: [
              {
                rowData: [
                  row([
                    "ID",
                    "有効",
                    "曲名",
                    "アーティスト",
                    "歌った人",
                    "動画",
                    "開始",
                    "配信日",
                    "タグ",
                    "備考",
                    "アルバム",
                  ]),
                  row([
                    "1",
                    { userEnteredValue: { boolValue: true } },
                    "Old title",
                    "Old artist",
                    "Old singer",
                    {
                      formattedValue: "Old video title",
                      hyperlink: "https://youtu.be/abcdefghijk",
                    },
                    { userEnteredValue: { numberValue: 0 } },
                    { userEnteredValue: { numberValue: 45658 } },
                    "old-tag",
                    "old-extra",
                    {
                      formattedValue: "Old album",
                      hyperlink: "https://example.com/album",
                    },
                  ]),
                ],
              },
            ],
          },
        ],
      },
    });

    const result = await updateSongMetadata({
      videoId: "abcdefghijk",
      videoUri: "https://youtu.be/abcdefghijk",
      start: 0,
      matchTitle: "Old title",
      matchArtist: "Old artist",
      matchAlbum: "Old album",
      title: "New title",
      artist: "New artist",
      album: "New album",
      albumListUri: "https://example.com/album",
      singer: "New singer",
      videoTitle: "New video title",
      broadcastDate: "2025-01-02",
      tags: "new-tag",
      extra: "new-extra",
    });

    expect(result).toEqual({
      sheetName: "歌枠2026",
      rowNumber: 2,
      videoId: "abcdefghijk",
      start: 0,
    });
    expect(batchUpdateMock).toHaveBeenCalledTimes(2);
    expect(batchUpdateMock.mock.calls[0]?.[0]?.requestBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          range: "'歌枠2026'!C2",
          values: [["New title"]],
        }),
        expect.objectContaining({
          range: "'歌枠2026'!D2",
          values: [["New artist"]],
        }),
        expect.objectContaining({
          range: "'歌枠2026'!E2",
          values: [["New singer"]],
        }),
        expect.objectContaining({ range: "'歌枠2026'!H2", values: [[45659]] }),
      ]),
    );
    expect(batchUpdateMock.mock.calls[1]?.[0]?.requestBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          range: "'歌枠2026'!F2",
          values: [
            ['=HYPERLINK("https://youtu.be/abcdefghijk","New video title")'],
          ],
        }),
        expect.objectContaining({
          range: "'歌枠2026'!K2",
          values: [['=HYPERLINK("https://example.com/album","New album")']],
        }),
      ]),
    );
  });
});
