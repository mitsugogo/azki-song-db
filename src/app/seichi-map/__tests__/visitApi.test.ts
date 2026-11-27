import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteSeichiMapVisit, saveSeichiMapVisit } from "../visitApi";

const messages = { saveFailed: "保存に失敗", updateFailed: "更新に失敗" };
const input = {
  locationId: "aaaaaaaaaaaaaaaa",
  locationName: "地点A",
  visitedDate: "2026-11-27",
  note: "",
  url: "",
};

const stubFetch = (response: Response) => {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("saveSeichiMapVisit", () => {
  it("id が無ければ POST し、日付を UTC 0時の ISO 形式で送る", async () => {
    const fetchMock = stubFetch(
      Response.json({ item: { id: "v1" }, unlockedAchievements: [] }),
    );

    const result = await saveSeichiMapVisit(input, messages);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/seichi-map/visited");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      locationId: "aaaaaaaaaaaaaaaa",
      locationName: "地点A",
      visitedAt: "2026-11-27T00:00:00.000Z",
      note: "",
      url: "",
    });
    expect(result).toEqual({ item: { id: "v1" }, unlockedAchievements: [] });
  });

  it("id があれば PUT し、body に id を含める", async () => {
    const fetchMock = stubFetch(Response.json({ item: { id: "v1" } }));

    await saveSeichiMapVisit({ ...input, id: "v1" }, messages);

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body).id).toBe("v1");
  });

  it("サーバーのエラー文を優先し、無ければ新規・更新ごとの既定文にする", async () => {
    stubFetch(Response.json({ error: "上限です" }, { status: 400 }));
    await expect(saveSeichiMapVisit(input, messages)).rejects.toThrow(
      "上限です",
    );

    stubFetch(new Response("oops", { status: 500 }));
    await expect(saveSeichiMapVisit(input, messages)).rejects.toThrow(
      "保存に失敗",
    );
    await expect(
      saveSeichiMapVisit({ ...input, id: "v1" }, messages),
    ).rejects.toThrow("更新に失敗");
  });

  it("本文が JSON でない成功応答は空の結果として扱う", async () => {
    stubFetch(new Response("", { status: 201 }));
    await expect(saveSeichiMapVisit(input, messages)).resolves.toEqual({});
  });
});

describe("deleteSeichiMapVisit", () => {
  it("id をエンコードして DELETE する", async () => {
    const fetchMock = stubFetch(new Response(null, { status: 200 }));

    await deleteSeichiMapVisit("a b/c", "削除に失敗");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/seichi-map/visited?id=a%20b%2Fc",
      { method: "DELETE" },
    );
  });

  it("失敗したらエラーにする", async () => {
    stubFetch(Response.json({ error: "他人の記録です" }, { status: 403 }));
    await expect(deleteSeichiMapVisit("v1", "削除に失敗")).rejects.toThrow(
      "他人の記録です",
    );

    stubFetch(new Response("oops", { status: 500 }));
    await expect(deleteSeichiMapVisit("v1", "削除に失敗")).rejects.toThrow(
      "削除に失敗",
    );
  });
});
