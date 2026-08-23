import { describe, expect, it, vi } from "vitest";
import {
  SEICHI_MAP_ITINERARY_STORAGE_KEY,
  addSeichiMapItineraryStop,
  buildSeichiMapItineraryGoogleMapsUrl,
  parseSeichiMapItinerary,
  readSeichiMapItinerary,
  removeSeichiMapItineraryStop,
  reorderSeichiMapItineraryStops,
  saveSeichiMapItinerary,
  toggleSeichiMapItineraryStop,
  type SeichiMapItinerary,
} from "../itinerary";

const itinerary: SeichiMapItinerary = {
  startLocation: "新大阪",
  stops: [
    { locationId: "location-a", completed: false },
    { locationId: "location-b", completed: true },
  ],
};

describe("seichi-map itinerary", () => {
  it("保存データを必要なフィールドだけに正規化する", () => {
    expect(
      parseSeichiMapItinerary(
        JSON.stringify({
          startLocation: "新大阪",
          stops: [
            { locationId: "location-a", completed: true, name: "保存しない" },
            { locationId: "location-a", completed: false },
            { locationId: "location-b", completed: "yes" },
            { completed: true },
          ],
        }),
      ),
    ).toEqual({
      startLocation: "新大阪",
      stops: [
        { locationId: "location-a", completed: true },
        { locationId: "location-b", completed: false },
      ],
    });
    expect(parseSeichiMapItinerary("not-json")).toEqual({
      startLocation: "",
      stops: [],
    });
  });

  it("バージョン付きキーで読み書きし、Storage例外を画面へ漏らさない", () => {
    const getItem = vi.fn(() => JSON.stringify(itinerary));
    expect(readSeichiMapItinerary({ getItem })).toEqual(itinerary);
    expect(getItem).toHaveBeenCalledWith(SEICHI_MAP_ITINERARY_STORAGE_KEY);

    const setItem = vi.fn();
    saveSeichiMapItinerary({ setItem }, itinerary);
    expect(setItem).toHaveBeenCalledWith(
      SEICHI_MAP_ITINERARY_STORAGE_KEY,
      JSON.stringify(itinerary),
    );

    expect(
      readSeichiMapItinerary({
        getItem: () => {
          throw new Error("unavailable");
        },
      }),
    ).toEqual({ startLocation: "", stops: [] });
    expect(() =>
      saveSeichiMapItinerary(
        {
          setItem: () => {
            throw new Error("quota exceeded");
          },
        },
        itinerary,
      ),
    ).not.toThrow();
  });

  it("地点の追加・チェック・並べ替え・削除をlocationIdで管理する", () => {
    const added = addSeichiMapItineraryStop(itinerary, "location-c");
    expect(added.stops).toEqual([
      ...itinerary.stops,
      { locationId: "location-c", completed: false },
    ]);
    expect(addSeichiMapItineraryStop(added, "location-c")).toBe(added);

    const toggled = toggleSeichiMapItineraryStop(added, "location-a");
    expect(toggled.stops[0].completed).toBe(true);

    const reordered = reorderSeichiMapItineraryStops(
      toggled,
      "location-c",
      "location-a",
    );
    expect(reordered.stops.map((stop) => stop.locationId)).toEqual([
      "location-c",
      "location-a",
      "location-b",
    ]);

    expect(
      removeSeichiMapItineraryStop(reordered, "location-a").stops.map(
        (stop) => stop.locationId,
      ),
    ).toEqual(["location-c", "location-b"]);
  });

  it("出発地点と訪問順をGoogle Mapsの経路URLへ反映する", () => {
    const url = buildSeichiMapItineraryGoogleMapsUrl(" 新大阪 ", [
      { latitude: 35.1, longitude: 135.1 },
      { latitude: 35.2, longitude: 135.2 },
      { latitude: 35.3, longitude: 135.3 },
    ]);
    const parsedUrl = new URL(url ?? "");

    expect(parsedUrl.origin + parsedUrl.pathname).toBe(
      "https://www.google.com/maps/dir/",
    );
    expect(parsedUrl.searchParams.get("origin")).toBe("新大阪");
    expect(parsedUrl.searchParams.get("waypoints")).toBe(
      "35.1,135.1|35.2,135.2",
    );
    expect(parsedUrl.searchParams.get("destination")).toBe("35.3,135.3");
    expect(buildSeichiMapItineraryGoogleMapsUrl("", [])).toBeNull();
  });
});
