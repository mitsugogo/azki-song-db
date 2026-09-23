"use client";

import { Badge } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import type { LiveTitleGroup } from "@/app/types/live";
import LiveCategoryBadge from "./LiveCategoryBadge";

export default function LiveTitleHeader({ group }: { group: LiveTitleGroup }) {
  const t = useTranslations("Lives");
  const locale = useLocale();

  return (
    <header className="mb-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <LiveCategoryBadge category={group.category} />
        {group.performances.length > 1 ? (
          <Badge color="gray" variant="light" radius="sm">
            {t("performanceCount", { count: group.performances.length })}
          </Badge>
        ) : null}
      </div>
      <h1 className="text-2xl font-extrabold leading-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
        {locale === "en" ? group.titleEn || group.title : group.title}
      </h1>
    </header>
  );
}
