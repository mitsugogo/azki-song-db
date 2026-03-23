"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "../../i18n/routing";

const options: Array<{
  value: (typeof routing.locales)[number];
  label: string;
}> = [
  { value: "ja", label: "JA" },
  { value: "en", label: "EN" },
];

export default function LanguageSwitcher() {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const t = useTranslations("Header");

  const buildLocalizedPath = (nextLocale: string) => {
    const segments = pathname.split("/").filter(Boolean);
    const hasLocalePrefix = routing.locales.includes(
      segments[0] as (typeof routing.locales)[number],
    );
    const normalizedPath = hasLocalePrefix
      ? `/${segments.slice(1).join("/")}`
      : pathname;
    const pathWithoutPrefix = normalizedPath === "/" ? "" : normalizedPath;

    if (nextLocale === routing.defaultLocale) {
      return pathWithoutPrefix || "/";
    }

    return `/${nextLocale}${pathWithoutPrefix}`;
  };

  const handleSwitchLocale = (nextLocale: string) => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const targetPath = `${buildLocalizedPath(nextLocale)}${search}`;
    if (typeof window !== "undefined") {
      window.location.assign(targetPath);
    }
  };

  return (
    <div
      className="ml-2 inline-flex items-center overflow-hidden rounded-md border border-white/25"
      role="group"
      aria-label={t("languageSwitcher")}
      title={t("languageSwitcher")}
    >
      {options.map((option) => {
        const selected = option.value === locale;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            className={`px-2 py-1 text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
              selected
                ? "bg-white text-primary"
                : "bg-transparent text-white hover:bg-primary-600 dark:hover:bg-primary-800"
            }`}
            onClick={() => handleSwitchLocale(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
