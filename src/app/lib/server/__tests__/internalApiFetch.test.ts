import { afterEach, describe, expect, it, vi } from "vitest";
import { internalApiFetch } from "../internalApiFetch";

const origin = "https://azki-song-db.mitsugogo.tech";

describe("internalApiFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    ["GET", "/api/songs?hl=en"],
    ["HEAD", "/api/songs?hl=ja"],
    ["GET", "/api/songs/lookup?hl=en&v=video"],
    ["GET", "/api/lives"],
    ["GET", "/api/share/my-best-9-songs/_-legacyID"],
  ])("%s %s に内部ヘッダーを付ける", async (method, path) => {
    vi.stubEnv("INTERNAL_WAF_TOKEN", "test-token");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response());
    const headers = {
      Cookie: "member=1",
      "X-AZKI-Internal-Token": "caller-token",
    };
    const signal = new AbortController().signal;
    await internalApiFetch(`${origin}${path}`, {
      method,
      headers,
      cache: "no-store",
      signal,
      redirect: "follow",
    });

    const [requestUrl, options] = fetchMock.mock.calls[0]!;
    expect(String(requestUrl)).toBe(`${origin}${path}`);
    expect(options).toMatchObject({
      method,
      cache: "no-store",
      redirect: "error",
      signal,
    });
    expect(new Headers(options?.headers).get("x-azki-internal-token")).toBe(
      "test-token",
    );
    expect(new Headers(options?.headers).get("cookie")).toBe("member=1");
    expect(headers["X-AZKI-Internal-Token"]).toBe("caller-token");
  });

  it.each([
    "https://other.example/api/songs",
    "https://azki-song-db.mitsugogo.tech.other.example/api/songs",
    "http://azki-song-db.mitsugogo.tech/api/songs",
    "https://azki-song-db.mitsugogo.tech:444/api/songs",
    "https://user@azki-song-db.mitsugogo.tech/api/songs",
  ])("許可外のURL %s へは送信しない", async (url) => {
    vi.stubEnv("INTERNAL_WAF_TOKEN", "test-token");
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(internalApiFetch(url)).rejects.toThrow(
      "Untrusted internal API origin",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["POST", "/api/songs"],
    ["GET", "/api/songs/other"],
    ["GET", "/api/og/thumb"],
    ["GET", "/api/share/my-best-9-songs/participant"],
    ["GET", "/api/share/my-best-9-songs/topics"],
    ["GET", "/api/share/my-best-9-songs/topics/example-id"],
    ["HEAD", "/api/share/my-best-9-songs/example-id"],
    ["DELETE", "/api/share/my-best-9-songs/example-id"],
  ])("対象外の %s %s へは送信しない", async (method, path) => {
    vi.stubEnv("INTERNAL_WAF_TOKEN", "test-token");
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(
      internalApiFetch(`${origin}${path}`, { method }),
    ).rejects.toThrow("Unsupported internal API request");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("既知のVercelエイリアスを正規ホストへ変換し、他の転送を追わない", async () => {
    vi.stubEnv("INTERNAL_WAF_TOKEN", "test-token");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new TypeError("unexpected redirect"));
    await expect(
      internalApiFetch("https://azki-song-db.vercel.app/api/songs?hl=en", {
        method: "HEAD",
      }),
    ).rejects.toThrow("unexpected redirect");
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      new URL(`${origin}/api/songs?hl=en`),
      expect.objectContaining({ method: "HEAD", redirect: "error" }),
    );
  });

  it("本番で環境変数がなければ送信前にエラーにする", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("INTERNAL_WAF_TOKEN", undefined);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(internalApiFetch(`${origin}/api/songs`)).rejects.toThrow(
      "INTERNAL_WAF_TOKEN is missing",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([undefined, "test-token"])(
    "ローカル開発への送信に秘密を含めない",
    async (token) => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("INTERNAL_WAF_TOKEN", token);
      const fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response());
      await internalApiFetch("http://localhost:3000/api/lives", {
        headers: { "x-azki-internal-token": "caller-token" },
      });
      expect(
        new Headers(fetchMock.mock.calls[0]?.[1]?.headers).has(
          "x-azki-internal-token",
        ),
      ).toBe(false);
    },
  );

  it("Preview自身のURLへは本番用の秘密を送らない", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "project-commit-team.vercel.app");
    vi.stubEnv("INTERNAL_WAF_TOKEN", "test-token");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response());
    await internalApiFetch("https://project-commit-team.vercel.app/api/songs");
    expect(
      new Headers(fetchMock.mock.calls[0]?.[1]?.headers).has(
        "x-azki-internal-token",
      ),
    ).toBe(false);
  });
});
