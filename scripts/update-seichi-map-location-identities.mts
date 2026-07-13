import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import {
  AZKI_SEICHI_MAP_KML_URL,
  updateSeichiMapLocationIdentityRegistry,
  type SeichiMapLocationIdentity,
} from "../src/app/lib/seichiMap.ts";
import locationIdentityRegistry from "../src/app/lib/seichiMapLocationIdentities.json" with { type: "json" };

const response = await fetch(AZKI_SEICHI_MAP_KML_URL, {
  headers: {
    Accept: "application/vnd.google-earth.kml+xml,text/xml,*/*",
  },
});

if (!response.ok) {
  throw new Error(`KMLの取得に失敗しました: ${response.status}`);
}

const registry = updateSeichiMapLocationIdentityRegistry(
  await response.text(),
  locationIdentityRegistry as unknown as SeichiMapLocationIdentity[],
);
const outputPath = fileURLToPath(
  new URL("../src/app/lib/seichiMapLocationIdentities.json", import.meta.url),
);

const formattedRegistry = await format(JSON.stringify(registry), {
  parser: "json",
});
await writeFile(outputPath, formattedRegistry, "utf8");
console.log(`${registry.length}件の地点IDレジストリを更新しました`);
