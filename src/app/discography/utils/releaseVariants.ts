import type { Song } from "../../types/song";
import { normalizeSongTitle } from "./normalizeSongTitle";

export type ReleaseVariantKind = "mv" | "animated" | "art-track" | "other";

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

export const isAnimatedAz = (song: Song) =>
  (song.tags || []).includes("アニAZ");

export const isArtTrack = (song: Song) =>
  (song.tags || []).includes("アートトラック");

export const getReleaseVariantKind = (song: Song): ReleaseVariantKind => {
  if (isAnimatedAz(song)) return "animated";
  if (isMusicVideo(song)) return "mv";
  if (isArtTrack(song)) return "art-track";
  return "other";
};

export const getSongInstanceKey = (song: Song) =>
  `${song.video_id || "video"}__${Number(song.start ?? 0)}__${song.slugv2 || ""}`;

const isReleaseVariantCandidate = (song: Song) =>
  isMusicVideo(song) || isArtTrack(song);

const getTitleArtistKeyParts = (song: Song) => {
  const title = normalizeKeyPart(normalizeSongTitle(song.title, song.artist));
  const artist = normalizeKeyPart(song.artist);
  return { title, artist };
};

const getCrossAlbumReleaseVariantGroupKey = (song: Song) => {
  if (!isReleaseVariantCandidate(song)) {
    return `single::${getSongInstanceKey(song)}`;
  }

  const { title, artist } = getTitleArtistKeyParts(song);

  if (!title || !artist) {
    return `single::${getSongInstanceKey(song)}`;
  }

  return `release::cross-album::${title}::${artist}`;
};

export const getReleaseVariantGroupKey = (song: Song) => {
  if (!isReleaseVariantCandidate(song)) {
    return `single::${getSongInstanceKey(song)}`;
  }

  const { title, artist } = getTitleArtistKeyParts(song);
  const album = normalizeKeyPart(song.album) || "no-album";

  if (!title || !artist) {
    return `single::${getSongInstanceKey(song)}`;
  }

  return `release::${album}::${title}::${artist}`;
};

const variantPriority = (song: Song) => {
  const kind = getReleaseVariantKind(song);
  if (kind === "mv") return 0;
  if (kind === "animated") return 1;
  if (kind === "art-track") return 2;
  return 3;
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
  const animatedTitleArtistKeys = new Set(
    songs.filter(isAnimatedAz).map((song) => {
      const { title, artist } = getTitleArtistKeyParts(song);
      return title && artist ? `${title}::${artist}` : "";
    }),
  );
  const groups = new Map<
    string,
    {
      firstIndex: number;
      variants: Song[];
    }
  >();

  songs.forEach((song, index) => {
    const { title, artist } = getTitleArtistKeyParts(song);
    const titleArtistKey = title && artist ? `${title}::${artist}` : "";
    const shouldCrossAlbumGroup =
      isReleaseVariantCandidate(song) &&
      titleArtistKey &&
      animatedTitleArtistKeys.has(titleArtistKey);
    const key = shouldCrossAlbumGroup
      ? getCrossAlbumReleaseVariantGroupKey(song)
      : getReleaseVariantGroupKey(song);
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
    (kinds.has("mv") || kinds.has("animated") || kinds.has("art-track"))
  );
};

export const getSelectableReleaseVariants = (variants: Song[]) => {
  return sortReleaseVariants(variants);
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

export const matchesReleaseVariantGroupKey = (song: Song, groupKey: string) =>
  getReleaseVariantGroupKey(song) === groupKey ||
  getCrossAlbumReleaseVariantGroupKey(song) === groupKey;
