import { createHash } from "node:crypto";
import locationIdentityRegistry from "./seichiMapLocationIdentities.json";

export const AZKI_SEICHI_MAP_KML_URL =
  "https://www.google.com/maps/d/u/0/kml?mid=1YiIPd5jbM-dPhMHAE-RnItvMoKOEV5E&forcekml=1";

export type SeichiMapLocation = {
  id: string;
  folder: string;
  name: string;
  description: string;
  styleUrl: string;
  latitude: number;
  longitude: number;
};

export type SeichiMapLocationIdentity = {
  id: string;
  sourceIds: string[];
  names: string[];
  positions: [number, number][];
  descriptionKeys: string[];
};

type ParsedSeichiMapLocation = Omit<SeichiMapLocation, "id"> & {
  sourceIds: string[];
  normalizedNames: string[];
  descriptionKeys: string[];
};

const defaultLocationIdentityRegistry =
  locationIdentityRegistry as unknown as SeichiMapLocationIdentity[];
const AZKI_NAVI_LAYER_NAME = "AZKiナビ 推しドラご当地ボイス";
const AZKI_NAVI_NAME_SUFFIX_PATTERN = /\s*[（(]AZKiナビ[）)]\s*$/u;
const LIVE_ARCHIVE_LAYER_NAME =
  "LiVE開催・出演会場、過去のコラボ情報アーカイブ";
const TRAILING_PARENTHESIZED_LABEL_PATTERN = /\s*[（(][^（）()]+[）)]\s*$/u;
const ENDED_LOCATION_PREFIX_PATTERN = /^\s*[（(]終了[）)]/u;
const POSITION_MATCH_DISTANCE_METERS = 50;
const EARTH_RADIUS_METERS = 6_371_000;

const decodeXmlEntities = (value: string) => {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

const readTag = (block: string, tag: string) => {
  const match = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  return match ? decodeXmlEntities(match[1]) : "";
};

const createLocationId = (input: {
  folder: string;
  name: string;
  latitude: number;
  longitude: number;
}) => {
  const key = [
    input.folder.trim(),
    input.name.trim(),
    input.latitude.toFixed(7),
    input.longitude.toFixed(7),
  ].join("\n");

  return createHash("sha1").update(key).digest("hex").slice(0, 16);
};

const createIdentityKey = (value: string) =>
  createHash("sha1").update(value).digest("hex").slice(0, 16);

const normalizeLocationName = (value: string) =>
  value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("ja");

const getCompatibleLocationNames = (folder: string, name: string) => {
  const names = [name];
  const normalizedFolder = folder.normalize("NFKC").trim();
  if (
    normalizedFolder === AZKI_NAVI_LAYER_NAME &&
    AZKI_NAVI_NAME_SUFFIX_PATTERN.test(name)
  ) {
    names.unshift(name.replace(AZKI_NAVI_NAME_SUFFIX_PATTERN, "").trim());
  }
  if (
    normalizedFolder === LIVE_ARCHIVE_LAYER_NAME &&
    !ENDED_LOCATION_PREFIX_PATTERN.test(name) &&
    TRAILING_PARENTHESIZED_LABEL_PATTERN.test(name)
  ) {
    names.unshift(
      name.replace(TRAILING_PARENTHESIZED_LABEL_PATTERN, "").trim(),
    );
  }
  return [...new Set(names)];
};

const createCompatibleLocationSourceIds = (input: {
  folder: string;
  name: string;
  latitude: number;
  longitude: number;
}) =>
  getCompatibleLocationNames(input.folder, input.name).map((name) =>
    createLocationId({ ...input, name }),
  );

const normalizeDescriptionText = (value: string) =>
  value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

const normalizeDescriptionUrl = (value: string) => {
  const trimmed = value.replace(/[),.;!?。、）】」』]+$/u, "");
  try {
    const url = new URL(trimmed);
    if (
      url.hostname.toLowerCase() === "mymaps.usercontent.google.com" &&
      url.pathname.startsWith("/hostedimage/")
    ) {
      return null;
    }
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname !== "/") {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString();
  } catch {
    return trimmed;
  }
};

const createDescriptionKeys = (description: string) => {
  const keys = new Set<string>();
  for (const match of description.matchAll(/https?:\/\/[^<\s\]]+/giu)) {
    const normalizedUrl = normalizeDescriptionUrl(match[0]);
    if (normalizedUrl) {
      keys.add(createIdentityKey(`url\n${normalizedUrl}`));
    }
  }

  const normalizedText = normalizeDescriptionText(description);
  if (normalizedText) {
    keys.add(createIdentityKey(`text\n${normalizedText}`));
  }

  return [...keys];
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceMeters = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) => {
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const startLatitude = toRadians(latitudeA);
  const endLatitude = toRadians(latitudeB);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

const buildUniqueIdentityIndex = (
  identities: readonly SeichiMapLocationIdentity[],
  getKeys: (identity: SeichiMapLocationIdentity) => readonly string[],
) => {
  const candidates = new Map<string, Set<string>>();
  for (const identity of identities) {
    for (const key of getKeys(identity)) {
      const ids = candidates.get(key) ?? new Set<string>();
      ids.add(identity.id);
      candidates.set(key, ids);
    }
  }

  const unique = new Map<string, string>();
  for (const [key, ids] of candidates) {
    if (ids.size === 1) {
      unique.set(key, [...ids][0]);
    }
  }
  return unique;
};

const countLocationKeys = (
  locations: readonly ParsedSeichiMapLocation[],
  getKeys: (location: ParsedSeichiMapLocation) => readonly string[],
) => {
  const counts = new Map<string, number>();
  for (const location of locations) {
    for (const key of new Set(getKeys(location))) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
};

const resolveLocationIdentityIds = (
  locations: readonly ParsedSeichiMapLocation[],
  identities: readonly SeichiMapLocationIdentity[],
) => {
  const resolvedIds = new Array<string | null>(locations.length).fill(null);
  const claimedIdentityIds = new Set<string>();

  const claimMatches = (
    getCandidateId: (
      location: ParsedSeichiMapLocation,
      index: number,
    ) => string | null,
  ) => {
    const candidates = locations.map((location, index) =>
      resolvedIds[index] ? null : getCandidateId(location, index),
    );
    const candidateCounts = new Map<string, number>();
    for (const candidate of candidates) {
      if (candidate && !claimedIdentityIds.has(candidate)) {
        candidateCounts.set(
          candidate,
          (candidateCounts.get(candidate) ?? 0) + 1,
        );
      }
    }

    candidates.forEach((candidate, index) => {
      if (
        candidate &&
        !claimedIdentityIds.has(candidate) &&
        candidateCounts.get(candidate) === 1
      ) {
        resolvedIds[index] = candidate;
        claimedIdentityIds.add(candidate);
      }
    });
  };

  const sourceIdIndex = buildUniqueIdentityIndex(
    identities,
    (identity) => identity.sourceIds,
  );
  claimMatches((location) => {
    const candidates = new Set(
      location.sourceIds
        .map((sourceId) => sourceIdIndex.get(sourceId))
        .filter((id): id is string => Boolean(id)),
    );
    return candidates.size === 1 ? [...candidates][0] : null;
  });

  const nameIndex = buildUniqueIdentityIndex(
    identities,
    (identity) => identity.names,
  );
  const nameCounts = countLocationKeys(
    locations,
    (location) => location.normalizedNames,
  );
  claimMatches((location) => {
    const candidates = new Set(
      location.normalizedNames
        .filter((name) => nameCounts.get(name) === 1)
        .map((name) => nameIndex.get(name))
        .filter((id): id is string => Boolean(id)),
    );
    return candidates.size === 1 ? [...candidates][0] : null;
  });

  claimMatches((location) => {
    const candidates = identities.filter(
      (identity) =>
        !claimedIdentityIds.has(identity.id) &&
        identity.positions.some(
          ([latitude, longitude]) =>
            getDistanceMeters(
              location.latitude,
              location.longitude,
              latitude,
              longitude,
            ) <= POSITION_MATCH_DISTANCE_METERS,
        ),
    );
    return candidates.length === 1 ? candidates[0].id : null;
  });

  const descriptionIndex = buildUniqueIdentityIndex(
    identities,
    (identity) => identity.descriptionKeys,
  );
  const descriptionCounts = countLocationKeys(
    locations,
    (location) => location.descriptionKeys,
  );
  claimMatches((location) => {
    const candidates = new Set(
      location.descriptionKeys
        .filter((key) => descriptionCounts.get(key) === 1)
        .map((key) => descriptionIndex.get(key))
        .filter((id): id is string => Boolean(id)),
    );
    return candidates.size === 1 ? [...candidates][0] : null;
  });

  return resolvedIds.map((id, index) => id ?? locations[index].sourceIds[0]);
};

const parseSeichiMapKmlLocations = (kml: string) => {
  const folders = Array.from(kml.matchAll(/<Folder>([\s\S]*?)<\/Folder>/g));
  const searchBlocks =
    folders.length > 0
      ? folders.map((match) => match[1])
      : [readTag(kml, "Document") || kml];

  const locations: ParsedSeichiMapLocation[] = [];

  for (const folderBlock of searchBlocks) {
    const folder = readTag(folderBlock, "name") || "未分類";
    const placemarks = folderBlock.matchAll(
      /<Placemark>([\s\S]*?)<\/Placemark>/g,
    );

    for (const placemarkMatch of placemarks) {
      const placemark = placemarkMatch[1];
      const name = readTag(placemark, "name");
      const description = readTag(placemark, "description");
      const coordinates = readTag(placemark, "coordinates")
        .split(",")
        .map((value) => Number(value.trim()));
      const longitude = coordinates[0];
      const latitude = coordinates[1];

      if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue;
      }

      const item = {
        folder,
        name,
        description,
        styleUrl: readTag(placemark, "styleUrl"),
        latitude,
        longitude,
      };

      locations.push({
        sourceIds: createCompatibleLocationSourceIds(item),
        normalizedNames: getCompatibleLocationNames(folder, name).map(
          normalizeLocationName,
        ),
        descriptionKeys: createDescriptionKeys(description),
        ...item,
      });
    }
  }

  return locations;
};

export function parseSeichiMapKml(
  kml: string,
  identities: readonly SeichiMapLocationIdentity[] = defaultLocationIdentityRegistry,
): SeichiMapLocation[] {
  const locations = parseSeichiMapKmlLocations(kml);
  const resolvedIds = resolveLocationIdentityIds(locations, identities);

  return locations.map(
    (
      {
        sourceIds: _sourceIds,
        normalizedNames: _normalizedNames,
        descriptionKeys: _descriptionKeys,
        ...location
      },
      index,
    ) => ({
      id: resolvedIds[index],
      ...location,
    }),
  );
}

export function updateSeichiMapLocationIdentityRegistry(
  kml: string,
  identities: readonly SeichiMapLocationIdentity[] = defaultLocationIdentityRegistry,
): SeichiMapLocationIdentity[] {
  const locations = parseSeichiMapKmlLocations(kml);
  const resolvedIds = resolveLocationIdentityIds(locations, identities);
  const updatedById = new Map(
    identities.map((identity) => [
      identity.id,
      {
        id: identity.id,
        sourceIds: [...identity.sourceIds],
        names: [...identity.names],
        positions: identity.positions.map(
          ([latitude, longitude]) => [latitude, longitude] as [number, number],
        ),
        descriptionKeys: [...identity.descriptionKeys],
      },
    ]),
  );

  locations.forEach((location, index) => {
    const id = resolvedIds[index];
    const identity = updatedById.get(id) ?? {
      id,
      sourceIds: [],
      names: [],
      positions: [],
      descriptionKeys: [],
    };

    for (const sourceId of location.sourceIds) {
      if (!identity.sourceIds.includes(sourceId)) {
        identity.sourceIds.push(sourceId);
      }
    }
    for (const name of location.normalizedNames) {
      if (!identity.names.includes(name)) {
        identity.names.push(name);
      }
    }
    if (
      !identity.positions.some(
        ([latitude, longitude]) =>
          latitude === location.latitude && longitude === location.longitude,
      )
    ) {
      identity.positions.push([location.latitude, location.longitude]);
    }
    for (const key of location.descriptionKeys) {
      if (!identity.descriptionKeys.includes(key)) {
        identity.descriptionKeys.push(key);
      }
    }
    updatedById.set(id, identity);
  });

  return [...updatedById.values()].sort((a, b) => a.id.localeCompare(b.id));
}
