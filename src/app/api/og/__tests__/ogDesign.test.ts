import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOgFonts } from "../ogDesign";

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
