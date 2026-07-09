import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    statistics: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/app/lib/prisma";
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

  it("データベースの統計レコードを日時昇順で返す", async () => {
    const findManyMock = vi
      .spyOn(prisma.statistics, "findMany")
      .mockResolvedValue([
        {
          videoId: "hYUBjfxfzIk",
          datetime: new Date("2026-02-22T15:15:04.000Z"),
          viewCount: 100,
          likeCount: 10,
          commentCount: 1,
        },
      ] as any);

    const stats = await getStatisticsByVideoId("hYUBjfxfzIk", "7d");

    expect(findManyMock).toHaveBeenCalled();
    expect(stats).not.toBeNull();
    expect(stats).toHaveLength(1);
    expect(stats?.[0]?.datetime?.toISOString()).toBe(
      "2026-02-22T15:15:04.000Z",
    );
  });

  it("periodフィルタを有効にしてデータベースを検索する", async () => {
    const findManyMock = vi
      .spyOn(prisma.statistics, "findMany")
      .mockResolvedValue([] as any);

    await getStatisticsByVideoId("hYUBjfxfzIk", "1d");

    expect(findManyMock).toHaveBeenCalled();
    const calledWhere = findManyMock.mock.calls[0]?.[0]?.where;
    expect(calledWhere).toBeDefined();
    expect(calledWhere.videoId).toEqual({ in: ["hYUBjfxfzIk"] });
    expect(calledWhere.datetime).toBeDefined();
    expect(calledWhere.datetime.gte).toBeInstanceOf(Date);
  });

  afterAll(() => {
    process.env.SPREADSHEET_ID = originalSpreadsheetId;
    process.env.GOOGLE_API_KEY = originalApiKey;
  });
});
