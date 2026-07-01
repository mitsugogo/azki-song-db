"use client";

import { SegmentedControl } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { Song } from "../../types/song";
import {
  getReleaseVariantKind,
  getSelectableReleaseVariants,
  getSongInstanceKey,
  hasMultipleReleaseVariants,
} from "../utils/releaseVariants";

type ReleaseVariantSwitcherProps = {
  variants: Song[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  testId?: string;
};

const circledNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

const toVariantIndexLabel = (index: number) =>
  circledNumbers[index] ?? `(${index + 1})`;

export default function ReleaseVariantSwitcher({
  variants,
  value,
  onChange,
  className,
  testId,
}: ReleaseVariantSwitcherProps) {
  const t = useTranslations("Discography.releaseVariants");
  const selectableVariants = getSelectableReleaseVariants(variants);

  if (!hasMultipleReleaseVariants(selectableVariants)) {
    return null;
  }

  const kindCounts = selectableVariants.reduce((counts, variant) => {
    const kind = getReleaseVariantKind(variant);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
    return counts;
  }, new Map<ReturnType<typeof getReleaseVariantKind>, number>());
  const kindSeen = new Map<ReturnType<typeof getReleaseVariantKind>, number>();

  const data = selectableVariants.map((variant) => {
    const kind = getReleaseVariantKind(variant);
    const baseLabel =
      kind === "mv"
        ? t("mv")
        : kind === "animated"
          ? t("animated")
          : kind === "art-track"
            ? t("artTrack")
            : t("other");
    const kindIndex = kindSeen.get(kind) ?? 0;
    kindSeen.set(kind, kindIndex + 1);

    return {
      value: getSongInstanceKey(variant),
      label:
        (kindCounts.get(kind) ?? 0) > 1
          ? `${baseLabel}${toVariantIndexLabel(kindIndex)}`
          : baseLabel,
    };
  });
  const resolvedValue = data.some((item) => item.value === value)
    ? value
    : data[0].value;

  return (
    <SegmentedControl
      aria-label={t("switcherLabel")}
      data-testid={testId}
      className={className}
      radius="md"
      size="xs"
      value={resolvedValue}
      onChange={onChange}
      data={data}
      classNames={{
        root: "border border-pink-200/70 bg-white/70 p-0.5 dark:border-white/10 dark:bg-gray-800/80",
        indicator: "bg-primary-600 dark:bg-primary-500",
        label:
          "px-2 py-1 text-xs font-semibold text-gray-700 data-[active=true]:text-white dark:text-gray-200 dark:data-[active=true]:text-white",
      }}
    />
  );
}
