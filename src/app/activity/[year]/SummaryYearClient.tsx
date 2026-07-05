"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { Breadcrumbs, Button, Popover } from "@mantine/core";
import { MonthPicker } from "@mantine/dates";
import { FaHome } from "react-icons/fa";
import { HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses, pageClasses } from "../../theme";
import YearSummaryClient from "./YearSummaryClient";
import { useLocale, useTranslations } from "next-intl";
import { ScrollToTopButton } from "../../components/ScrollToTopButton";
import {
  ACTIVITY_START_MONTH,
  ACTIVITY_START_YEAR,
  getActivityMonthHref,
  isActivityMonthInRange,
  padMonth,
  type ActivityMonth,
} from "../monthActivity";

export default function SummaryYearClient(props: {
  initialSongs: any[];
  year: number | null;
  displayYearServer: number | null;
  rawYearParam: string;
}) {
  const { initialSongs, year, displayYearServer, rawYearParam } = props;
  const t = useTranslations("Summary");
  const locale = useLocale();
  const router = useRouter();
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyTriggerRef = useRef<HTMLDivElement>(null);
  const [isStickyActive, setIsStickyActive] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const currentActivityMonth = new Date();
  const monthPickerMinDate = `${ACTIVITY_START_YEAR}-${padMonth(
    ACTIVITY_START_MONTH,
  )}-01`;
  const monthPickerMaxDate = `${currentActivityMonth.getFullYear()}-${padMonth(
    currentActivityMonth.getMonth() + 1,
  )}-01`;
  const monthPickerDefaultDate = displayYearServer
    ? `${displayYearServer}-01-01`
    : monthPickerMaxDate;

  const getMonthPickerActivityMonth = (value: string): ActivityMonth => {
    const [yearValue, monthValue] = value.split("-");
    return {
      year: Number(yearValue),
      month: Number(monthValue),
    };
  };

  const formatMonthLabel = (month: number) => {
    try {
      return new Intl.DateTimeFormat(locale || undefined, {
        month: "long",
      }).format(new Date(2020, month - 1, 1));
    } catch {
      return `${month}${t("monthOfYearSuffix")}`;
    }
  };

  const handleActivityMonthChange = (value: string | null) => {
    if (!value) return;

    const activityMonth = getMonthPickerActivityMonth(value);
    if (!isActivityMonthInRange(activityMonth, currentActivityMonth)) {
      return;
    }

    setIsMonthPickerOpen(false);
    router.push(getActivityMonthHref(activityMonth));
  };

  useEffect(() => {
    const root = scrollContainerRef.current;
    const target = stickyTriggerRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyActive(entry.intersectionRatio < 1);
      },
      {
        root,
        threshold: 1,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={scrollContainerRef} className={pageClasses.shell}>
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
        <Link
          href={`/activity/${rawYearParam}`}
          className={breadcrumbClasses.link}
        >
          {displayYearServer
            ? `${displayYearServer}${t("yearSuffix")}`
            : t("page.title")}
        </Link>
      </Breadcrumbs>

      <div ref={stickyTriggerRef} className="h-px w-full" aria-hidden="true" />

      <div
        className={`sticky top-0 z-20 mb-4 pb-2 ${
          isStickyActive
            ? "bg-white/90 p-4 backdrop-blur supports-backdrop-filter:bg-white/80 dark:bg-gray-900/90 dark:supports-backdrop-filter:bg-gray-900/80"
            : ""
        }`}
      >
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
            <Popover
              opened={isMonthPickerOpen}
              onChange={setIsMonthPickerOpen}
              position="bottom-end"
              shadow="md"
              withinPortal
            >
              <Popover.Target>
                <Button
                  onClick={() => setIsMonthPickerOpen((current) => !current)}
                  variant="light"
                  size="sm"
                  radius="md"
                >
                  {t("monthActivityButton")}
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <MonthPicker
                  allowDeselect={false}
                  defaultDate={monthPickerDefaultDate}
                  locale={locale}
                  maxDate={monthPickerMaxDate}
                  minDate={monthPickerMinDate}
                  monthsListFormat={locale.startsWith("ja") ? "M月" : "MMM"}
                  value={null}
                  yearLabelFormat={locale.startsWith("ja") ? "YYYY年" : "YYYY"}
                  getMonthControlProps={(date) => {
                    const activityMonth = getMonthPickerActivityMonth(date);
                    return {
                      "aria-label": t("monthActivityAriaLabel", {
                        month: formatMonthLabel(activityMonth.month),
                        year: activityMonth.year,
                      }),
                    };
                  }}
                  onChange={handleActivityMonthChange}
                />
              </Popover.Dropdown>
            </Popover>
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
