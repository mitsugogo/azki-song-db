export const SEICHI_MAP_PROVIDER_STORAGE_KEY = "azki-seichi-map:provider";

export type SeichiMapProvider = "gsi" | "osm" | "google";

export type LeafletMapProvider = Extract<SeichiMapProvider, "gsi" | "osm">;

export type LeafletTileLayerConfig = {
  url: string;
  attribution: string;
  maxZoom: number;
};

const GSI_TILE_LAYER: LeafletTileLayerConfig = {
  url: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
  attribution:
    '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer">地理院タイル</a>',
  maxZoom: 18,
};

const OSM_TILE_LAYER: LeafletTileLayerConfig = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
  maxZoom: 19,
};

export const DEFAULT_SEICHI_MAP_PROVIDER: SeichiMapProvider = "gsi";

export const isSeichiMapProvider = (
  value: string | null,
): value is SeichiMapProvider =>
  value === "gsi" || value === "osm" || value === "google";

export const isLeafletMapProvider = (
  value: SeichiMapProvider,
): value is LeafletMapProvider => value === "gsi" || value === "osm";

export const getLeafletTileLayerConfig = (
  provider: LeafletMapProvider,
): LeafletTileLayerConfig =>
  provider === "osm" ? OSM_TILE_LAYER : GSI_TILE_LAYER;

export const readSeichiMapProvider = (
  storage: Pick<Storage, "getItem"> | null | undefined,
): SeichiMapProvider => {
  const value = storage?.getItem(SEICHI_MAP_PROVIDER_STORAGE_KEY) ?? null;
  return isSeichiMapProvider(value) ? value : DEFAULT_SEICHI_MAP_PROVIDER;
};

export const saveSeichiMapProvider = (
  storage: Pick<Storage, "setItem"> | null | undefined,
  provider: SeichiMapProvider,
) => {
  storage?.setItem(SEICHI_MAP_PROVIDER_STORAGE_KEY, provider);
};
