import type { Song } from "../../types/song";
import { normalizeSongTitle } from "./normalizeSongTitle";

export type ReleaseVariantKind = "mv" | "art-track" | "other";

export type ReleaseVariantGroup = {
  key: string;
  representative: Song;
  variants: Song[];
};

const normalizeKeyPart = (value?: string) =>
  (value || "").normalize("NFKC").trim().toLowerCase();

const getSourceOrder = (song: Song, fallback: number) =>
  song.source_order ?? fallback;

export const isMusicVideo = (song: Song) =>
  (song.tags || []).some((tag) => tag.includes("MV"));

export const isArtTrack = (song: Song) =>
  (song.tags || []).includes("アートトラック");

export const getReleaseVariantKind = (song: Song): ReleaseVariantKind => {
  if (isMusicVideo(song)) return "mv";
  if (isArtTrack(song)) return "art-track";
  return "other";
};

export const getSongInstanceKey = (song: Song) =>
  `${song.video_id || "video"}__${Number(song.start ?? 0)}__${song.slugv2 || ""}`;

const isReleaseVariantCandidate = (song: Song) =>
  Boolean(song.album?.trim()) && (isMusicVideo(song) || isArtTrack(song));

export const getReleaseVariantGroupKey = (song: Song) => {
  if (!isReleaseVariantCandidate(song)) {
    return `single::${getSongInstanceKey(song)}`;
  }

  const title = normalizeKeyPart(normalizeSongTitle(song.title, song.artist));
  const artist = normalizeKeyPart(song.artist);
  const album = normalizeKeyPart(song.album);

  if (!title || !artist || !album) {
    return `single::${getSongInstanceKey(song)}`;
  }

  return `release::${album}::${title}::${artist}`;
};

const variantPriority = (song: Song) => {
  const kind = getReleaseVariantKind(song);
  if (kind === "mv") return 0;
  if (kind === "art-track") return 1;
  return 2;
};

export const sortReleaseVariants = (songs: Song[]) =>
  [...songs].sort((left, right) => {
    const priorityDiff = variantPriority(left) - variantPriority(right);
    if (priorityDiff !== 0) return priorityDiff;

    const orderDiff =
      getSourceOrder(left, Number.MAX_SAFE_INTEGER) -
      getSourceOrder(right, Number.MAX_SAFE_INTEGER);
    if (orderDiff !== 0) return orderDiff;

    return getSongInstanceKey(left).localeCompare(getSongInstanceKey(right));
  });

export const chooseReleaseRepresentative = (songs: Song[]) =>
  sortReleaseVariants(songs)[0];

export const groupReleaseVariants = (songs: Song[]): ReleaseVariantGroup[] => {
  const groups = new Map<
    string,
    {
      firstIndex: number;
      variants: Song[];
    }
  >();

  songs.forEach((song, index) => {
    const key = getReleaseVariantGroupKey(song);
    const current = groups.get(key);
    if (current) {
      current.variants.push(song);
      return;
    }

    groups.set(key, {
      firstIndex: index,
      variants: [song],
    });
  });

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const variants = sortReleaseVariants(group.variants);
      return {
        key,
        firstIndex: group.firstIndex,
        representative: variants[0],
        variants,
      };
    })
    .sort((left, right) => left.firstIndex - right.firstIndex)
    .map(({ firstIndex: _firstIndex, ...group }) => group);
};

export const hasMultipleReleaseVariants = (variants: Song[]) => {
  const kinds = new Set(
    variants.map((variant) => getReleaseVariantKind(variant)),
  );
  return (
    variants.length > 1 &&
    (kinds.has("mv") || kinds.has("art-track")) &&
    kinds.size > 1
  );
};

export const getSelectableReleaseVariants = (variants: Song[]) => {
  const selectedByKind = new Map<ReleaseVariantKind, Song>();

  for (const variant of sortReleaseVariants(variants)) {
    const kind = getReleaseVariantKind(variant);
    if (!selectedByKind.has(kind)) {
      selectedByKind.set(kind, variant);
    }
  }

  return Array.from(selectedByKind.values());
};

export const findReleaseVariantByInstanceKey = (
  variants: Song[],
  instanceKey: string | null,
) => {
  if (!instanceKey) return null;
  return (
    variants.find((variant) => getSongInstanceKey(variant) === instanceKey) ??
    null
  );
};
