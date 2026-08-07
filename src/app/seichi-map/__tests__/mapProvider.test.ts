import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SEICHI_MAP_PROVIDER,
  getLeafletTileLayerConfig,
  readSeichiMapProvider,
  saveSeichiMapProvider,
  SEICHI_MAP_PROVIDER_STORAGE_KEY,
} from "../mapProvider";

describe("seichi map provider preference", () => {
  it("uses GSI Maps when no preference is stored", () => {
    expect(readSeichiMapProvider({ getItem: () => null })).toBe(
      DEFAULT_SEICHI_MAP_PROVIDER,
    );
  });

  it("ignores an invalid stored preference", () => {
    expect(readSeichiMapProvider({ getItem: () => "other-map" })).toBe("gsi");
  });

  it("restores a Google Maps preference", () => {
    expect(readSeichiMapProvider({ getItem: () => "google" })).toBe("google");
  });

  it("restores an OpenStreetMap preference", () => {
    expect(readSeichiMapProvider({ getItem: () => "osm" })).toBe("osm");
  });

  it("stores an explicitly selected provider", () => {
    const setItem = vi.fn();

    saveSeichiMapProvider({ setItem }, "google");

    expect(setItem).toHaveBeenCalledWith(
      SEICHI_MAP_PROVIDER_STORAGE_KEY,
      "google",
    );
  });

  it("provides the expected tile layers for GSI and OpenStreetMap", () => {
    expect(getLeafletTileLayerConfig("gsi").url).toContain(
      "cyberjapandata.gsi.go.jp",
    );
    expect(getLeafletTileLayerConfig("osm")).toMatchObject({
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      maxZoom: 19,
    });
  });
});
