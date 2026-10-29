import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { database, sheet } = vi.hoisted(() => ({
  database: vi.fn(),
  sheet: vi.fn(),
}));
vi.mock("@/app/lib/server/bestNineTopics", () => ({
  loadBestNineResponse: database,
}));
vi.mock("@/app/lib/myBestNineSongsSheet", () => ({
  findMyBestNineSongsEntryById: sheet,
}));
import { GET } from "../[id]/route";
const entry = {
  id: "response-id",
  selection: { title: "題", songs: [{ v: "video", s: "0" }] },
};
const read = () =>
  GET(new Request("https://example.test/"), {
    params: Promise.resolve({ id: "response-id" }),
  });

describe("DB共有回答と旧URLの互換性", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("SAVE_SPREADSHEET_ID", "legacy-sheet");
  });
  afterEach(() => vi.unstubAllEnvs());
  it("DBの回答を優先し、更新される回答をキャッシュしない", async () => {
    database.mockResolvedValue(entry);
    const response = await read();
    expect(await response.json()).toEqual(entry);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sheet).not.toHaveBeenCalled();
  });
  it.each([false, true])(
    "旧回答はスプレッドシートから読み取る（DB障害=%s）",
    async (failure) => {
      if (failure)
        database.mockRejectedValue(new Error("internal database error"));
      else database.mockResolvedValue(null);
      sheet.mockResolvedValue(entry);
      expect((await read()).status).toBe(200);
    },
  );
  it("DB障害時に見つからない回答は詳細を漏らさず503を返す", async () => {
    database.mockRejectedValue(new Error("internal database error"));
    sheet.mockResolvedValue(null);
    const response = await read();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "SERVICE_UNAVAILABLE" });
  });
});
