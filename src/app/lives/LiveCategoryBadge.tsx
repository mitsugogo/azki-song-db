"use client";

import { Badge } from "@mantine/core";
import { useTranslations } from "next-intl";
import { getLiveCategoryKey } from "@/app/lib/liveSetlists";

const colors: Record<string, string> = {
  solo: "pink",
  special: "violet",
  versus: "orange",
  officialFestival: "cyan",
  unit: "grape",
  guest: "teal",
};

export default function LiveCategoryBadge({ category }: { category: string }) {
  const t = useTranslations("Lives");
  const key = getLiveCategoryKey(category);

  return (
    <Badge color={key ? colors[key] : "gray"} variant="light" radius="sm">
      {key ? t(`category.${key}`) : category}
    </Badge>
  );
}
