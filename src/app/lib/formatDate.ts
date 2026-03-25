import { useLocale } from "next-intl";

export function formatDate(
  input: Date | string | number,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!locale) {
    locale = useLocale();
  }

  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return String(input);
  }

  const defaultOpts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: locale === "ja" ? "2-digit" : "short",
    day: locale === "ja" ? "2-digit" : "numeric",
  };

  const formatOpts = options ? { ...defaultOpts, ...options } : defaultOpts;

  const resolvedLocale = locale === "ja" ? "ja-JP" : locale || undefined;
  return date.toLocaleDateString(resolvedLocale, formatOpts);
}
