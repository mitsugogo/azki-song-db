import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";
import { encodePlaylistOgPayload } from "@/app/lib/playlistUrl";
import { emptyThemes } from "@/app/lib/myBestNineSongs";
import { emptySlotCategories } from "@/app/lib/bestNineCategories";

const {
  fetchLookupMock,
  fetchWithFallbackMock,
  fetchFontsMock,
  imageResponseElements,
  imageResponseOptions,
} = vi.hoisted(() => ({
  fetchLookupMock: vi.fn(),
  fetchWithFallbackMock: vi.fn(),
  fetchFontsMock: vi.fn().mockResolvedValue([]),
  imageResponseElements: [] as unknown[],
  imageResponseOptions: [] as { width?: number; height?: number }[],
}));

vi.mock("next/og", () => ({
  ImageResponse: class extends Response {
    constructor(
      element: unknown,
      options?: { headers?: HeadersInit; width?: number; height?: number },
    ) {
      super("png", { status: 200, headers: options?.headers });
      imageResponseElements.push(element);
      imageResponseOptions.push(options ?? {});
    }
  },
}));

vi.mock("@/app/lib/server/fetchSongs", () => ({
  fetchSongMetadataLookup: fetchLookupMock,
  fetchSongsFromApiWithRecentFallback: fetchWithFallbackMock,
}));

vi.mock("@/app/api/og/ogDesign", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/app/api/og/ogDesign")>();
  return { ...original, fetchOgFonts: fetchFontsMock };
});

import { GET as getThumb } from "../thumb/route";
import { GET as getGeneric } from "../route";
import { GET as getVideoThumb } from "../videothumb/route";
import { GET as getPlaylist } from "../playlist/route";
import { GET as getBestNine } from "../share/my-best-9-songs/route";

const song: Song = {
  title: "新曲",
  artist: "AZKi",
  hl: { ja: { title: "新曲", artist: "AZKi", artists: ["AZKi"] } },
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "AZKi",
  sings: ["AZKi"],
  video_title: "新曲配信",
  video_uri: "https://youtu.be/new-video",
  video_id: "new-video",
  start: 10,
  end: 0,
  broadcast_at: "2026-08-15T00:00:00.000Z",
  year: 2026,
  tags: ["新曲"],
  milestones: [],
};

const lookupSong = {
  video_id: song.video_id,
  start: song.start,
  title: song.title,
  artist: song.artist,
  video_title: song.video_title,
  broadcast_at: song.broadcast_at,
  tags: song.tags,
};

type ElementNode = {
  props?: {
    children?: unknown;
    src?: string;
    style?: Record<string, unknown>;
    "data-og-slot"?: number;
  };
};

const collectText = (node: unknown): string[] => {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(collectText);
  if (
    node &&
    typeof node === "object" &&
    "props" in node &&
    typeof node.props === "object" &&
    node.props
  ) {
    return collectText(node.props.children);
  }
  return [];
};

const collectElements = (node: unknown): ElementNode[] => {
  if (Array.isArray(node)) return node.flatMap(collectElements);
  if (
    node &&
    typeof node === "object" &&
    "props" in node &&
    typeof node.props === "object" &&
    node.props
  ) {
    return [node, ...collectElements(node.props.children)];
  }
  return [];
};

describe("generic OG cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imageResponseElements.length = 0;
    imageResponseOptions.length = 0;
    fetchFontsMock.mockResolvedValue([]);
  });

  it("従来URLをそのまま描画し、ブラウザ7日・Vercel CDN 1年でキャッシュする", async () => {
    const response = await getGeneric(
      new Request(
        "https://example.test/api/og?title=タイトル&subtitle=説明&w=1200&h=630",
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=604800, stale-while-revalidate=900",
    );
    expect(response.headers.get("Vercel-CDN-Cache-Control")).toBe(
      "public, max-age=31536000",
    );
    expect(fetchFontsMock).toHaveBeenCalledOnce();
    const image = imageResponseElements.at(-1);
    const elements = collectElements(image);

    expect(collectText(image)).toEqual(
      expect.arrayContaining(["タイトル", "説明"]),
    );
    expect(
      elements.some((item) =>
        item.props?.src?.startsWith("data:image/png;base64,"),
      ),
    ).toBe(true);
  });
});

describe("OG song freshness routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imageResponseElements.length = 0;
    imageResponseOptions.length = 0;
    fetchFontsMock.mockResolvedValue([]);
  });

  it("thumbはlookupで見つかった新曲を200で描画する", async () => {
    fetchLookupMock.mockResolvedValue([lookupSong]);

    const response = await getThumb(
      new Request(
        "https://example.test/api/og/thumb?v=new-video&t=10s&hl=ja",
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(fetchLookupMock).toHaveBeenCalledWith({
      locale: "ja",
      videoId: "new-video",
      start: "10",
      baseUrlOverride: "https://example.test",
    });
    expect(fetchFontsMock).toHaveBeenCalledWith(expect.any(String), "detail");
    const image = imageResponseElements.at(-1);
    const elements = collectElements(image);
    const thumbnail = elements.find(
      (item) =>
        item.props?.src ===
        "https://img.youtube.com/vi/new-video/maxresdefault.jpg",
    );

    expect(collectText(image)).toEqual(
      expect.arrayContaining(["新曲", "AZKi"]),
    );
    expect(thumbnail?.props?.style).toEqual(
      expect.objectContaining({ objectFit: "contain" }),
    );
    expect(
      elements.some(
        (item) =>
          item.props?.style?.width === 480 && item.props?.style?.height === 270,
      ),
    ).toBe(true);
    expect(
      elements.some((item) => item.props?.style?.padding === "192px 58px 72px"),
    ).toBe(true);
  });

  it("videothumbはlookupで見つかった新曲を200で描画する", async () => {
    fetchLookupMock.mockResolvedValue([lookupSong]);

    const response = await getVideoThumb(
      new Request(
        "https://example.test/api/og/videothumb?v=new-video&t=10s&hl=ja",
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(fetchLookupMock).toHaveBeenCalledWith({
      locale: "ja",
      videoId: "new-video",
      baseUrlOverride: "https://example.test",
    });
    expect(fetchFontsMock).toHaveBeenCalledWith(expect.any(String), "detail");
    const image = imageResponseElements.at(-1);
    const elements = collectElements(image);
    const thumbnail = elements.find(
      (item) =>
        item.props?.src ===
        "https://img.youtube.com/vi/new-video/maxresdefault.jpg",
    );

    expect(collectText(image)).toEqual(expect.arrayContaining(["新曲"]));
    expect(collectText(image)).not.toContain("Song detail");
    expect(thumbnail?.props?.style).toEqual(
      expect.objectContaining({ objectFit: "contain" }),
    );
    expect(
      elements.some(
        (item) =>
          item.props?.style?.maxWidth === 612 &&
          item.props?.style?.paddingTop === 0,
      ),
    ).toBe(true);
    expect(
      elements.some((item) => item.props?.style?.padding === "192px 58px 72px"),
    ).toBe(true);
  });

  it("配信アーカイブには収録曲数を表示しない", async () => {
    fetchLookupMock.mockResolvedValue([
      lookupSong,
      { ...lookupSong, title: "次の収録曲", start: 120 },
    ]);

    const response = await getVideoThumb(
      new Request(
        "https://example.test/api/og/videothumb?v=new-video&hl=ja",
      ) as never,
    );

    expect(response.status).toBe(200);
    const text = collectText(imageResponseElements.at(-1));
    expect(text).toEqual(expect.arrayContaining(["新曲配信"]));
    expect(text).not.toContain("2曲収録の配信アーカイブ");
  });

  it("アートトラックは正方形トリミング用レイアウトを選ぶ", async () => {
    fetchLookupMock.mockResolvedValue([
      { ...lookupSong, tags: ["オリ曲", "アートトラック"] },
    ]);

    const response = await getThumb(
      new Request(
        "https://example.test/api/og/thumb?v=new-video&t=10s&hl=ja",
      ) as never,
    );

    expect(response.status).toBe(200);
    const elements = collectElements(imageResponseElements.at(-1));
    const thumbnail = elements.find(
      (item) =>
        item.props?.src ===
        "https://img.youtube.com/vi/new-video/maxresdefault.jpg",
    );

    expect(thumbnail?.props?.style).toEqual(
      expect.objectContaining({ objectFit: "cover" }),
    );
    expect(
      elements.some(
        (item) =>
          item.props?.style?.width === 410 && item.props?.style?.height === 410,
      ),
    ).toBe(true);
    expect(
      elements.some((item) => item.props?.style?.padding === "152px 58px 72px"),
    ).toBe(true);
  });

  it("playlistは通常ミス後のrecent曲で画像を200描画する", async () => {
    fetchWithFallbackMock.mockImplementation(
      async (
        _options: unknown,
        hasExpectedSongs: (songs: Song[]) => boolean,
      ) => {
        expect(hasExpectedSongs([])).toBe(false);
        expect(hasExpectedSongs([song])).toBe(true);
        return [song];
      },
    );
    const payload = encodePlaylistOgPayload({
      name: "新曲プレイリスト",
      songs: [{ videoId: "new-video", start: "10" }],
    });

    const response = await getPlaylist(
      new Request(
        `https://example.test/api/og/playlist?p=${payload}&hl=ja&w=1200&h=630`,
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(fetchFontsMock).toHaveBeenCalledWith(expect.any(String), "playlist");
  });

  it("好きな曲9選は通常ミス後のrecent曲で画像を200描画する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        selection: {
          title: "新曲9選",
          author: "tester",
          songs: [{ v: "new-video", s: "10" }],
        },
      }),
    );
    fetchWithFallbackMock.mockImplementation(
      async (
        _options: unknown,
        hasExpectedSongs: (songs: Song[]) => boolean,
      ) => {
        expect(hasExpectedSongs([])).toBe(false);
        expect(hasExpectedSongs([song])).toBe(true);
        return [song];
      },
    );

    const response = await getBestNine(
      new Request(
        "https://example.test/api/og/share/my-best-9-songs?id=new-selection&hl=ja",
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(fetchFontsMock).toHaveBeenCalledWith(
      expect.any(String),
      "best-nine",
    );
    expect(imageResponseOptions.at(-1)).toMatchObject({
      width: 1200,
      height: 630,
    });
    const cards = collectElements(imageResponseElements.at(-1)).filter(
      (element) => element.props?.["data-og-slot"] !== undefined,
    );
    expect(cards).toHaveLength(9);
    const children = cards[0].props?.children as ElementNode[];
    expect(collectText(children[0]).join("")).toBe("1.");
    expect(collectText(children[1]).join("")).toContain("新曲");
    expect(collectText(children[1]).join("")).toContain("AZKi");
    const thumbnail = collectElements(cards[0]).find(
      (element) => element.props?.src,
    );
    expect(thumbnail?.props?.style).toMatchObject({
      width: 176,
      height: 99,
      objectFit: "contain",
    });
    expect(thumbnail?.props?.style?.position).toBeUndefined();
  });

  it("9選のお題・欠損・重複の枠位置を画像でも保つ", async () => {
    const themes = emptyThemes();
    themes[0] = "取得できない曲のお題";
    themes[7] = "長いお題".repeat(8);
    themes[8] = "歌枠のお題";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        selection: {
          title: "お題付き",
          themes,
          songs: [
            { v: "missing", s: "0", slot: 0 },
            { v: "new-video", s: "10", slot: 7 },
            { v: "new-video", s: "10", slot: 8 },
          ],
        },
      }),
    );
    fetchWithFallbackMock.mockResolvedValue([song]);
    const response = await getBestNine(
      new Request(
        "https://example.test/api/og/share/my-best-9-songs?id=themed",
      ) as never,
    );
    expect(response.status).toBe(200);
    const cards = collectElements(imageResponseElements.at(-1)).filter(
      (element) => element.props?.["data-og-slot"] !== undefined,
    );
    expect(cards).toHaveLength(9);
    expect(collectText(cards[0]).join("")).toContain("1. 取得できない曲のお題");
    expect(
      collectElements(cards[0]).some((element) => element.props?.src),
    ).toBe(false);
    expect(
      collectElements(cards[1]).some((element) => element.props?.src),
    ).toBe(false);
    expect(collectText(cards[7]).join("")).toContain("新曲");
    expect(collectText(cards[8]).join("")).toContain("9. 歌枠のお題");
    expect(
      collectElements(cards[8]).some((element) => element.props?.src),
    ).toBe(true);
    expect(
      collectElements(cards[7]).some(
        (element) => element.props?.style?.lineClamp === 2,
      ),
    ).toBe(true);
    expect(fetchFontsMock).toHaveBeenCalledWith(
      expect.stringContaining("歌枠のお題"),
      "best-nine",
    );
    expect(collectText(cards[0]).join("")).toContain("曲が見つかりません");
    expect(collectText(cards[1]).join("")).toContain("未回答");
  });

  it("お題文が空でもカテゴリを設定した回答の枠を詰めない", async () => {
    const slotCategories = emptySlotCategories();
    slotCategories[8] = ["original"];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        selection: {
          title: "カテゴリ別",
          themes: emptyThemes(),
          slotCategories,
          songs: [{ v: "new-video", s: "10", slot: 8 }],
        },
      }),
    );
    fetchWithFallbackMock.mockResolvedValue([song]);
    const response = await getBestNine(
      new Request(
        "https://example.test/api/og/share/my-best-9-songs?id=slots",
      ) as never,
    );
    expect(response.status).toBe(200);
    const cards = collectElements(imageResponseElements.at(-1)).filter(
      (element) => element.props?.["data-og-slot"] !== undefined,
    );
    expect(cards).toHaveLength(9);
    expect(collectText(cards[0]).join("")).toContain("未回答");
    expect(collectText(cards[8]).join("")).toContain("新曲");
  });

  it("9選の寸法指定は構成全体を拡縮し、不正な寸法は既定値へ戻す", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({
        selection: { title: "9選", songs: [{ v: "new-video", s: "10" }] },
      }),
    );
    fetchWithFallbackMock.mockResolvedValue([song]);
    await getBestNine(
      new Request(
        "https://example.test/api/og/share/my-best-9-songs?id=test&w=600&h=315",
      ) as never,
    );
    expect(imageResponseOptions.at(-1)).toMatchObject({
      width: 600,
      height: 315,
    });
    expect(
      collectElements(imageResponseElements.at(-1)).some(
        (element) => element.props?.style?.transform === "scale(0.5)",
      ),
    ).toBe(true);
    await getBestNine(
      new Request(
        "https://example.test/api/og/share/my-best-9-songs?id=test&w=NaN&h=0",
      ) as never,
    );
    expect(imageResponseOptions.at(-1)).toMatchObject({
      width: 1200,
      height: 630,
    });
  });
});
