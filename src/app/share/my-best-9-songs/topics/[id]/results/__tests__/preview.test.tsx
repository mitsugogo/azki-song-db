import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { load, songs, create } = vi.hoisted(() => ({
  load: vi.fn(),
  songs: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@/app/lib/server/bestNineTopics", () => ({ loadBestNineTopic: load }));
vi.mock("@/app/lib/server/fetchSongs", () => ({
  fetchSongsFromApiCached: songs,
}));
vi.mock("@/app/lib/bestNineResultsPreview", () => ({
  createBestNineResultsPreview: create,
}));
vi.mock("next-intl/server", () => ({
  getLocale: async () => "ja",
  getTranslations: async () => (key: string) => key,
}));
vi.mock("../client", () => ({ default: () => null }));
import Page from "../page";

describe("開発環境限定の集計プレビュー", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    load.mockResolvedValue({ id: "topic", title: "お題" });
    songs.mockResolvedValue([]);
    create.mockReturnValue({ responseCount: 1000 });
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each(["production", "test"])(
    "%sではプレビューを有効化せず、実際の権限確認へ進む",
    async (environment) => {
      vi.stubEnv("NODE_ENV", environment);
      const result = await Page({
        params: Promise.resolve({ id: "topic" }),
        searchParams: Promise.resolve({ preview: "1000" }),
      });
      expect(result.props.previewData).toBeUndefined();
      expect(load).not.toHaveBeenCalled();
      expect(songs).not.toHaveBeenCalled();
    },
  );
  it("開発環境で指定した場合だけ公開のお題・曲からダミーデータを生成する", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = await Page({
      params: Promise.resolve({ id: "topic" }),
      searchParams: Promise.resolve({ preview: "1000" }),
    });
    expect(result.props.previewData).toEqual({ responseCount: 1000 });
    expect(load).toHaveBeenCalledWith("topic");
    expect(create).toHaveBeenCalledWith({ id: "topic", title: "お題" }, []);
  });
  it("通常アクセスはプレビューを生成しない", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = await Page({ params: Promise.resolve({ id: "topic" }) });
    expect(result.props.previewData).toBeUndefined();
    expect(create).not.toHaveBeenCalled();
  });
});
