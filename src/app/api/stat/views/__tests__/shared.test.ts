import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getStatisticsByVideoId } from "../shared";

const originalSpreadsheetId = process.env.SPREADSHEET_ID;
const originalApiKey = process.env.GOOGLE_API_KEY;

describe("stat views shared", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SPREADSHEET_ID = "test-sheet-id";
    process.env.GOOGLE_API_KEY = "test-api-key";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Google SheetsのDateをJSTとして解釈してUTCに変換する", async () => {
    const payload = {
      status: "ok",
      table: {
        rows: [
          {
            c: [
              { v: "Date(2026,1,23,0,15,4)" },
              null,
              null,
              { v: 100 },
              { v: 10 },
              { v: 1 },
              { v: "hYUBjfxfzIk" },
            ],
          },
        ],
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      text: async () =>
        `google.visualization.Query.setResponse(${JSON.stringify(payload)})`,
    } as Response);

    const stats = await getStatisticsByVideoId("hYUBjfxfzIk", "7d");

    expect(stats).not.toBeNull();
    expect(stats).toHaveLength(1);
    expect(stats?.[0]?.datetime?.toISOString()).toBe(
      "2026-02-22T15:15:04.000Z",
    );
  });

  it("periodの基準日をJSTの日付で計算する", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-25T16:30:00.000Z"));

    const payload = {
      status: "ok",
      table: {
        rows: [],
      },
    };

    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      text: async () =>
        `google.visualization.Query.setResponse(${JSON.stringify(payload)})`,
    } as Response);

    await getStatisticsByVideoId("hYUBjfxfzIk", "1d");

    const calledUrl = String(fetchMock.mock.calls[0]?.[0] ?? "");
    const tq = new URL(calledUrl).searchParams.get("tq") ?? "";
    expect(decodeURIComponent(tq)).toContain("A >= date '2026-02-25'");
  });

  afterAll(() => {
    process.env.SPREADSHEET_ID = originalSpreadsheetId;
    process.env.GOOGLE_API_KEY = originalApiKey;
  });
});
