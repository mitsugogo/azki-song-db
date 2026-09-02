import { siteConfig } from "../config/siteConfig";
import { getCollabUnitName } from "../config/collabUnits";
import type { ArchiveParticipantEntry } from "../lib/archiveParticipants";
import { parseVideoDurationSeconds } from "../lib/videoDuration";
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

const getParticipantKey = (participant: ArchiveParticipantEntry) =>
  participant.channel?.youtubeId || normalizeValue(participant.name);

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
