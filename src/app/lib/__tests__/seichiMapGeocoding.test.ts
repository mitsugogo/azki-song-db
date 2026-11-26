import { describe, expect, it, vi } from "vitest";
import {
  geocodeSeichiMapPoint,
  geocodeSeichiMapPoints,
  toPrefectureCode,
} from "../seichiMapGeocoding";

describe("seichi map geocoding", () => {
  it("市区町村コードから都道府県コードを取り出す", () => {
    expect(toPrefectureCode("13101")).toBe("13");
    expect(toPrefectureCode("1101")).toBe("01");
    expect(toPrefectureCode("47207")).toBe("47");
    expect(toPrefectureCode("99999")).toBeNull();
    expect(toPrefectureCode("abc")).toBeNull();
  });

  it("そのまま見つかればずらして再検索しない", async () => {
    const lookup = vi.fn().mockResolvedValue("37324");
    await expect(
      geocodeSeichiMapPoint({ latitude: 34.48, longitude: 134.25 }, lookup),
    ).resolves.toEqual({ region: "DOMESTIC", prefectureCode: "37" });
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("海上の地点はずらして再検索し、見つかった都道府県を使う", async () => {
    const lookup = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("28108");
    await expect(
      geocodeSeichiMapPoint({ latitude: 34.63, longitude: 135.03 }, lookup),
    ).resolves.toEqual({ region: "DOMESTIC", prefectureCode: "28" });
    expect(lookup).toHaveBeenCalledTimes(3);
    expect(lookup.mock.calls[1][0].latitude).toBeCloseTo(34.635);
    expect(lookup.mock.calls[1][0].longitude).toBeCloseTo(135.03);
  });

  it("ずらしても見つからなければ国外とする", async () => {
    const lookup = vi.fn().mockResolvedValue(null);
    await expect(
      geocodeSeichiMapPoint({ latitude: 37.66, longitude: 126.74 }, lookup),
    ).resolves.toEqual({ region: "OVERSEAS", prefectureCode: null });
    expect(lookup).toHaveBeenCalledTimes(33);
  });

  it("日本から大きく離れた地点は再検索せずに国外とする", async () => {
    const lookup = vi.fn().mockResolvedValue(null);
    await expect(
      geocodeSeichiMapPoint({ latitude: 40.75, longitude: -74 }, lookup),
    ).resolves.toEqual({ region: "OVERSEAS", prefectureCode: null });
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("通信エラーの地点と期限後の地点は結果に含めない", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    let clock = 0;
    const lookup = vi.fn(async ({ latitude }: { latitude: number }) => {
      clock += 10;
      if (latitude === 2) throw new Error("network");
      return "13101";
    });
    const results = await geocodeSeichiMapPoints(
      [1, 2, 3, 4].map((latitude) => ({
        locationId: `id-${latitude}`,
        latitude,
        longitude: 140,
      })),
      { lookup, deadline: 25, concurrency: 1, now: () => clock },
    );
    expect([...results.keys()]).toEqual(["id-1", "id-3"]);
    expect(lookup).toHaveBeenCalledTimes(3);
    consoleError.mockRestore();
  });
});
