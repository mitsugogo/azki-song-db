import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { findUnique, create, updateMany } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
}));
vi.mock("../prisma", () => ({
  prisma: { seichiMapIdentityRegistry: { findUnique, create, updateMany } },
}));

import {
  applySeichiMapIdentityRegistry,
  loadSeichiMapIdentityRegistry,
  previewSeichiMapIdentityRegistry,
} from "../server/seichiMapIdentityRegistry";
import {
  parseSeichiMapKml,
  updateSeichiMapLocationIdentityRegistry,
} from "../seichiMap";
import bundledRegistry from "../seichiMapLocationIdentities.json";
import * as seichiMap from "../seichiMap";

const point = (name: string, lat: number, lon: number) =>
  `<Placemark><name>${name}</name><Point><coordinates>${lon},${lat},0</coordinates></Point></Placemark>`;
const kml = (folder: string, points: string) =>
  `<kml><Document><Folder><name>${folder}</name>${points}</Folder></Document></kml>`;
const beforeKml = kml(
  "旧レイヤー",
  point("地点A", 10, 30) + point("地点B", 11, 31),
);
const nextKml = kml(
  "新レイヤー",
  point("地点A改名", 10, 30) + point("地点C", -10, 40),
);
const identities = updateSeichiMapLocationIdentityRegistry(beforeKml, []);
const record = () => ({
  identities,
  version: 4,
  updatedAt: new Date("2026-10-22T00:00:00Z"),
});

describe("seichi map identity registry", () => {
  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => {
    vi.resetAllMocks();
    findUnique.mockResolvedValue(record());
    create.mockResolvedValue({});
    updateMany.mockResolvedValue({ count: 1 });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(nextKml)),
    );
  });

  it("DB未初期化時だけ同梱レジストリを使う", async () => {
    findUnique.mockResolvedValue(null);
    const result = await loadSeichiMapIdentityRegistry();
    expect(result).toEqual({
      identities: bundledRegistry,
      version: 0,
      updatedAt: null,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("プレビューで新規・履歴追加・過去地点を集計し、DBには保存しない", async () => {
    const preview = await previewSeichiMapIdentityRegistry();
    expect(preview.summary).toEqual({
      locationCount: 2,
      registryCount: 3,
      addedCount: 1,
      updatedCount: 1,
      unchangedCount: 1,
    });
    expect(preview.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "地点A改名", kind: "updated" }),
        expect.objectContaining({ name: "地点C", kind: "added" }),
      ]),
    );
    expect(preview.baseVersion).toBe(4);
    expect(create).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("google.com/maps"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("反映後も改名・レイヤー移動した地点のIDと消えた地点の全履歴を維持し、再生成は冪等", async () => {
    const preview = await previewSeichiMapIdentityRegistry();
    await applySeichiMapIdentityRegistry({ ...preview, userId: "admin" });
    const { data, where } = updateMany.mock.calls[0][0];
    expect(where).toEqual({ key: "azki", version: 4 });
    expect(data).toMatchObject({ version: 5, updatedBy: "admin" });
    for (const old of identities) {
      const updated = data.identities.find(
        (item: { id: string }) => item.id === old.id,
      );
      expect(updated.sourceIds).toEqual(expect.arrayContaining(old.sourceIds));
      expect(updated.names).toEqual(expect.arrayContaining(old.names));
      expect(updated.positions).toEqual(expect.arrayContaining(old.positions));
      expect(updated.descriptionKeys).toEqual(
        expect.arrayContaining(old.descriptionKeys),
      );
    }
    expect(parseSeichiMapKml(nextKml, data.identities)[0].id).toBe(
      parseSeichiMapKml(beforeKml, identities)[0].id,
    );
    findUnique.mockResolvedValue(data);
    const repeated = await previewSeichiMapIdentityRegistry();
    expect(repeated.needsApply).toBe(false);
    expect(repeated.changes).toEqual([]);
    await applySeichiMapIdentityRegistry({ ...repeated, userId: "admin" });
    expect(updateMany).toHaveBeenCalledTimes(1);
  });

  it("同梱JSONと差分がない初回でもDBへ保存できる", async () => {
    findUnique.mockResolvedValue(null);
    const first = bundledRegistry[0];
    // 初回に生成結果と同梱JSONが一致するケースを再現する。
    vi.spyOn(
      seichiMap,
      "updateSeichiMapLocationIdentityRegistry",
    ).mockReturnValue(
      bundledRegistry as unknown as seichiMap.SeichiMapLocationIdentity[],
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            kml(
              "初期化",
              point(
                first.names[0],
                ...(first.positions[0] as [number, number]),
              ),
            ),
          ),
      ),
    );
    const preview = await previewSeichiMapIdentityRegistry();
    expect(preview.baseVersion).toBe(0);
    expect(preview.needsApply).toBe(true);
    expect(preview.changes).toEqual([]);
    await applySeichiMapIdentityRegistry({ ...preview, userId: "admin" });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ key: "azki", version: 1 }),
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("DBがJSONキーの順序を変えても差分にはしない", async () => {
    const updated = updateSeichiMapLocationIdentityRegistry(
      nextKml,
      identities,
    );
    findUnique.mockResolvedValue({
      ...record(),
      identities: updated.map(({ id, ...item }) => ({ ...item, id })),
    });
    expect((await previewSeichiMapIdentityRegistry()).changes).toEqual([]);
  });

  it("確認後に生成結果が変わった場合は保存しない", async () => {
    const preview = await previewSeichiMapIdentityRegistry();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(nextKml.replace("地点C", "地点D"))),
    );
    await expect(
      applySeichiMapIdentityRegistry({ ...preview, userId: "admin" }),
    ).rejects.toMatchObject({ code: "conflict", status: 409 });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("確認後のバージョン変更と保存時の競合を拒否する", async () => {
    const preview = await previewSeichiMapIdentityRegistry();
    findUnique.mockResolvedValue({ ...record(), version: 5 });
    await expect(
      applySeichiMapIdentityRegistry({ ...preview, userId: "admin" }),
    ).rejects.toMatchObject({ code: "conflict" });
    expect(updateMany).not.toHaveBeenCalled();
    findUnique.mockResolvedValue(record());
    updateMany.mockResolvedValue({ count: 0 });
    await expect(
      applySeichiMapIdentityRegistry({ ...preview, userId: "admin" }),
    ).rejects.toMatchObject({ code: "conflict" });
  });

  it("初回作成の競合を上書きせず409にする", async () => {
    findUnique.mockResolvedValue(null);
    const preview = await previewSeichiMapIdentityRegistry();
    create.mockRejectedValue({ code: "P2002" });
    await expect(
      applySeichiMapIdentityRegistry({ ...preview, userId: "admin" }),
    ).rejects.toMatchObject({ code: "conflict", status: 409 });
  });

  it.each([
    "<html>error</html>",
    "<kml></kml>",
    nextKml.replace("</kml>", ""),
    kml("重複", point("同地点", 10, 30).repeat(2)),
    kml("不正", point("範囲外", 91, 30)),
    kml("不正", point("正常", 10, 30) + point("不正", NaN, 40)),
  ])("不正・空・重複KMLを保存しない: %s", async (source) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(source)),
    );
    await expect(previewSeichiMapIdentityRegistry()).rejects.toMatchObject({
      code: expect.stringMatching(/^invalid_/),
    });
    expect(create).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("KML取得失敗を区別する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("error", { status: 503 })),
    );
    await expect(previewSeichiMapIdentityRegistry()).rejects.toMatchObject({
      code: "kml_unavailable",
      status: 502,
    });
  });

  it("DB読込失敗・不正データ時は同梱JSONへ戻さない", async () => {
    findUnique.mockRejectedValue(new Error("DB unavailable"));
    await expect(loadSeichiMapIdentityRegistry()).rejects.toThrow(
      "DB unavailable",
    );
    findUnique.mockResolvedValue({ ...record(), identities: null });
    await expect(loadSeichiMapIdentityRegistry()).rejects.toMatchObject({
      code: "invalid_registry",
    });
  });

  it("DB保存エラーを成功として扱わない", async () => {
    const preview = await previewSeichiMapIdentityRegistry();
    updateMany.mockRejectedValue(new Error("DB unavailable"));
    await expect(
      applySeichiMapIdentityRegistry({ ...preview, userId: "admin" }),
    ).rejects.toThrow("DB unavailable");
  });
});
