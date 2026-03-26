import { useLocale } from "next-intl";

export function formatDate(
  input: Date | string | number,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
) {
  const effectiveLocale =
    locale ||
    (typeof window !== "undefined" ? useLocale() : "ja").replace("_", "-");

  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return String(input);
  }

  const defaultOpts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: effectiveLocale.startsWith("ja") ? "2-digit" : "short",
    day: effectiveLocale.startsWith("ja") ? "2-digit" : "numeric",
  };

  const formatOpts = options ? { ...defaultOpts, ...options } : defaultOpts;

  const resolvedLocale = effectiveLocale.startsWith("ja")
    ? "ja-JP"
    : effectiveLocale;
  return date.toLocaleDateString(resolvedLocale, formatOpts);
}
