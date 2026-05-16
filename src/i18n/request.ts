import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const requestHeaders = await headers();
  const localeFromHeader = requestHeaders.get("x-locale");

  const locale = hasLocale(routing.locales, requested)
    ? requested
    : hasLocale(routing.locales, localeFromHeader)
      ? localeFromHeader
      : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
