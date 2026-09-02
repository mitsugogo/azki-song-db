import { siteConfig } from "../config/siteConfig";
import { getCollabUnitName } from "../config/collabUnits";
import type { ArchiveParticipantEntry } from "../lib/archiveParticipants";
import { parseVideoDurationSeconds } from "../lib/videoDuration";
import type { ChannelEntry } from "../types/api/yt/channels";
import { getJstDateKey } from "./archiveActivity";

export type ArchiveCollaborationSource = {
  stream_started_at: string;
  video_duration?: string;
  participantEntries: ArchiveParticipantEntry[];
};

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

const INACTIVE_GENERATION_MARKERS = ["卒業生", "活動終了"] as const;

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

  return {
    generation: activeGenerationParts.join("・"),
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

const getParticipantIdentityKeys = (participant: ArchiveParticipantEntry) =>
  [
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

const sortRanking = (
  items: ArchiveCollaborationRankingItem[],
  locale: string,
  limit: number,
) => {
  const collator = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: "base",
  });

  return items
    .sort(
      (left, right) =>
        right.count - left.count || collator.compare(left.name, right.name),
    )
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

  return sortRanking(Array.from(countsByParticipant.values()), locale, limit);
};

export const createArchiveMembersWithoutCollaboration = (
  items: ArchiveCollaborationSource[],
  channels: ChannelEntry[],
  locale: string,
): ArchiveParticipantEntry[] => {
  const collaboratedIdentityKeys = new Set<string>();

  items.forEach((item) => {
    getHololiveCollaborators(item).forEach((participant) => {
      getParticipantIdentityKeys(participant).forEach((key) =>
        collaboratedIdentityKeys.add(key),
      );
    });
  });

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

  return Array.from(membersByName.values()).sort((left, right) =>
    collator.compare(left.name, right.name),
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

  return sortRanking(Array.from(countsByCombination.values()), locale, limit);
};
