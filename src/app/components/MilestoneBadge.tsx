"use client";

import { Badge } from "flowbite-react";
import { FaStar } from "react-icons/fa6";
import { Song } from "../types/song";

interface MilestoneBadgeProps {
  song: Song;
  inline?: boolean;
  outClassName?: string;
  onClick?: (event: React.MouseEvent, song: Song, milestone?: string) => void;
}

export default function MilestoneBadge({
  song,
  inline,
  outClassName,
  onClick,
}: MilestoneBadgeProps) {
  if (!song.milestones) return null;

  const handleOnClick = (
    event: React.MouseEvent,
    song: Song,
    milestone?: string
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
            className={
              `bg-primary-600 hover:bg-primary-500 dark:bg-primary-800 dark:hover:bg-primary-700 text-white dark:text-white inline px-1.5 rounded` +
              (onClick ? " cursor-pointer" : "")
            }
            onClick={(event) => handleOnClick(event, song, milestone)}
          >
            <FaStar className="inline relative" style={{ top: -1 }} />
            &nbsp;
            {milestone}
          </Badge>
        </div>
      ))}
    </>
  );
}
