import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminSession, preview, sync } = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  preview: vi.fn(),
  sync: vi.fn(),
}));
vi.mock("@/app/lib/admin", () => ({ getAdminSession }));
vi.mock("@/app/lib/server/seichiMapAchievements", () => ({
  previewSeichiMapAchievementSync: preview,
  syncSeichiMapAchievementLocations: sync,
  SeichiMapAchievementError: class extends Error {
    constructor(
      public code: string,
      public status: number,
    ) {
      super(code);
    }
  },
}));

import { SeichiMapAchievementError } from "@/app/lib/server/seichiMapAchievements";
import { POST } from "../route";

const request = (
  body: unknown,
  origin: string | null = "https://example.com",
) =>
  new Request("https://example.com/api/admin/seichi-map/achievements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });

describe("POST /api/admin/seichi-map/achievements", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAdminSession.mockResolvedValue({ user: { id: "admin" } });
    preview.mockResolvedValue({ locationCount: 10 });
    sync.mockResolvedValue({ version: 2 });
  });

  it("非管理者や別オリジンからは同期できない", async () => {
    getAdminSession.mockResolvedValueOnce(null);
    expect((await POST(request({ action: "sync" }))).status).toBe(403);
    expect(
      (await POST(request({ action: "sync" }, "https://evil.example"))).status,
    ).toBe(403);
    expect(sync).not.toHaveBeenCalled();
    expect(preview).not.toHaveBeenCalled();
  });

  it("不正なリクエストを拒否する", async () => {
    expect((await POST(request({ action: "other" }))).status).toBe(400);
    expect((await POST(request({ action: "sync", extra: true }))).status).toBe(
      400,
    );
    expect((await POST(request([]))).status).toBe(400);
  });

  it("プレビューと同期を実行する", async () => {
    const previewResponse = await POST(request({ action: "preview" }));
    await expect(previewResponse.json()).resolves.toEqual({
      locationCount: 10,
    });

    const syncResponse = await POST(request({ action: "sync" }));
    expect(sync).toHaveBeenCalledWith({ syncedBy: "admin" });
    await expect(syncResponse.json()).resolves.toEqual({ version: 2 });
  });

  it("既知のエラーはコードを返し、それ以外は詳細を隠す", async () => {
    sync.mockRejectedValueOnce(new SeichiMapAchievementError("conflict", 409));
    const conflict = await POST(request({ action: "sync" }));
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toEqual({ error: "conflict" });

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    sync.mockRejectedValueOnce(new Error("mysql://secret@host"));
    const failed = await POST(request({ action: "sync" }));
    expect(failed.status).toBe(500);
    await expect(failed.json()).resolves.toEqual({ error: "storage_failed" });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("secret");
    consoleError.mockRestore();
  });
});
