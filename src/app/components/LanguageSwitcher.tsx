"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "../../i18n/routing";
import { Menu, SegmentedControl } from "@mantine/core";
import { FaGlobe } from "react-icons/fa6";

const options: Array<{
  value: (typeof routing.locales)[number];
  label: string;
}> = [
  { value: "ja", label: "JA" },
  { value: "en", label: "EN" },
];

type Props = {
  compact?: boolean;
  variant?: "light" | "basic";
};

export default function LanguageSwitcher({
  variant = "basic",
  compact = false,
}: Props) {
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

  if (compact) {
    return (
      <Menu withinPortal withArrow>
        <Menu.Target>
          <button
            type="button"
            aria-label={t("languageSwitcher")}
            title={t("languageSwitcher")}
            className="outline-none cursor-pointer ml-2 p-2 rounded-md hover:bg-primary-600 dark:hover:bg-primary-800"
          >
            <FaGlobe />
          </button>
        </Menu.Target>

        <Menu.Dropdown>
          {options.map((option) => (
            <Menu.Item
              key={option.value}
              onClick={() => handleSwitchLocale(option.value)}
              aria-pressed={option.value === locale}
              className={`px-3 py-1 rounded-md ${
                option.value === locale
                  ? "bg-primary-700 text-white dark:bg-white dark:text-primary"
                  : "text-primary dark:text-white"
              }`}
            >
              {option.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <SegmentedControl
      aria-label={t("languageSwitcher")}
      title={t("languageSwitcher")}
      className="ml-2"
      radius="md"
      size="xs"
      value={locale}
      onChange={handleSwitchLocale}
      data={options}
      classNames={{
        root:
          "border p-0.5 " +
          (variant === "basic"
            ? "border-white/25 bg-transparent hover:text-white dark:hover:bg-pink-800/40"
            : "border-pink-200/30 bg-gray-100/30 dark:bg-transparent"),
        indicator: "bg-white",
        label:
          "px-2 py-1 text-xs font-semibold tracking-wide transition-colors cursor-pointer " +
          (variant === "basic"
            ? "text-white/90 hover:text-white dark:text-white data-[active=true]:text-primary"
            : "data-[active=true]:text-primary dark:hover:text-primary dark:hover:text-primary-300 dark:data-[active=true]:text-primary-700"),
      }}
    />
  );
}
