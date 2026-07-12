"use client";

import { Link } from "@/i18n/navigation";
import { Breadcrumbs, Button } from "@mantine/core";
import { FaHome } from "react-icons/fa";
import { HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses, pageClasses } from "../theme";
import SummaryTopClient from "./client";
import { useLocale, useTranslations } from "next-intl";
import {
  formatActivityMonthLabel,
  getActivityMonthHref,
  getCurrentActivityMonth,
} from "./monthActivity";
import ActivityJourney from "./ActivityJourney";

export default function SummaryPageClient() {
  const locale = useLocale();
  const t = useTranslations("Summary");

  const now = new Date();
  const currentActivityMonth = getCurrentActivityMonth(now);
  const currentActivityMonthLabel = formatActivityMonthLabel(
    currentActivityMonth,
    locale,
  );

  return (
    <div className={pageClasses.shellFlushBottom}>
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <FaHome className="inline mr-1" /> {t("homeLabel")}
        </Link>
        <Link href="/activity" className={breadcrumbClasses.link}>
          {t("page.title")}
        </Link>
      </Breadcrumbs>

      <h1 className={pageClasses.heading}>{t("page.title")}</h1>

      <div>
        <p className="mb-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
          {t("page.description")}
        </p>
        <ActivityJourney />
        <Button
          component={Link}
          href={getActivityMonthHref(currentActivityMonth)}
          variant="light"
          radius="md"
          size="sm"
          className="mb-6"
        >
          {t("monthActivityLink", { month: currentActivityMonthLabel })}
        </Button>

        <SummaryTopClient />
      </div>
    </div>
  );
}
