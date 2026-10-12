"use client";

import { Avatar, Tooltip } from "@mantine/core";
import { useMemo } from "react";
import useChannels from "@/app/hook/useChannels";
import ChannelAvatar from "@/app/components/ChannelAvatar";
import {
  createChannelsByParticipantName,
  resolveArchiveParticipants,
} from "@/app/lib/archiveParticipants";

const getChannelUrl = (channelId: string) =>
  `https://www.youtube.com/channel/${encodeURIComponent(channelId)}`;

export default function UnitMemberAvatars({
  members,
  variant = "hero",
}: {
  members: string[];
  variant?: "hero" | "card";
}) {
  const { channels } = useChannels();
  const participants = useMemo(
    () =>
      resolveArchiveParticipants(
        members,
        createChannelsByParticipantName(channels),
      ),
    [channels, members],
  );

  return (
    <Avatar.Group
      spacing={variant === "card" ? "md" : "lg"}
      className="justify-center"
    >
      {participants.map(({ name, channel }) => {
        const channelName = channel?.channelName || name;
        const avatar = (
          <ChannelAvatar
            key={`${channel?.iconUrl || ""}:${variant}`}
            name={name}
            iconUrl={channel?.iconUrl || ""}
            resolution={variant === "card" ? 160 : 320}
            size={
              variant === "card"
                ? "clamp(3rem, 7vw, 4.5rem)"
                : "clamp(7.5rem, 13vw, 10.5rem)"
            }
            className={
              variant === "card"
                ? "border-[3px] border-white dark:border-gray-900"
                : "border-4 border-white dark:border-gray-900"
            }
          />
        );

        if (variant === "card") {
          return (
            <span key={name} className="rounded-full">
              {avatar}
            </span>
          );
        }

        return (
          <Tooltip key={name} label={channelName} withArrow>
            {channel?.youtubeId ? (
              <a
                href={getChannelUrl(channel.youtubeId)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={channelName}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {avatar}
              </a>
            ) : (
              <span className="rounded-full">{avatar}</span>
            )}
          </Tooltip>
        );
      })}
    </Avatar.Group>
  );
}
