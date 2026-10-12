"use client";

import { Avatar, AvatarGroup, Tooltip } from "@mantine/core";
import { useMemo } from "react";
import useChannels from "../hook/useChannels";
import {
  createChannelsByParticipantName,
  isAzkiArchiveParticipant,
  parseArchiveParticipants,
  resolveArchiveParticipants,
  type ArchiveParticipantEntry,
} from "../lib/archiveParticipants";
import type { Song } from "../types/song";
import ChannelAvatar from "./ChannelAvatar";

function ParticipantGroup({
  participants,
  maxVisible,
  size,
  className,
}: {
  participants: ArchiveParticipantEntry[];
  maxVisible: number;
  size: number;
  className: string;
}) {
  const remaining = participants.slice(maxVisible);

  return (
    <AvatarGroup
      spacing={5}
      className={className}
      role="group"
      aria-label={participants.map(({ name }) => name).join("、")}
      style={{ flexWrap: "nowrap" }}
    >
      {participants.slice(0, maxVisible).map(({ name, channel }) => (
        <Tooltip key={name} label={name} withArrow>
          <span title={name}>
            <ChannelAvatar
              key={channel?.iconUrl || ""}
              name={name}
              iconUrl={channel?.iconUrl || ""}
              size={size}
              styles={{ root: { borderWidth: 1 } }}
            />
          </span>
        </Tooltip>
      ))}
      {remaining.length > 0 && (
        <Tooltip label={remaining.map(({ name }) => name).join("、")} withArrow>
          <Avatar
            size={size}
            radius="xl"
            color="gray"
            title={remaining.map(({ name }) => name).join("、")}
            styles={{ root: { borderWidth: 1 }, placeholder: { fontSize: 9 } }}
          >
            +{remaining.length}
          </Avatar>
        </Tooltip>
      )}
    </AvatarGroup>
  );
}

export default function SongParticipantAvatars({ song }: { song: Song }) {
  const { channels } = useChannels();
  const participants = useMemo(() => {
    const names = parseArchiveParticipants(
      song.hl?.ja?.sings?.length
        ? song.hl.ja.sings
        : song.sings?.length
          ? song.sings
          : song.hl?.ja?.sing || song.sing,
    );
    const resolved = resolveArchiveParticipants(
      names,
      createChannelsByParticipantName(channels),
    );
    const seenChannels = new Set<string>();
    return resolved.filter(({ channel }) => {
      if (!channel?.youtubeId) return true;
      if (seenChannels.has(channel.youtubeId)) return false;
      seenChannels.add(channel.youtubeId);
      return true;
    });
  }, [song, channels]);

  if (
    !participants.some((participant) => !isAzkiArchiveParticipant(participant))
  ) {
    return null;
  }

  return (
    <div className="col-start-2 row-start-2 lg:row-start-4 self-center justify-self-end shrink-0">
      <ParticipantGroup
        participants={participants}
        maxVisible={2}
        size={16}
        className="lg:hidden"
      />
      <ParticipantGroup
        participants={participants}
        maxVisible={4}
        size={18}
        className="hidden lg:flex"
      />
    </div>
  );
}
