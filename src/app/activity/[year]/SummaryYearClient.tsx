"use client";

import { Link } from "@/i18n/navigation";
import { Breadcrumbs, Button } from "@mantine/core";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { breadcrumbClasses, pageClasses } from "../../theme";
import YearSummaryClient from "./YearSummaryClient";
import { useTranslations } from "next-intl";
import { ScrollToTopButton } from "../../components/ScrollToTopButton";
import ActivityMonthPickerButton from "../ActivityMonthPickerButton";

export default function SummaryYearClient(props: {
  initialSongs: any[];
  year: number | null;
  displayYearServer: number | null;
  rawYearParam: string;
}) {
  const { initialSongs, year, displayYearServer, rawYearParam } = props;
  const t = useTranslations("Summary");
  const minYear = 2018;
  const maxYear = new Date().getFullYear();
  const prevYear =
    typeof displayYearServer === "number" && displayYearServer > minYear
      ? displayYearServer - 1
      : null;
  const nextYear =
    typeof displayYearServer === "number" && displayYearServer < maxYear
      ? displayYearServer + 1
      : null;
  return (
    <div className={pageClasses.shell}>
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> {t("homeLabel")}
        </Link>
        <Link href="/activity" className={breadcrumbClasses.link}>
          {t("page.title")}
        </Link>
        <Link
          href={`/activity/${rawYearParam}`}
          className={breadcrumbClasses.link}
        >
          {displayYearServer
            ? `${displayYearServer}${t("yearSuffix")}`
            : t("page.title")}
        </Link>
      </Breadcrumbs>

      <div className="sticky top-0 z-20 -mx-4 mb-4 bg-white/60 px-4 py-2 backdrop-blur dark:bg-gray-900/75 sm:-mx-6 sm:px-6">
        {/* 前年・翌年ページャー */}
        <div className="mb-4 w-full">
          {displayYearServer && (
            <div className="flex w-full items-center justify-between gap-3">
              {prevYear ? (
                <Button
                  component={Link}
                  href={`/activity/${prevYear}`}
                  variant="light"
                  size="sm"
                  radius="md"
                >
                  {`<< ${prevYear}${t("yearSuffix")}`}
                </Button>
              ) : (
                <div className="h-9 min-w-px" aria-hidden="true" />
              )}

              {nextYear ? (
                <Button
                  component={Link}
                  href={`/activity/${nextYear}`}
                  variant="light"
                  size="sm"
                  radius="md"
                >
                  {`${nextYear}${t("yearSuffix")} >>`}
                </Button>
              ) : (
                <div className="h-9 min-w-px" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <h1 className={pageClasses.heading}>
            {displayYearServer
              ? `${displayYearServer}${t("yearSuffix")}`
              : t("page.title")}
          </h1>
          {displayYearServer && (
            <ActivityMonthPickerButton
              defaultYear={displayYearServer}
              label={t("monthActivityButton")}
            />
          )}
        </div>
      </div>

      <YearSummaryClient
        initialSongs={initialSongs}
        year={
          typeof year === "number" && !Number.isNaN(year) ? year : undefined
        }
        displayYearServer={displayYearServer}
      />
      <ScrollToTopButton />
    </div>
  );
}
