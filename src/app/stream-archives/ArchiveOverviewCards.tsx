"use client";

import { Paper, Text } from "@mantine/core";
import { HiClock, HiCollection, HiTrendingUp } from "react-icons/hi";

type ArchiveOverviewCardsProps = {
  values: {
    streamCount: string;
    totalDuration: string;
    averageDuration: string;
  };
  labels: {
    streamCount: string;
    totalDuration: string;
    averageDuration: string;
  };
};

const cards = [
  { key: "streamCount", icon: HiCollection, color: "text-pink-600" },
  { key: "totalDuration", icon: HiClock, color: "text-cyan-600" },
  { key: "averageDuration", icon: HiTrendingUp, color: "text-violet-600" },
] as const;

export default function ArchiveOverviewCards({
  values,
  labels,
}: ArchiveOverviewCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ key, icon: Icon, color }) => (
        <Paper key={key} withBorder radius="md" p="md" shadow="none">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full bg-light-gray-100 p-2 dark:bg-white/10 ${color}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <Text c="dimmed" size="sm">
                {labels[key]}
              </Text>
              <Text fw={700} fz="xl" className="tabular-nums">
                {values[key]}
              </Text>
            </div>
          </div>
        </Paper>
      ))}
    </div>
  );
}
