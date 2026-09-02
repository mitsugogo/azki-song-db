"use client";

import { Select } from "@mantine/core";
import { useMemo } from "react";

const ALL_TIME_VALUE = "all";

type ArchivePeriodSelectProps = {
  years: number[];
  selectedYear: string | null;
  allTimeOptionLabel: string;
  ariaLabel: string;
  className?: string;
  onSelectedYearChange: (year: string | null) => void;
};

export default function ArchivePeriodSelect({
  years,
  selectedYear,
  allTimeOptionLabel,
  ariaLabel,
  className = "w-full sm:w-32",
  onSelectedYearChange,
}: ArchivePeriodSelectProps) {
  const yearOptions = useMemo(
    () => [
      { value: ALL_TIME_VALUE, label: allTimeOptionLabel },
      ...years.map((year) => ({ value: String(year), label: String(year) })),
    ],
    [allTimeOptionLabel, years],
  );

  return (
    <Select
      aria-label={ariaLabel}
      data={yearOptions}
      value={selectedYear ?? ALL_TIME_VALUE}
      onChange={(value) =>
        onSelectedYearChange(!value || value === ALL_TIME_VALUE ? null : value)
      }
      allowDeselect={false}
      className={className}
    />
  );
}
