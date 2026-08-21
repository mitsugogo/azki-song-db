import type { Song } from "@/app/types/song";
import { isSungByAzki } from "@/app/search/utils/azkiOnly";
import type { PlaylistEntry } from "@/app/lib/playlistUrl";

export const MAX_ACROSTIC_CHARACTERS = 50;

const LETTER_OR_NUMBER_PATTERN = /[\p{L}\p{N}]/u;
const KATAKANA_PATTERN = /[ァ-ヶ]/g;
const KANA_PATTERN = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;
const SMALL_KANA_MODIFIER_PATTERN = /^[ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ]$/u;

const graphemeSegmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

export type AcrosticTargetCharacter = {
  character: string;
  normalizedCharacter: string;
};

export type AcrosticInputResult = {
  characters: AcrosticTargetCharacter[];
  eligibleCount: number;
  isOverLimit: boolean;
};

export type AcrosticMatchSource =
  "localized-title" | "japanese-title" | "english-title" | "alias";

export type AcrosticInitialMatch = {
  source: AcrosticMatchSource;
  value: string;
};

export type AcrosticCandidate = {
  key: string;
  song: Song;
  matches: Map<string, AcrosticInitialMatch>;
};

export type AcrosticCandidateIndex = {
  candidates: AcrosticCandidate[];
  byInitial: Map<string, AcrosticCandidate[]>;
  byKey: Map<string, AcrosticCandidate>;
};

export type AcrosticAssignment = AcrosticTargetCharacter & {
  id: string;
  selectedCandidateKey: string | null;
};

type TitleSource = {
  source: AcrosticMatchSource;
  value: string;
};

const segmentGraphemes = (value: string): string[] => {
  if (!graphemeSegmenter) return Array.from(value);
  return Array.from(graphemeSegmenter.segment(value), (part) => part.segment);
};

const segmentAcrosticUnits = (value: string): string[] => {
  const units: string[] = [];

  segmentGraphemes(value.normalize("NFKC")).forEach((character) => {
    if (!LETTER_OR_NUMBER_PATTERN.test(character)) return;

    const previous = units.at(-1);
    if (
      previous &&
      KANA_PATTERN.test(previous) &&
      SMALL_KANA_MODIFIER_PATTERN.test(character)
    ) {
      units[units.length - 1] += character;
      return;
    }

    units.push(character);
  });

  return units;
};

const katakanaToHiragana = (value: string) =>
  value
    .normalize("NFD")
    .replace(KATAKANA_PATTERN, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0x60),
    )
    .normalize("NFC");

export const normalizeAcrosticInitial = (value: string): string => {
  const firstEligible = segmentAcrosticUnits(value)[0];

  if (!firstEligible) return "";
  return katakanaToHiragana(firstEligible.toLowerCase());
};

export const parseAcrosticInput = (value: string): AcrosticInputResult => {
  const characters = segmentAcrosticUnits(value)
    .map((character) => ({
      character,
      normalizedCharacter: normalizeAcrosticInitial(character),
    }))
    .filter((item) => item.normalizedCharacter.length > 0);

  return {
    characters,
    eligibleCount: characters.length,
    isOverLimit: characters.length > MAX_ACROSTIC_CHARACTERS,
  };
};

const normalizeKeyPart = (value: string | undefined) =>
  (value ?? "").normalize("NFKC").trim().toLocaleLowerCase();

const getCanonicalTitle = (song: Song) =>
  song.hl?.ja?.title?.trim() || song.title.trim();

const getCanonicalArtist = (song: Song) =>
  song.hl?.ja?.artist?.trim() || song.artist.trim();

const getCandidateKey = (song: Song) =>
  `${normalizeKeyPart(getCanonicalTitle(song))}\0${normalizeKeyPart(
    getCanonicalArtist(song),
  )}`;

const getBroadcastTime = (song: Song) => {
  const timestamp = new Date(song.broadcast_at).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

const getStableSongKey = (song: Song) =>
  `${song.video_id}\0${Number(song.start)}\0${song.source_order ?? ""}`;

const isNewerRepresentative = (candidate: Song, current: Song) => {
  const timeDifference =
    getBroadcastTime(candidate) - getBroadcastTime(current);
  if (timeDifference !== 0) return timeDifference > 0;

  const candidateOrder = candidate.source_order ?? Number.MAX_SAFE_INTEGER;
  const currentOrder = current.source_order ?? Number.MAX_SAFE_INTEGER;
  if (candidateOrder !== currentOrder) return candidateOrder < currentOrder;

  return (
    getStableSongKey(candidate).localeCompare(getStableSongKey(current)) < 0
  );
};

const getTitleSources = (songs: Song[]): TitleSource[] => {
  const sources: TitleSource[] = [];
  const seen = new Set<string>();

  const add = (source: AcrosticMatchSource, value: string | undefined) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    const key = `${source}\0${trimmed.normalize("NFKC")}`;
    if (seen.has(key)) return;
    seen.add(key);
    sources.push({ source, value: trimmed });
  };

  songs.forEach((song) => {
    add("localized-title", song.title);
    add("japanese-title", song.hl?.ja?.title);
    add("english-title", song.title_en);
    add("alias", song.title_aliases?.[0]);
  });

  return sources;
};

const createCandidate = (key: string, songs: Song[]): AcrosticCandidate => {
  let representative = songs[0];
  for (let index = 1; index < songs.length; index += 1) {
    if (isNewerRepresentative(songs[index], representative)) {
      representative = songs[index];
    }
  }

  const matches = new Map<string, AcrosticInitialMatch>();
  getTitleSources(songs).forEach((source) => {
    const initial = normalizeAcrosticInitial(source.value);
    if (initial && !matches.has(initial)) {
      matches.set(initial, source);
    }
  });

  return { key, song: representative, matches };
};

const compareCandidates = (
  left: AcrosticCandidate,
  right: AcrosticCandidate,
) => {
  const timeDifference =
    getBroadcastTime(right.song) - getBroadcastTime(left.song);
  if (timeDifference !== 0) return timeDifference;

  const titleDifference = getCanonicalTitle(left.song).localeCompare(
    getCanonicalTitle(right.song),
    "ja",
  );
  if (titleDifference !== 0) return titleDifference;
  return left.key.localeCompare(right.key);
};

export const buildAcrosticCandidateIndex = (
  songs: Song[],
): AcrosticCandidateIndex => {
  const groups = new Map<string, Song[]>();

  songs.forEach((song) => {
    if (
      !isSungByAzki(song) ||
      !song.video_id?.trim() ||
      !Number.isFinite(Number(song.start)) ||
      !Number.isFinite(getBroadcastTime(song))
    ) {
      return;
    }

    if (!getCanonicalTitle(song) || !getCanonicalArtist(song)) return;
    const key = getCandidateKey(song);
    const group = groups.get(key);
    if (group) group.push(song);
    else groups.set(key, [song]);
  });

  const candidates = Array.from(groups, ([key, groupedSongs]) =>
    createCandidate(key, groupedSongs),
  )
    .filter((candidate) => candidate.matches.size > 0)
    .sort(compareCandidates);

  const byInitial = new Map<string, AcrosticCandidate[]>();
  const byKey = new Map<string, AcrosticCandidate>();
  candidates.forEach((candidate) => {
    byKey.set(candidate.key, candidate);
    candidate.matches.forEach((_match, initial) => {
      const matches = byInitial.get(initial);
      if (matches) matches.push(candidate);
      else byInitial.set(initial, [candidate]);
    });
  });

  return { candidates, byInitial, byKey };
};

export const reconcileAcrosticAssignments = (
  characters: AcrosticTargetCharacter[],
  index: AcrosticCandidateIndex,
  current: AcrosticAssignment[],
  allowReuse: boolean,
): AcrosticAssignment[] => {
  const usedKeys = new Set<string>();

  return characters.map((character, position) => {
    const candidates = index.byInitial.get(character.normalizedCharacter) ?? [];
    const previous = current[position];
    const previousKey =
      previous?.normalizedCharacter === character.normalizedCharacter
        ? previous.selectedCandidateKey
        : null;
    const canKeepPrevious =
      previousKey !== null &&
      candidates.some((candidate) => candidate.key === previousKey) &&
      (allowReuse || !usedKeys.has(previousKey));
    const selectedCandidateKey = canKeepPrevious
      ? previousKey
      : (candidates.find(
          (candidate) => allowReuse || !usedKeys.has(candidate.key),
        )?.key ?? null);

    if (selectedCandidateKey) usedKeys.add(selectedCandidateKey);

    return {
      ...character,
      id: `${position}-${character.normalizedCharacter}-${character.character}`,
      selectedCandidateKey,
    };
  });
};

export const buildAcrosticCopyText = (
  assignments: AcrosticAssignment[],
  index: AcrosticCandidateIndex,
): string | null => {
  const lines: string[] = [];

  for (const assignment of assignments) {
    if (!assignment.selectedCandidateKey) return null;
    const candidate = index.byKey.get(assignment.selectedCandidateKey);
    if (!candidate) return null;
    lines.push(
      `${assignment.character}｜${candidate.song.title} - ${candidate.song.artist}`,
    );
  }

  return lines.length > 0 ? lines.join("\n") : null;
};

export const buildAcrosticPlaylistEntries = (
  assignments: AcrosticAssignment[],
  index: AcrosticCandidateIndex,
): PlaylistEntry[] | null => {
  const entries: PlaylistEntry[] = [];

  for (const assignment of assignments) {
    if (!assignment.selectedCandidateKey) return null;
    const candidate = index.byKey.get(assignment.selectedCandidateKey);
    if (!candidate) return null;
    entries.push({
      videoId: candidate.song.video_id,
      start: String(candidate.song.start),
    });
  }

  return entries.length > 0 ? entries : null;
};
