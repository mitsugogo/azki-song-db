import type { ChannelEntry } from "../types/api/yt/channels";

export type ArchiveParticipantEntry = {
  name: string;
  channel: ChannelEntry | null;
};

const normalizeParticipantName = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase("ja-JP");

export const parseArchiveParticipants = (value: unknown): string[] => {
  const rawNames = Array.isArray(value)
    ? value.map((name) => String(name))
    : String(value ?? "").split(/[、,\r\n]+/u);
  const seen = new Set<string>();

  return rawNames.flatMap((rawName) => {
    const name = rawName.trim();
    const key = normalizeParticipantName(name);
    if (!name || seen.has(key)) {
      return [];
    }

    seen.add(key);
    return [name];
  });
};

export const createChannelsByParticipantName = (
  channels: ChannelEntry[],
): Map<string, ChannelEntry> => {
  const channelsByName = new Map<string, ChannelEntry>();

  channels.forEach((channel) => {
    [channel.talentName, channel.artistName, channel.channelName].forEach(
      (name) => {
        const key = normalizeParticipantName(name);
        if (key && !channelsByName.has(key)) {
          channelsByName.set(key, channel);
        }
      },
    );
  });

  return channelsByName;
};

export const resolveArchiveParticipants = (
  participants: string[],
  channelsByName: Map<string, ChannelEntry>,
): ArchiveParticipantEntry[] =>
  participants.map((name) => ({
    name,
    channel: channelsByName.get(normalizeParticipantName(name)) ?? null,
  }));

export const matchesSelectedArchiveParticipants = (
  participants: string[],
  selectedParticipants: string[],
) => {
  if (selectedParticipants.length === 0) {
    return true;
  }

  const participantKeys = new Set(participants.map(normalizeParticipantName));
  return selectedParticipants.every((name) =>
    participantKeys.has(normalizeParticipantName(name)),
  );
};
