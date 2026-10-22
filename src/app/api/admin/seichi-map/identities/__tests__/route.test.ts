import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminSession, preview, apply } = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  preview: vi.fn(),
  apply: vi.fn(),
}));
vi.mock("@/app/lib/admin", () => ({ getAdminSession }));
vi.mock("@/app/lib/server/seichiMapIdentityRegistry", () => ({
  previewSeichiMapIdentityRegistry: preview,
  applySeichiMapIdentityRegistry: apply,
  SeichiMapIdentityError: class extends Error {
    constructor(
      public code: string,
      public status: number,
    ) {
      super(code);
    }
  },
}));

import { SeichiMapIdentityError } from "@/app/lib/server/seichiMapIdentityRegistry";
import { POST } from "../route";

const request = (
  body: unknown,
  origin: string | null = "https://example.com",
) =>
  new Request("https://example.com/api/admin/seichi-map/identities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });

describe("POST /api/admin/seichi-map/identities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAdminSession.mockResolvedValue({ user: { id: "admin" } });
    preview.mockResolvedValue({
      baseVersion: 0,
      candidateHash: "a".repeat(64),
    });
    apply.mockResolvedValue({ version: 1 });
  });

  it("非管理者はKML取得やDB操作を実行できない", async () => {
    getAdminSession.mockResolvedValue(null);
    expect((await POST(request({ action: "preview" }))).status).toBe(403);
    expect(preview).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });

  it.each(["https://other.example.com", "null", null])(
    "同一オリジン以外のPOSTを拒否する: %s",
    async (origin) => {
      expect((await POST(request({ action: "preview" }, origin))).status).toBe(
        403,
      );
      expect(preview).not.toHaveBeenCalled();
    },
  );

  it("プレビューだけを実行し、レスポンスをキャッシュしない", async () => {
    const response = await POST(request({ action: "preview" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(preview).toHaveBeenCalledOnce();
    expect(apply).not.toHaveBeenCalled();
  });

  it("反映にはセッション由来の更新者と確認したバージョン・ハッシュを渡す", async () => {
    const input = {
      action: "apply",
      baseVersion: 2,
      candidateHash: "b".repeat(64),
    };
    const response = await POST(request(input));
    expect(response.status).toBe(200);
    expect(apply).toHaveBeenCalledWith({
      baseVersion: 2,
      candidateHash: input.candidateHash,
      userId: "admin",
    });
  });

  it.each([
    null,
    [],
    {},
    { action: "other" },
    { action: "preview", url: "https://other.com" },
    { action: "preview", identities: [] },
    { action: "apply", baseVersion: -1, candidateHash: "a".repeat(64) },
    { action: "apply", baseVersion: 1.5, candidateHash: "a".repeat(64) },
    { action: "apply", baseVersion: 1, candidateHash: "bad" },
    {
      action: "apply",
      baseVersion: 1,
      candidateHash: "a".repeat(64),
      userId: "other",
    },
  ])("不正なリクエストを拒否する: %j", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(apply).not.toHaveBeenCalled();
    expect(preview).not.toHaveBeenCalled();
  });

  it("壊れたJSONを400にする", async () => {
    expect(
      (
        await POST(
          new Request("https://example.com/api/admin/seichi-map/identities", {
            method: "POST",
            headers: { origin: "https://example.com" },
            body: "{",
          }),
        )
      ).status,
    ).toBe(400);
  });

  it("競合を409として通知する", async () => {
    apply.mockRejectedValue(new SeichiMapIdentityError("conflict", 409));
    const response = await POST(
      request({
        action: "apply",
        baseVersion: 1,
        candidateHash: "a".repeat(64),
      }),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "conflict" });
  });

  it("DBエラーの詳細を外に出さない", async () => {
    preview.mockRejectedValue(new Error("sensitive DB details"));
    const response = await POST(request({ action: "preview" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "storage_failed" });
  });
});
