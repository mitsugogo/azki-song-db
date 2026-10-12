import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchOgFonts,
  loadOgBackgroundImage,
  getOgDetailContentTopPadding,
  getOgDetailThumbnailLayout,
} from "../ogDesign";

const installFontFetchMock = () =>
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.startsWith("https://fonts.googleapis.com/")) {
      const weight = url.match(/wght@(\d+)/)?.[1] ?? "400";
      const family = url.includes("Noto+Sans+JP") ? "noto" : "zen";
      return new Response(
        `@font-face { src: url(https://fonts.example/${family}-${weight}.woff2) format('woff2'); }`,
        { status: 200 },
      );
    }

    expect(init).toEqual(expect.objectContaining({ cache: "force-cache" }));
    return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
  });

describe("fetchOgFonts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detail画像ではNoto Sans JPの400/700だけを取得する", async () => {
    const fetchMock = installFontFetchMock();

    const fonts = await fetchOgFonts("新曲 ♪ AZKi", "detail");

    expect(fonts.map(({ name, weight }) => [name, weight])).toEqual([
      ["Noto Sans JP", 400],
      ["Noto Sans JP", 700],
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(
      fetchMock.mock.calls.every(([, init]) => init?.cache === "force-cache"),
    ).toBe(true);
    const requestedText = new URL(
      String(fetchMock.mock.calls[0][0]),
    ).searchParams.get("text");
    expect(requestedText).not.toBeNull();
    expect(Array.from(requestedText ?? "")).toEqual([
      ...new Set(Array.from(requestedText ?? "")),
    ]);
    expect(requestedText).toContain("新");
    expect(requestedText).toContain("曲");
  });

  it("generic画像では両フォントの400/700を維持する", async () => {
    installFontFetchMock();

    const fonts = await fetchOgFonts("AZKi Song Database", "generic");

    expect(fonts.map(({ name, weight }) => [name, weight])).toEqual([
      ["Zen Maru Gothic", 400],
      ["Zen Maru Gothic", 700],
      ["Noto Sans JP", 400],
      ["Noto Sans JP", 700],
    ]);
  });

  it("playlist画像では700/900だけを取得する", async () => {
    installFontFetchMock();

    const fonts = await fetchOgFonts("Playlist", "playlist");

    expect(fonts.map(({ name, weight }) => [name, weight])).toEqual([
      ["Zen Maru Gothic", 700],
      ["Zen Maru Gothic", 900],
      ["Noto Sans JP", 700],
      ["Noto Sans JP", 900],
    ]);
  });
});

describe("OG共通レイアウト", () => {
  it("背景画像はHTTP取得せず、埋め込み可能なPNGとして読み込む", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    try {
      const source = await loadOgBackgroundImage();
      expect(source).toMatch(/^data:image\/png;base64,/);
      const image = Buffer.from(source.split(",")[1], "base64");
      expect(image.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("アートトラックは正方形へトリミングし、通常動画は16:9を欠けずに配置する", () => {
    expect(getOgDetailThumbnailLayout("artwork")).toMatchObject({
      width: 410,
      height: 410,
      objectFit: "cover",
    });
    expect(getOgDetailThumbnailLayout("video")).toMatchObject({
      width: 480,
      height: 270,
      objectFit: "contain",
    });
  });

  it("16:9サムネイルはサイトタイトルから十分に離れるよう下へ配置する", () => {
    expect(getOgDetailContentTopPadding("artwork")).toBe(152);
    expect(getOgDetailContentTopPadding("video")).toBe(192);
  });
});
