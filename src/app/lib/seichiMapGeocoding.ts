import type { SeichiMapLocationRegionName } from "../types/seichiMapAchievements";

export type SeichiMapGeocodePoint = {
  locationId: string;
  latitude: number;
  longitude: number;
};

export type SeichiMapGeocodeResult = {
  region: Exclude<SeichiMapLocationRegionName, "UNKNOWN">;
  prefectureCode: string | null;
};

export type SeichiMapMunicipalityLookup = (
  point: Pick<SeichiMapGeocodePoint, "latitude" | "longitude">,
) => Promise<string | null>;

/** 海岸・橋・島の地点は少しずらすと市区町村が見つかることが多い。 */
const OFFSET_DEGREES = [0.005, 0.01, 0.02, 0.03];
const OFFSET_DIRECTIONS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** 日本の領域を大きく外れる地点は、ずらして再検索せずに国外とする。 */
const isFarOutsideJapan = ({
  latitude,
  longitude,
}: Pick<SeichiMapGeocodePoint, "latitude" | "longitude">) =>
  latitude < 20 || latitude > 46 || longitude < 122 || longitude > 154;

export function toPrefectureCode(municipalityCode: string): string | null {
  const digits = municipalityCode.trim();
  if (!/^\d{4,6}$/.test(digits)) return null;
  const prefecture = digits.padStart(5, "0").slice(0, 2);
  const value = Number(prefecture);
  return value >= 1 && value <= 47 ? prefecture : null;
}

/**
 * 1地点の国内・国外と都道府県を判定する。
 * 逆ジオコーダの通信エラーは例外にし、判定済みとして扱わない。
 */
export async function geocodeSeichiMapPoint(
  point: Pick<SeichiMapGeocodePoint, "latitude" | "longitude">,
  lookup: SeichiMapMunicipalityLookup,
): Promise<SeichiMapGeocodeResult> {
  const resolve = (code: string | null): SeichiMapGeocodeResult | null => {
    const prefectureCode = code ? toPrefectureCode(code) : null;
    return prefectureCode ? { region: "DOMESTIC", prefectureCode } : null;
  };

  const direct = resolve(await lookup(point));
  if (direct) return direct;
  if (isFarOutsideJapan(point)) {
    return { region: "OVERSEAS", prefectureCode: null };
  }
  for (const offset of OFFSET_DEGREES) {
    for (const [latitudeSign, longitudeSign] of OFFSET_DIRECTIONS) {
      const shifted = resolve(
        await lookup({
          latitude: point.latitude + latitudeSign * offset,
          longitude: point.longitude + longitudeSign * offset,
        }),
      );
      if (shifted) return shifted;
    }
  }
  return { region: "OVERSEAS", prefectureCode: null };
}

/**
 * 複数地点をまとめて判定する。期限を過ぎたら新しい地点の判定を始めず、
 * 判定できなかった地点は結果に含めない（呼び出し側で未判定のまま残す）。
 */
export async function geocodeSeichiMapPoints(
  points: readonly SeichiMapGeocodePoint[],
  options: {
    lookup: SeichiMapMunicipalityLookup;
    deadline: number;
    concurrency?: number;
    now?: () => number;
  },
): Promise<Map<string, SeichiMapGeocodeResult>> {
  const results = new Map<string, SeichiMapGeocodeResult>();
  const now = options.now ?? Date.now;
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < points.length && now() < options.deadline) {
      const point = points[nextIndex];
      nextIndex += 1;
      try {
        results.set(
          point.locationId,
          await geocodeSeichiMapPoint(point, options.lookup),
        );
      } catch (error) {
        console.error("Failed to geocode seichi map location", error);
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.max(1, options.concurrency ?? 5) }, () =>
      worker(),
    ),
  );
  return results;
}
