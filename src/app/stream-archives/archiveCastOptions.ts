import type { ChannelEntry } from "../types/api/yt/channels";
import type { ArchiveParticipantEntry } from "../lib/archiveParticipants";
import { createArchiveMembersWithoutCollaboration } from "./archiveCollaborationData";

export type ArchiveCastOption = ArchiveParticipantEntry & {
  count: number;
};

type ArchiveCastSource = {
  participantEntries: ArchiveParticipantEntry[];
};

const normalizeCastName = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase("ja-JP");

const getCastOptionKey = (participant: ArchiveParticipantEntry) =>
  normalizeCastName(
    participant.channel?.talentName ||
      participant.channel?.artistName ||
      participant.name,
  );

export const createArchiveCastOptions = (
  items: ArchiveCastSource[],
  channels: ChannelEntry[],
  locale: string,
): ArchiveCastOption[] => {
  const optionsByKey = new Map<string, ArchiveCastOption>();

  // 空のコラボ履歴に対する結果を使い、現役ホロメン全員を0件で追加する。
  createArchiveMembersWithoutCollaboration([], channels, locale).forEach(
    (participant) => {
      const key = getCastOptionKey(participant);
      if (key && !optionsByKey.has(key)) {
        optionsByKey.set(key, { ...participant, count: 0 });
      }
    },
  );

  items.forEach((item) => {
    const countedKeys = new Set<string>();

    item.participantEntries.forEach((participant) => {
      const key = getCastOptionKey(participant);
      if (!key || countedKeys.has(key)) {
        return;
      }

      countedKeys.add(key);
      const current = optionsByKey.get(key);
      optionsByKey.set(
        key,
        current
          ? { ...current, count: current.count + 1 }
          : { ...participant, count: 1 },
      );
    });
  });

  const collator = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: "base",
  });

  return Array.from(optionsByKey.values()).sort((left, right) =>
    collator.compare(left.name, right.name),
  );
};
