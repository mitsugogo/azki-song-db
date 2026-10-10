import { formatDate } from "./formatDate";
import { parseToJstDayStart, toJstDateKey } from "./highlights";

export function formatEventRange(
  startAt: string,
  endAt: string,
  locale: string,
  options: { compact?: boolean } = {},
) {
  const dateOptions = { timeZone: "Asia/Tokyo" };
  const startLabel = formatDate(startAt, locale, dateOptions);
  const startDate = parseToJstDayStart(startAt);
  const endDate = parseToJstDayStart(endAt);

  if (!startDate || !endDate || startDate.getTime() === endDate.getTime()) {
    return startLabel;
  }

  const separator = locale.startsWith("ja") ? "〜" : " - ";
  const sameYear =
    toJstDateKey(startDate).slice(0, 4) === toJstDateKey(endDate).slice(0, 4);
  const endOptions =
    options.compact && sameYear
      ? { ...dateOptions, year: undefined }
      : dateOptions;
  return `${startLabel}${separator}${formatDate(endAt, locale, endOptions)}`;
}
