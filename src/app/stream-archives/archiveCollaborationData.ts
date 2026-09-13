import { siteConfig } from "../config/siteConfig";
import { getCollabUnitName } from "../config/collabUnits";
import {
  holoGenerationGroupOrder,
  resolveHoloGenerationGroups,
} from "../config/holoGenerations";
import {
  createChannelsByParticipantName,
  resolveArchiveParticipants,
  type ArchiveParticipantEntry,
} from "../lib/archiveParticipants";
import { parseVideoDurationSeconds } from "../lib/videoDuration";
import type { ChannelEntry } from "../types/api/yt/channels";
import type { Song } from "../types/song";
import { getJstDateKey } from "./archiveActivity";
import { normalizeArchiveSeriesKey } from "./archiveSearch";

export type ArchiveCollaborationSource = {
  stream_started_at: string;
  video_duration?: string;
  video_id?: string;
  topic?: string;
  participantEntries: ArchiveParticipantEntry[];
};

export type ArchiveSongCollaborationSource = Pick<
  Song,
  "video_id" | "sing" | "sings" | "hl" | "tags"
>;

export type ArchiveCollaborationRankingItem = {
  key: string;
  name: string;
  participantEntries: ArchiveParticipantEntry[];
  castNames: string[];
  count: number;
  totalDurationSeconds: number;
  firstCollaborationDate: string | null;
};

const normalizeValue = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase("ja-JP");

const normalizeBranch = (value: string) =>
  normalizeValue(value).replace(/[\s_'’-]+/gu, "");

const normalizeTalentIdentity = (value: string) =>
  normalizeValue(value).replace(/[\s・._'’\-]+/gu, "");

const INACTIVE_GENERATION_MARKERS = ["卒業生", "活動終了"] as const;
const KARAOKE_SERIES_KEY = normalizeArchiveSeriesKey("歌枠");
const FUWAMOCO_GROUP_KEY = "unit:fuwamoco";
// AZKi以外の出演者が4グループ以内の配信をコラボ履歴に算入する。
const MAX_COLLABORATOR_GROUPS_FOR_HISTORY = 4;
// 歌枠は AZKi を含む4人以下の配信だけをコラボ履歴に算入する。
const MAX_KARAOKE_COLLABORATOR_GROUPS_FOR_HISTORY = 3;

const getSongSingerNames = (song: ArchiveSongCollaborationSource) => {
  const localizedSings = song.hl?.ja?.sings ?? [];
  const canonicalSings = song.sings ?? [];
  const canonicalSing = song.hl?.ja?.sing || song.sing || "";
  const singers =
    localizedSings.length > 0
      ? localizedSings
      : canonicalSings.length > 0
        ? canonicalSings
        : canonicalSing.split(/[、,]/u);

  return [...new Set(singers.map((name) => name.trim()).filter(Boolean))];
};

const isKaraokeSong = (song: ArchiveSongCollaborationSource) =>
  (song.tags ?? []).some((tag) =>
    normalizeArchiveSeriesKey(tag).includes(KARAOKE_SERIES_KEY),
  );

export type ArchiveHololiveMemberMetadata = {
  generation: string;
  status: string | null;
};

export const getArchiveHololiveMemberMetadata = (
  participant: ArchiveParticipantEntry | undefined,
): ArchiveHololiveMemberMetadata => {
  const generationParts = (participant?.channel?.generation ?? "")
    .split(/[、,]/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const statusParts = generationParts.filter((part) =>
    INACTIVE_GENERATION_MARKERS.some((marker) => part.includes(marker)),
  );
  const activeGenerationParts = generationParts.filter(
    (part) =>
      !INACTIVE_GENERATION_MARKERS.some((marker) => part.includes(marker)),
  );
  const groups = resolveHoloGenerationGroups(
    participant?.channel
      ? {
          ...participant.channel,
          generation: activeGenerationParts.join("、"),
        }
      : undefined,
  );

  return {
    generation:
      groups[0]?.key === "other"
        ? activeGenerationParts.join("・")
        : groups.map((group) => group.label).join("・"),
    status: statusParts.length > 0 ? statusParts.join("・") : null,
  };
};

const isHololiveMember = (participant: ArchiveParticipantEntry) => {
  const branch = normalizeBranch(participant.channel?.branch ?? "");

  return (
    branch === "jp" ||
    branch === "en" ||
    branch === "id" ||
    branch === "devis" ||
    branch === "ホロライブ" ||
    branch.includes("hololive")
  );
};

const isAzki = (participant: ArchiveParticipantEntry) => {
  const azkiName = normalizeValue(siteConfig.talentName);

  return [
    participant.name,
    participant.channel?.talentName ?? "",
    participant.channel?.artistName ?? "",
  ].some((name) => normalizeValue(name) === azkiName);
};

const isActiveHololiveMember = (participant: ArchiveParticipantEntry) => {
  const { status } = getArchiveHololiveMemberMetadata(participant);

  return status === null;
};

const getParticipantKey = (participant: ArchiveParticipantEntry) =>
  participant.channel?.youtubeId || normalizeValue(participant.name);

const isFuwamocoParticipant = (participant: ArchiveParticipantEntry) =>
  [
    participant.name,
    participant.channel?.talentName ?? "",
    participant.channel?.artistName ?? "",
    participant.channel?.channelName ?? "",
  ].some((value) => {
    const normalized = normalizeTalentIdentity(value);
    return (
      normalized.includes("fuwamoco") ||
      normalized.startsWith("fuwawa") ||
      normalized.startsWith("mococo") ||
      normalized.startsWith("フワワ") ||
      normalized.startsWith("モココ")
    );
  });

const getCollaboratorGroupKey = (participant: ArchiveParticipantEntry) => {
  if (isFuwamocoParticipant(participant)) {
    return FUWAMOCO_GROUP_KEY;
  }

  const talentName =
    participant.channel?.talentName || participant.channel?.artistName;
  if (talentName) {
    return `talent:${normalizeTalentIdentity(talentName)}`;
  }

  return participant.channel?.youtubeId
    ? `channel:${normalizeValue(participant.channel.youtubeId)}`
    : `name:${normalizeTalentIdentity(participant.name)}`;
};

const getParticipantIdentityKeys = (participant: ArchiveParticipantEntry) =>
  [
    isFuwamocoParticipant(participant) ? FUWAMOCO_GROUP_KEY : "",
    participant.channel?.youtubeId
      ? `channel:${normalizeValue(participant.channel.youtubeId)}`
      : "",
    ...[
      participant.name,
      participant.channel?.talentName ?? "",
      participant.channel?.artistName ?? "",
    ].flatMap((value) => {
      if (!value) {
        return [];
      }

      return [`name:${normalizeValue(value)}`];
    }),
  ].filter(Boolean);

const getFirstCollaborationDate = (
  currentDate: string | null | undefined,
  nextDate: string,
) => {
  if (!nextDate) {
    return currentDate ?? null;
  }

  return !currentDate || nextDate < currentDate ? nextDate : currentDate;
};

const isInSelectedYear = (
  item: ArchiveCollaborationSource,
  selectedYear: string | null,
) =>
  !selectedYear ||
  getJstDateKey(item.stream_started_at).startsWith(`${selectedYear}-`);

const getHololiveCollaborators = (item: ArchiveCollaborationSource) => {
  const participantsByKey = new Map<string, ArchiveParticipantEntry>();

  item.participantEntries.forEach((participant) => {
    if (!isHololiveMember(participant) || isAzki(participant)) {
      return;
    }

    const key = getParticipantKey(participant);
    if (key && !participantsByKey.has(key)) {
      participantsByKey.set(key, participant);
    }
  });

  return Array.from(participantsByKey.values());
};

const getEligibleHololiveCollaborators = (
  item: ArchiveCollaborationSource,
  {
    maxCollaboratorGroups = MAX_COLLABORATOR_GROUPS_FOR_HISTORY,
    requireAzki = false,
  }: {
    maxCollaboratorGroups?: number;
    requireAzki?: boolean;
  } = {},
) => {
  const collaboratorGroups = new Map<string, ArchiveParticipantEntry[]>();
  let hasAzki = false;

  item.participantEntries.forEach((participant) => {
    if (isAzki(participant)) {
      hasAzki = true;
      return;
    }

    const key = getCollaboratorGroupKey(participant);
    if (key) {
      collaboratorGroups.set(key, [
        ...(collaboratorGroups.get(key) ?? []),
        participant,
      ]);
    }
  });

  if (
    (requireAzki && !hasAzki) ||
    collaboratorGroups.size === 0 ||
    collaboratorGroups.size > maxCollaboratorGroups
  ) {
    return [];
  }

  return Array.from(collaboratorGroups.values())
    .flat()
    .filter(isHololiveMember);
};

const sortRanking = (
  items: ArchiveCollaborationRankingItem[],
  locale: string,
  limit: number,
  metric: "count" | "duration",
) => {
  const collator = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: "base",
  });

  return items
    .sort((left, right) => {
      const metricDifference =
        metric === "duration"
          ? right.totalDurationSeconds - left.totalDurationSeconds
          : right.count - left.count;

      return (
        metricDifference ||
        right.count - left.count ||
        collator.compare(left.name, right.name)
      );
    })
    .slice(0, limit);
};

export const createArchiveCollaborationRanking = (
  items: ArchiveCollaborationSource[],
  selectedYear: string | null,
  locale: string,
  limit = 10,
): ArchiveCollaborationRankingItem[] => {
  const countsByParticipant = new Map<
    string,
    ArchiveCollaborationRankingItem
  >();

  items.forEach((item) => {
    if (!isInSelectedYear(item, selectedYear)) {
      return;
    }

    const durationSeconds =
      parseVideoDurationSeconds(item.video_duration ?? "") ?? 0;
    const dateKey = getJstDateKey(item.stream_started_at);

    getHololiveCollaborators(item).forEach((participant) => {
      const key = getParticipantKey(participant);
      const current = countsByParticipant.get(key);
      countsByParticipant.set(key, {
        key,
        name: participant.name,
        participantEntries: [participant],
        castNames: [participant.name],
        count: (current?.count ?? 0) + 1,
        totalDurationSeconds:
          (current?.totalDurationSeconds ?? 0) + durationSeconds,
        firstCollaborationDate: getFirstCollaborationDate(
          current?.firstCollaborationDate,
          dateKey,
        ),
      });
    });
  });

  return sortRanking(
    Array.from(countsByParticipant.values()),
    locale,
    limit,
    "duration",
  );
};

const listActiveHololiveMembersWithoutIdentities = (
  channels: ChannelEntry[],
  locale: string,
  collaboratedIdentityKeys: Set<string>,
): ArchiveParticipantEntry[] => {
  const membersByName = new Map<string, ArchiveParticipantEntry>();

  channels.forEach((channel) => {
    const name =
      channel.talentName || channel.artistName || channel.channelName.trim();
    const participant = { name, channel };

    if (
      !name ||
      !isHololiveMember(participant) ||
      !isActiveHololiveMember(participant) ||
      isAzki(participant)
    ) {
      return;
    }

    if (
      getParticipantIdentityKeys(participant).some((key) =>
        collaboratedIdentityKeys.has(key),
      )
    ) {
      return;
    }

    const memberKey = normalizeValue(name);
    if (!membersByName.has(memberKey)) {
      membersByName.set(memberKey, participant);
    }
  });

  const collator = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: "base",
  });

  return Array.from(membersByName.values()).sort((left, right) => {
    const leftGroupKey = resolveHoloGenerationGroups(left.channel)[0]?.key;
    const rightGroupKey = resolveHoloGenerationGroups(right.channel)[0]?.key;
    const groupOrderDifference =
      holoGenerationGroupOrder.indexOf(leftGroupKey ?? "other") -
      holoGenerationGroupOrder.indexOf(rightGroupKey ?? "other");

    return groupOrderDifference || collator.compare(left.name, right.name);
  });
};

export const createArchiveMembersWithoutCollaboration = (
  items: ArchiveCollaborationSource[],
  channels: ChannelEntry[],
  locale: string,
): ArchiveParticipantEntry[] => {
  const collaboratedIdentityKeys = new Set<string>();

  items.forEach((item) => {
    getEligibleHololiveCollaborators(item).forEach((participant) => {
      getParticipantIdentityKeys(participant).forEach((key) =>
        collaboratedIdentityKeys.add(key),
      );
    });
  });

  return listActiveHololiveMembersWithoutIdentities(
    channels,
    locale,
    collaboratedIdentityKeys,
  );
};

export const createArchiveMembersWithoutKaraokeCollaboration = (
  channels: ChannelEntry[],
  locale: string,
  songs: ArchiveSongCollaborationSource[] = [],
) => {
  const channelsByParticipantName = createChannelsByParticipantName(channels);
  const singersByVideoId = new Map<string, Set<string>>();

  songs.forEach((song) => {
    if (!song.video_id || !isKaraokeSong(song)) {
      return;
    }

    const current = singersByVideoId.get(song.video_id) ?? new Set<string>();
    getSongSingerNames(song).forEach((name) => current.add(name));
    singersByVideoId.set(song.video_id, current);
  });

  const collaboratedIdentityKeys = new Set<string>();

  singersByVideoId.forEach((singerNames) => {
    if (singerNames.size === 0) {
      return;
    }

    getEligibleHololiveCollaborators(
      {
        stream_started_at: "",
        participantEntries: resolveArchiveParticipants(
          [...singerNames],
          channelsByParticipantName,
        ),
      },
      {
        maxCollaboratorGroups: MAX_KARAOKE_COLLABORATOR_GROUPS_FOR_HISTORY,
        requireAzki: true,
      },
    ).forEach((participant) => {
      getParticipantIdentityKeys(participant).forEach((key) =>
        collaboratedIdentityKeys.add(key),
      );
    });
  });

  return listActiveHololiveMembersWithoutIdentities(
    channels,
    locale,
    collaboratedIdentityKeys,
  );
};

export const createArchiveCollaborationCombinationRanking = (
  items: ArchiveCollaborationSource[],
  selectedYear: string | null,
  locale: string,
  azkiParticipant: ArchiveParticipantEntry,
  limit = 10,
): ArchiveCollaborationRankingItem[] => {
  const countsByCombination = new Map<
    string,
    ArchiveCollaborationRankingItem
  >();

  items.forEach((item) => {
    if (!isInSelectedYear(item, selectedYear)) {
      return;
    }

    const collaborators = getHololiveCollaborators(item);
    if (collaborators.length === 0) {
      return;
    }

    const durationSeconds =
      parseVideoDurationSeconds(item.video_duration ?? "") ?? 0;
    const dateKey = getJstDateKey(item.stream_started_at);

    const participantEntries = [azkiParticipant, ...collaborators];
    const memberNames = participantEntries.map((participant) =>
      isAzki(participant)
        ? siteConfig.talentName
        : participant.channel?.talentName || participant.name,
    );
    const key = participantEntries
      .map(getParticipantKey)
      .sort((left, right) => left.localeCompare(right))
      .join("|");
    const fallbackSeparator = locale.startsWith("ja") ? "・" : " + ";
    const name =
      getCollabUnitName(memberNames, locale) ??
      memberNames.join(fallbackSeparator);
    const current = countsByCombination.get(key);

    countsByCombination.set(key, {
      key,
      name,
      participantEntries,
      castNames: collaborators.map((participant) => participant.name),
      count: (current?.count ?? 0) + 1,
      totalDurationSeconds:
        (current?.totalDurationSeconds ?? 0) + durationSeconds,
      firstCollaborationDate: getFirstCollaborationDate(
        current?.firstCollaborationDate,
        dateKey,
      ),
    });
  });

  return sortRanking(
    Array.from(countsByCombination.values()),
    locale,
    limit,
    "count",
  );
};
