"use client";

import { Badge } from "flowbite-react";
import { FaStar } from "react-icons/fa6";

interface MilestoneBadgeProps {
  milestones: string[] | null | undefined;
  inline?: boolean;
  outClassName?: string;
}

export default function MilestoneBadge({
  milestones,
  inline,
  outClassName,
}: MilestoneBadgeProps) {
  if (!milestones) return null;
  return (
    <>
      {milestones.map((milestone, index) => (
        <div
          className={`align-center ${inline ? "inline" : ""} ${outClassName}`}
          key={index}
        >
          <Badge className="bg-primary-600 hover:bg-primary-500 dark:bg-primary-800 dark:hover:bg-primary-700 text-white dark:text-white inline px-1.5 rounded">
            <FaStar className="inline relative" style={{ top: -1 }} />
            &nbsp;
            {milestone}
          </Badge>
        </div>
      ))}
    </>
  );
}
