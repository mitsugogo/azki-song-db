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
import {
  getReleaseViewStatistics,
  getStatisticsByVideoId,
  parseViewCountRowsByVideoId,
} from "../shared";

const originalSpreadsheetId = process.env.SPREADSHEET_ID;
const originalApiKey = process.env.GOOGLE_API_KEY;

describe("stat views shared", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
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
    const calledWhere = findManyMock.mock.calls[0]?.[0]?.where as any;
    expect(calledWhere).toBeDefined();
    expect(calledWhere.videoId).toEqual({ in: ["hYUBjfxfzIk"] });
    expect(calledWhere.datetime).toBeDefined();
    expect(calledWhere.datetime.gte).toBeInstanceOf(Date);
  });

  it("オリ曲とカバー曲の再生数履歴だけを取得する", async () => {
    const findManyMock = vi
      .spyOn(prisma.statistics, "findMany")
      .mockResolvedValue([] as any);

    await getReleaseViewStatistics("30d");

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        category: { in: ["オリ曲", "カバー"] },
        videoId: { not: null },
        datetime: { gte: expect.any(Date) },
      },
      orderBy: { datetime: "asc" },
      select: {
        videoId: true,
        datetime: true,
        viewCount: true,
      },
    });
  });

  it("all指定では期間条件を付けない", async () => {
    const findManyMock = vi
      .spyOn(prisma.statistics, "findMany")
      .mockResolvedValue([] as any);

    await getReleaseViewStatistics("all");

    expect(findManyMock.mock.calls[0]?.[0]?.where).toEqual({
      category: { in: ["オリ曲", "カバー"] },
      videoId: { not: null },
    });
  });

  it("再生数履歴を動画IDごとに日時昇順でまとめる", () => {
    const grouped = parseViewCountRowsByVideoId([
      {
        videoId: "video-1",
        datetime: new Date("2026-01-03T00:00:00.000Z"),
        viewCount: 300,
      },
      {
        videoId: null,
        datetime: new Date("2026-01-02T00:00:00.000Z"),
        viewCount: 999,
      },
      {
        videoId: "video-1",
        datetime: new Date("2026-01-01T00:00:00.000Z"),
        viewCount: null,
      },
    ]);

    expect(grouped).toEqual({
      "video-1": [
        {
          datetime: new Date("2026-01-01T00:00:00.000Z"),
          viewCount: 0,
        },
        {
          datetime: new Date("2026-01-03T00:00:00.000Z"),
          viewCount: 300,
        },
      ],
    });
  });

  afterAll(() => {
    process.env.SPREADSHEET_ID = originalSpreadsheetId;
    process.env.GOOGLE_API_KEY = originalApiKey;
  });
});
