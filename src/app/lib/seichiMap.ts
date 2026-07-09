import { createHash } from "node:crypto";

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

export function parseSeichiMapKml(kml: string): SeichiMapLocation[] {
  const folders = Array.from(kml.matchAll(/<Folder>([\s\S]*?)<\/Folder>/g));
  const searchBlocks =
    folders.length > 0
      ? folders.map((match) => match[1])
      : [readTag(kml, "Document") || kml];

  const locations: SeichiMapLocation[] = [];

  for (const folderBlock of searchBlocks) {
    const folder = readTag(folderBlock, "name") || "未分類";
    const placemarks = folderBlock.matchAll(
      /<Placemark>([\s\S]*?)<\/Placemark>/g,
    );

    for (const placemarkMatch of placemarks) {
      const placemark = placemarkMatch[1];
      const name = readTag(placemark, "name");
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
        description: readTag(placemark, "description"),
        styleUrl: readTag(placemark, "styleUrl"),
        latitude,
        longitude,
      };

      locations.push({
        id: createLocationId(item),
        ...item,
      });
    }
  }

  return locations;
}
