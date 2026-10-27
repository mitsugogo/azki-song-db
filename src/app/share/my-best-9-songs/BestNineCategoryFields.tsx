"use client";

import { MultiSelect } from "@mantine/core";
import { useTranslations } from "next-intl";
import {
  BEST_NINE_CATEGORIES,
  bestNineCategoryLabel,
  type BestNineCategory,
} from "@/app/lib/bestNineCategories";

export default function BestNineCategoryFields({
  value,
  onChange,
  slot,
  disabled = false,
}: {
  value: BestNineCategory[];
  onChange: (value: BestNineCategory[]) => void;
  slot: number;
  disabled?: boolean;
}) {
  const t = useTranslations("Share.myBest9");
  return (
    <MultiSelect
      label={t("topics.allowedCategories")}
      size="xs"
      aria-label={t("topics.slotCategoriesLabel", { number: slot + 1 })}
      data={BEST_NINE_CATEGORIES.map((category) => ({
        value: category,
        label: t(`filters.${bestNineCategoryLabel[category]}`),
      }))}
      value={value}
      disabled={disabled}
      onChange={(next) => {
        if (next.includes("all") && !value.includes("all")) {
          onChange(["all"]);
          return;
        }
        const categories = BEST_NINE_CATEGORIES.filter(
          (category) => category !== "all" && next.includes(category),
        );
        onChange(categories.length ? categories : ["all"]);
      }}
    />
  );
}
