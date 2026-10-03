"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Popover } from "@mantine/core";
import { MonthPicker } from "@mantine/dates";
import { useLocale, useTranslations } from "next-intl";
import useEvents from "../hook/useEvents";
import useMilestones from "../hook/useMilestones";
import {
  ACTIVITY_START_MONTH,
  ACTIVITY_START_YEAR,
  getActivityMonthHref,
  getCurrentActivityMonth,
  getLatestActivityMonth,
  isActivityMonthInRange,
  padMonth,
  type ActivityMonth,
} from "./monthActivity";

type ActivityMonthPickerButtonProps = {
  defaultYear?: number | null;
  label: string;
};

export default function ActivityMonthPickerButton({
  defaultYear,
  label,
}: ActivityMonthPickerButtonProps) {
  const t = useTranslations("Summary");
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { items: events } = useEvents();
  const { items: milestones } = useMilestones();
  const currentActivityMonth = getCurrentActivityMonth();
  const latestActivityMonth = getLatestActivityMonth([
    ...events.map((item) => item.start_at),
    ...milestones.map((item) => item.date),
  ]);
  const monthPickerMinDate = `${ACTIVITY_START_YEAR}-${padMonth(
    ACTIVITY_START_MONTH,
  )}-01`;
  const monthPickerMaxDate = `${latestActivityMonth.year}-${padMonth(latestActivityMonth.month)}-01`;
  const monthPickerDefaultDate = defaultYear
    ? `${defaultYear}-01-01`
    : `${currentActivityMonth.year}-${padMonth(currentActivityMonth.month)}-01`;

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
    if (!isActivityMonthInRange(activityMonth)) {
      return;
    }

    setIsOpen(false);
    router.push(getActivityMonthHref(activityMonth));
  };

  return (
    <Popover
      opened={isOpen}
      onChange={setIsOpen}
      position="bottom-end"
      shadow="md"
      withinPortal
    >
      <Popover.Target>
        <Button
          onClick={() => setIsOpen((current) => !current)}
          variant="light"
          size="sm"
          radius="md"
        >
          {label}
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
  );
}
