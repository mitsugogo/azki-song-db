import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-locale");

  const locale = hasLocale(routing.locales, requested)
    ? requested
    : hasLocale(routing.locales, headerLocale)
      ? headerLocale
      : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
