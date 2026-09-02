"use client";

import { Avatar, Text, Tooltip } from "@mantine/core";
import { memo } from "react";
import type { ArchiveParticipantEntry } from "../lib/archiveParticipants";

const getChannelUrl = (channelId: string) =>
  `https://www.youtube.com/channel/${encodeURIComponent(channelId)}`;

function ArchiveParticipantList({
  participants,
}: {
  participants: ArchiveParticipantEntry[];
}) {
  if (participants.length === 0) {
    return <Text c="dimmed">-</Text>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {participants.map(({ name, channel }) => {
        if (!channel) {
          return (
            <Text key={name} component="span" fz="xs">
              {name}
            </Text>
          );
        }

        const channelName = channel.channelName || name;
        const avatar = (
          <Avatar
            src={channel.iconUrl || null}
            alt={name}
            radius="xl"
            size="sm"
            color="pink"
          >
            {Array.from(name)[0]}
          </Avatar>
        );

        return (
          <Tooltip key={name} label={channelName} withArrow>
            {channel.youtubeId ? (
              <a
                href={getChannelUrl(channel.youtubeId)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={channelName}
                className="inline-flex rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {avatar}
              </a>
            ) : (
              <span className="inline-flex rounded-full">{avatar}</span>
            )}
          </Tooltip>
        );
      })}
    </div>
  );
}

export default memo(ArchiveParticipantList);
