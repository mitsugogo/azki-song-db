"use client";

import { Badge } from "@mantine/core";
import { FaStar } from "react-icons/fa6";
import { Song } from "../types/song";

interface MilestoneBadgeProps {
  song: Song;
  inline?: boolean;
  outClassName?: string;
  badgeClassName?: string;
  badgeOptions?: React.ComponentProps<typeof Badge>;
  onClick?: (event: React.MouseEvent, song: Song, milestone?: string) => void;
}

/**
 * マイルストーンのbadge
 */
export default function MilestoneBadge({
  song,
  inline,
  outClassName,
  badgeClassName,
  badgeOptions,
  onClick,
}: MilestoneBadgeProps) {
  if (!song.milestones) return null;

  const handleOnClick = (
    event: React.MouseEvent,
    song: Song,
    milestone?: string,
  ) => {
    if (onClick) {
      onClick(event, song, milestone);
    }
  };

  return (
    <>
      {song.milestones?.map((milestone, index) => (
        <div
          className={`align-center ${inline ? "inline" : ""} ${outClassName}`}
          key={index}
        >
          <Badge
            color="pink"
            leftSection={<FaStar />}
            className={
              (onClick ? " cursor-pointer" : "") +
              (badgeClassName ? ` ${badgeClassName}` : "")
            }
            onClick={(event) => handleOnClick(event, song, milestone)}
            {...badgeOptions}
          >
            {milestone}
          </Badge>
        </div>
      ))}
    </>
  );
}
