import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyThemes } from "../myBestNineSongs";
const { append, get } = vi.hoisted(() => ({ append: vi.fn(), get: vi.fn() }));
vi.mock("googleapis", () => ({
  google: {
    auth: { GoogleAuth: class {} },
    sheets: () => ({ spreadsheets: { values: { append, get } } }),
  },
}));
import {
  createMyBestNineSongsEntry,
  findMyBestNineSongsEntryById,
} from "../myBestNineSongsSheet";

describe("9選のSheets保存とAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SAVE_SPREADSHEET_ID", "test-sheet");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "test@example.test");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "test-key");
    append.mockResolvedValue({});
  });
  afterEach(() => vi.unstubAllEnvs());

  it("JSON欄だけでお題と空き枠を往復し、列構造を変えない", async () => {
    const selection = {
      title: "お題",
      themes: ["出会い", ...emptyThemes().slice(1)],
      songs: [{ v: "v", s: "0", slot: 8 }],
    };
    const result = await createMyBestNineSongsEntry(selection);
    const args = append.mock.calls[0][0];
    expect(args.range).toBe("'推し曲9選'!A:E");
    expect(args.valueInputOption).toBe("RAW");
    const row = args.requestBody.values[0];
    expect(row).toHaveLength(5);
    expect(JSON.parse(row[1])).toEqual(selection);
    get.mockResolvedValue({ data: { values: [row] } });
    expect((await findMyBestNineSongsEntryById(result.id))?.selection).toEqual(
      selection,
    );
  });

  it("旧データを読み込む", async () => {
    const selection = { title: "旧9選", songs: [{ v: "v", s: "0" }] };
    get.mockResolvedValue({
      data: {
        values: [["legacy-id", JSON.stringify(selection), "旧9選", "", "date"]],
      },
    });
    expect(
      (await findMyBestNineSongsEntryById("legacy-id"))?.selection,
    ).toEqual(selection);
  });

  it.each([
    { themes: ["1題だけ"] },
    { themes: Array(9).fill("あ".repeat(51)) },
    { themes: Array(9).fill("題"), songs: [{ v: "v", s: "0", slot: 9 }] },
    {
      themes: Array(9).fill("題"),
      songs: [
        { v: "v", s: "0", slot: 1 },
        { v: "w", s: "0", slot: 1 },
      ],
    },
  ])("不正な旧形式データを拒否し書き込まない", async (invalid) => {
    await expect(
      createMyBestNineSongsEntry({
        title: "テスト",
        songs: [{ v: "v", s: "0" }],
        ...invalid,
      }),
    ).rejects.toThrow("保存データが不正です");
    expect(append).not.toHaveBeenCalled();
  });
});
