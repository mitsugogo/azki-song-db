import "server-only";

import { createHash } from "node:crypto";
import { prisma } from "../prisma";
import bundledRegistry from "../seichiMapLocationIdentities.json";
import {
  AZKI_SEICHI_MAP_KML_URL,
  parseSeichiMapKml,
  updateSeichiMapLocationIdentityRegistry,
  type SeichiMapLocationIdentity,
} from "../seichiMap";
import type {
  SeichiMapIdentityErrorCode,
  SeichiMapIdentityPreview,
} from "../../types/seichiMapIdentityRegistry";

const REGISTRY_KEY = "azki";
const ID_PATTERN = /^[0-9a-f]{16}$/;

export class SeichiMapIdentityError extends Error {
  constructor(
    public code: SeichiMapIdentityErrorCode,
    public status: number,
  ) {
    super(code);
  }
}

function validateRegistry(value: unknown): SeichiMapLocationIdentity[] {
  const fail = () => {
    throw new SeichiMapIdentityError("invalid_registry", 500);
  };
  if (!Array.isArray(value) || value.length === 0) return fail();
  const ids = new Set<string>();
  for (const item of value) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !ID_PATTERN.test(item.id) ||
      ids.has(item.id)
    )
      return fail();
    ids.add(item.id);
    for (const key of ["sourceIds", "names", "descriptionKeys"] as const) {
      if (
        !Array.isArray(item[key]) ||
        !item[key].every((entry: unknown) => typeof entry === "string") ||
        new Set(item[key]).size !== item[key].length
      )
        return fail();
    }
    if (
      item.sourceIds.length === 0 ||
      item.names.length === 0 ||
      !item.sourceIds.every((id: string) => ID_PATTERN.test(id)) ||
      !item.descriptionKeys.every((id: string) => ID_PATTERN.test(id)) ||
      !Array.isArray(item.positions) ||
      item.positions.length === 0 ||
      !item.positions.every(
        (position: unknown) =>
          Array.isArray(position) &&
          position.length === 2 &&
          position.every((n) => typeof n === "number" && Number.isFinite(n)) &&
          Math.abs(position[0]) <= 90 &&
          Math.abs(position[1]) <= 180,
      )
    )
      return fail();
  }
  return value as SeichiMapLocationIdentity[];
}

export async function loadSeichiMapIdentityRegistry() {
  // DB障害を「未初期化」と取り違えて古いIDへ戻さない。
  const record = await prisma.seichiMapIdentityRegistry.findUnique({
    where: { key: REGISTRY_KEY },
  });
  if (record && (!Number.isSafeInteger(record.version) || record.version < 1)) {
    throw new SeichiMapIdentityError("invalid_registry", 500);
  }
  return {
    identities: validateRegistry(record ? record.identities : bundledRegistry),
    version: record?.version ?? 0,
    updatedAt: record?.updatedAt.toISOString() ?? null,
  };
}

// JSON列がオブジェクトのキー順を変えても同じ内容として比較する。
const hashRegistry = (identities: SeichiMapLocationIdentity[]) =>
  createHash("sha256")
    .update(
      JSON.stringify(
        [...identities]
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((item) => ({
            id: item.id,
            sourceIds: item.sourceIds,
            names: item.names,
            positions: item.positions,
            descriptionKeys: item.descriptionKeys,
          })),
      ),
    )
    .digest("hex");

async function generateCandidate() {
  const current = await loadSeichiMapIdentityRegistry();
  let kml: string;
  try {
    const response = await fetch(AZKI_SEICHI_MAP_KML_URL, {
      cache: "no-store",
      headers: { Accept: "application/vnd.google-earth.kml+xml,text/xml,*/*" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error("KML fetch failed");
    kml = await response.text();
  } catch {
    throw new SeichiMapIdentityError("kml_unavailable", 502);
  }
  if (!/<kml(?:\s[^>]*)?>[\s\S]*<\/kml>\s*$/i.test(kml.trim())) {
    throw new SeichiMapIdentityError("invalid_kml", 422);
  }
  // 不正な地点がパーサーで読み飛ばされたまま、部分的に保存されることを防ぐ。
  const markup = kml.replace(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->/g, "");
  const placemarkCount = [...markup.matchAll(/<Placemark(?:\s[^>]*)?>/g)]
    .length;
  const previousLocations = parseSeichiMapKml(kml, current.identities);
  if (
    previousLocations.length === 0 ||
    previousLocations.length !== placemarkCount ||
    new Set(previousLocations.map(({ id }) => id)).size !==
      previousLocations.length ||
    ["Document", "Folder", "Placemark", "Point"].some(
      (tag) =>
        [...markup.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>`, "g"))]
          .length !== [...markup.matchAll(new RegExp(`</${tag}>`, "g"))].length,
    ) ||
    previousLocations.some(
      ({ latitude, longitude }) =>
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180,
    )
  )
    throw new SeichiMapIdentityError("invalid_kml", 422);
  const candidate = validateRegistry(
    updateSeichiMapLocationIdentityRegistry(kml, current.identities),
  );
  const locations = parseSeichiMapKml(kml, candidate);
  if (
    locations.some((item, index) => item.id !== previousLocations[index]?.id)
  ) {
    throw new SeichiMapIdentityError("invalid_registry", 422);
  }

  const beforeById = new Map(current.identities.map((item) => [item.id, item]));
  const namesById = new Map(locations.map((item) => [item.id, item.name]));
  const changes: SeichiMapIdentityPreview["changes"] = [];
  for (const item of candidate) {
    const before = beforeById.get(item.id);
    if (!before || hashRegistry([before]) !== hashRegistry([item])) {
      changes.push({
        id: item.id,
        name: namesById.get(item.id) ?? item.names[0],
        kind: before ? "updated" : "added",
      });
    }
  }
  const preview: SeichiMapIdentityPreview = {
    baseVersion: current.version,
    candidateHash: hashRegistry(candidate),
    updatedAt: current.updatedAt,
    needsApply: current.version === 0 || changes.length > 0,
    summary: {
      locationCount: locations.length,
      registryCount: candidate.length,
      addedCount: changes.filter(({ kind }) => kind === "added").length,
      updatedCount: changes.filter(({ kind }) => kind === "updated").length,
      unchangedCount: candidate.length - changes.length,
    },
    changes,
  };
  return { candidate, preview };
}

export async function previewSeichiMapIdentityRegistry() {
  return (await generateCandidate()).preview;
}

export async function applySeichiMapIdentityRegistry(input: {
  baseVersion: number;
  candidateHash: string;
  userId: string;
}) {
  const { candidate, preview } = await generateCandidate();
  const conflict = () => new SeichiMapIdentityError("conflict", 409);
  if (
    preview.baseVersion !== input.baseVersion ||
    preview.candidateHash !== input.candidateHash
  )
    throw conflict();
  if (!preview.needsApply) {
    return { version: preview.baseVersion, updatedAt: preview.updatedAt! };
  }
  const updatedAt = new Date();
  const data = {
    identities: candidate,
    version: input.baseVersion + 1,
    updatedAt,
    updatedBy: input.userId,
  };
  if (input.baseVersion === 0) {
    try {
      await prisma.seichiMapIdentityRegistry.create({
        data: { key: REGISTRY_KEY, ...data },
      });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2002") throw conflict();
      throw error;
    }
  } else {
    const result = await prisma.seichiMapIdentityRegistry.updateMany({
      where: { key: REGISTRY_KEY, version: input.baseVersion },
      data,
    });
    if (result.count !== 1) throw conflict();
  }
  return { version: data.version, updatedAt: updatedAt.toISOString() };
}
