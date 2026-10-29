import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { user, create, edit, remove, load, list, results, save, getSaved } =
  vi.hoisted(() => ({
    user: vi.fn(),
    create: vi.fn(),
    edit: vi.fn(),
    remove: vi.fn(),
    load: vi.fn(),
    list: vi.fn(),
    results: vi.fn(),
    save: vi.fn(),
    getSaved: vi.fn(),
  }));
vi.mock("@/app/lib/server/requireUser", () => ({ requireUserId: user }));
vi.mock("@/app/lib/server/bestNineTopics", () => ({
  createBestNineTopic: create,
  editBestNineTopic: edit,
  deleteBestNineTopic: remove,
  loadBestNineTopic: load,
  listBestNineTopics: list,
  getBestNineResults: results,
  saveBestNineResponse: save,
}));
vi.mock("@/app/lib/prisma", () => ({
  getPrisma: () => ({ bestNineResponse: { findFirst: getSaved } }),
}));
import { POST as createTopic, GET as listTopics } from "../topics/route";
import {
  PATCH as editTopic,
  GET as getTopic,
  DELETE as deleteTopic,
} from "../topics/[id]/route";
import { GET as getResults } from "../topics/[id]/results/route";
import { POST as participant } from "../participant/route";
import { POST as answer } from "../route";
import {
  readGuestToken,
  participantKey,
} from "@/app/lib/server/bestNineParticipant";
import { BestNineError } from "@/app/lib/bestNineTopics";

const id = "12345678-1234-4234-8234-123456789abc";
const context = { params: Promise.resolve({ id }) };
const request = (
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
) =>
  new NextRequest(`https://example.test/api/share/my-best-9-songs/${path}`, {
    method,
    headers: {
      origin: "https://example.test",
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

describe("お題と回答のAPI権限", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret");
    user.mockResolvedValue(null);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("ゲストはお題を作成・編集・削除・一覧取得・集計取得できない", async () => {
    const responses = await Promise.all([
      createTopic(request("topics", "POST", { title: "題" })),
      editTopic(request(`topics/${id}`, "PATCH", { title: "題" }), context),
      deleteTopic(request(`topics/${id}`, "DELETE"), context),
      listTopics(request("topics")),
      getResults(request(`topics/${id}/results`), context),
    ]);
    expect(responses.map((response) => response.status)).toEqual([
      401, 401, 401, 401, 401,
    ]);
    expect(create).not.toHaveBeenCalled();
    expect(edit).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(results).not.toHaveBeenCalled();
  });

  it("ログイン済みの作成・編集ではサーバーのユーザーIDを渡す", async () => {
    user.mockResolvedValue("owner");
    create.mockResolvedValue({ id });
    edit.mockResolvedValue({ id, version: 2 });
    expect(
      (
        await createTopic(
          request("topics", "POST", { title: "題", ownerId: "other" }),
        )
      ).status,
    ).toBe(201);
    expect(create).toHaveBeenCalledWith(
      "owner",
      expect.objectContaining({ ownerId: "other" }),
    );
    expect(
      (
        await editTopic(
          request(`topics/${id}`, "PATCH", { version: 1 }),
          context,
        )
      ).status,
    ).toBe(200);
    expect(edit).toHaveBeenCalledWith(id, "owner", { version: 1 });
  });

  it("削除ではセッションのユーザーIDを使用し、共有キャッシュしない", async () => {
    user.mockResolvedValue("owner");
    const response = await deleteTopic(
      request(`topics/${id}?userId=spoofed`, "DELETE"),
      context,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true });
    expect(remove).toHaveBeenCalledWith(id, "owner");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it.each([
    ["FORBIDDEN", 403],
    ["NOT_FOUND", 404],
  ] as const)("削除の%sエラーを返す", async (code, status) => {
    user.mockResolvedValue("other");
    remove.mockRejectedValue(new BestNineError(code, status));
    const response = await deleteTopic(
      request(`topics/${id}`, "DELETE"),
      context,
    );
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: code });
  });

  it("別サイトからの削除を拒否する", async () => {
    user.mockResolvedValue("owner");
    const req = new NextRequest(
      `https://example.test/api/share/my-best-9-songs/topics/${id}`,
      { method: "DELETE", headers: { origin: "https://attacker.test" } },
    );
    expect((await deleteTopic(req, context)).status).toBe(403);
    expect(remove).not.toHaveBeenCalled();
  });

  it.each([
    ["topics", false, 1],
    ["topics?scope=all&page=6", true, 6],
  ] as const)(
    "一覧APIはページと集計範囲をサーバーへ渡す: %s",
    async (path, all, page) => {
      user.mockResolvedValue("owner");
      const body = {
        topics: [],
        total: 125,
        page,
        pageSize: 20,
        totalPages: 7,
      };
      list.mockResolvedValue(body);
      const response = await listTopics(request(path));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(body);
      expect(list).toHaveBeenCalledWith("owner", all, page);
      expect(response.headers.get("cache-control")).toContain("no-store");
    },
  );

  it.each(["0", "-1", "1.5", "NaN", "1e2", "", "9007199254740992"])(
    "不正な一覧ページを拒否する: %s",
    async (page) => {
      user.mockResolvedValue("owner");
      const response = await listTopics(request(`topics?page=${page}`));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "INVALID_PAGE" });
      expect(list).not.toHaveBeenCalled();
    },
  );

  it("他ユーザーの集計アクセスを403で返し、共有キャッシュしない", async () => {
    user.mockResolvedValue("other");
    results.mockRejectedValue(new BestNineError("FORBIDDEN", 403));
    const response = await getResults(request(`topics/${id}/results`), context);
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it.each(["", "?version=2", "?version=NaN"])(
    "集計APIは版パラメータに関わらずお題全体を集計する: %s",
    async (query) => {
      user.mockResolvedValue("owner");
      results.mockResolvedValue({ responseCount: 4 });
      const response = await getResults(
        request(`topics/${id}/results${query}`),
        context,
      );
      expect(response.status).toBe(200);
      expect(results).toHaveBeenCalledWith(id, "owner");
      expect(await response.json()).toEqual({ responseCount: 4 });
    },
  );

  it("別サイトからのお題作成・回答・Cookie発行を拒否する", async () => {
    user.mockResolvedValue("owner");
    const crossSite = () =>
      new NextRequest("https://example.test/api/share/my-best-9-songs", {
        method: "POST",
        headers: {
          origin: "https://attacker.test",
          "content-type": "application/json",
        },
        body: "{}",
      });
    const responses = await Promise.all([
      createTopic(crossSite()),
      answer(crossSite()),
      participant(crossSite()),
    ]);
    expect(responses.map((response) => response.status)).toEqual([
      403, 403, 403,
    ]);
    expect(save).not.toHaveBeenCalled();
  });

  it("署名付きHttpOnly Cookieを発行し、改ざんされた値を拒否する", async () => {
    const response = await participant(request("participant", "POST"));
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/api/share/my-best-9-songs");
    const pair = cookie.split(";")[0];
    const token = readGuestToken(request("", "GET", undefined, pair));
    expect(token).toHaveLength(64);
    const tampered = pair.slice(0, -1) + (pair.endsWith("0") ? "1" : "0");
    expect(readGuestToken(request("", "GET", undefined, tampered))).toBeNull();
    expect(participantKey(id, "guest", token!)).not.toBe(
      participantKey(id, "user", token!),
    );
    expect(participantKey(id, "guest", token!)).not.toBe(
      participantKey("another-topic", "guest", token!),
    );
  });

  it("ゲストはCookieの識別で回答でき、本文のユーザーIDを採用しない", async () => {
    const response = await participant(request("participant", "POST"));
    const cookie = response.headers.get("set-cookie")!.split(";")[0];
    save.mockResolvedValue({ id: "response-id" });
    expect(
      (await answer(request("", "POST", { userId: "spoofed" }, cookie))).status,
    ).toBe(201);
    expect(save).toHaveBeenCalledWith(
      { userId: "spoofed" },
      null,
      expect.any(String),
    );
  });

  it("自分の回答の復元はCookieから決まり、他の回答者のキーを受け付けない", async () => {
    load.mockResolvedValue({ id, version: 1 });
    const response = await participant(request("participant", "POST"));
    const cookie = response.headers.get("set-cookie")!.split(";")[0];
    const token = readGuestToken(request("", "GET", undefined, cookie))!;
    getSaved.mockResolvedValue(null);
    const result = await getTopic(
      request(`topics/${id}?respondentKey=other`, "GET", undefined, cookie),
      context,
    );
    expect(result.status).toBe(200);
    expect(getSaved.mock.calls[0][0].where.revision).toEqual({ topicId: id });
    expect(getSaved.mock.calls[0][0].orderBy).toEqual([
      { updatedAt: "desc" },
      { id: "desc" },
    ]);
    expect(getSaved.mock.calls[0][0].where.respondentKey).toBe(
      participantKey(id, "guest", token),
    );
    expect(result.headers.get("cache-control")).toContain("no-store");
  });

  it("壊れたJSONや大きすぎる入力を拒否する", async () => {
    user.mockResolvedValue("owner");
    const invalid = new NextRequest(
      "https://example.test/api/share/my-best-9-songs/topics",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      },
    );
    expect((await createTopic(invalid)).status).toBe(400);
    expect(
      (
        await createTopic(
          request("topics", "POST", { title: "a".repeat(17000) }),
        )
      ).status,
    ).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
