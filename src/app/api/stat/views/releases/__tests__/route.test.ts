import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    statistics: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/app/lib/prisma";
import { NextRequest } from "next/server";
import { GET } from "../route";

describe("release view statistics route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("専用の再生数履歴とキャッシュヘッダーを返す", async () => {
    vi.spyOn(prisma.statistics, "findMany").mockResolvedValue([
      {
        videoId: "video-1",
        datetime: new Date("2026-07-10T00:00:00.000Z"),
        viewCount: 123456,
      },
    ] as any);

    const response = await GET(
      new NextRequest("http://localhost/api/stat/views/releases?period=7d"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      statistics: {
        "video-1": [
          {
            datetime: "2026-07-10T00:00:00.000Z",
            viewCount: 123456,
          },
        ],
      },
    });
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");
    expect(response.headers.get("vercel-cache-tag")).toBe(
      "stat:views,stat:views:releases",
    );
  });

  it("不正な期間では400を返す", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/stat/views/releases?period=weekly"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid period",
    });
    expect(prisma.statistics.findMany).not.toHaveBeenCalled();
  });

  it("DB取得に失敗した場合は500を返す", async () => {
    vi.spyOn(prisma.statistics, "findMany").mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await GET(
      new NextRequest("http://localhost/api/stat/views/releases"),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch release view statistics",
    });
  });
});
