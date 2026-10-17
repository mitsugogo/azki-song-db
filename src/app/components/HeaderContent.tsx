import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "../config/siteConfig";
import ActivityDaysBadge from "./ActivityDaysBadge";

type HeaderContentProps = {
  navigationToggle: ReactNode;
  withDesktopNavigation?: boolean;
  variant?: "header" | "light";
  titleAs?: "h1" | "span";
  children?: ReactNode;
  actions: ReactNode;
};

/** TOP と通常ページで、ヘッダーの高さと各要素の配置を揃える。 */
export default function HeaderContent({
  navigationToggle,
  withDesktopNavigation = false,
  variant = "header",
  titleAs: Title = "h1",
  children,
  actions,
}: HeaderContentProps) {
  return (
    <div className="w-full px-2">
      <div className="relative flex h-14 md:h-10 lg:h-16 items-center gap-2">
        <div
          className={`absolute inset-y-0 left-0 flex items-center z-10 ${withDesktopNavigation ? "xl:hidden" : ""}`}
        >
          {navigationToggle}
        </div>
        <div
          className={`flex min-w-0 flex-1 items-center justify-start ml-12 ${withDesktopNavigation ? "xl:ml-0" : ""}`}
        >
          <div className="flex min-w-0 items-center gap-1 md:shrink-0 md:gap-3 lg:ml-2">
            <Link
              href="/"
              className={`min-w-0 max-w-full ${variant === "light" ? "text-primary dark:text-pink-200" : ""}`}
            >
              <Title className="hidden sm:block truncate text-lg lg:text-lg font-semibold tracking-[0.06em]">
                {siteConfig.siteNameUpper}
              </Title>
              <Title className="block sm:hidden truncate text-xs font-semibold tracking-[0.04em]">
                {siteConfig.shortName}
              </Title>
            </Link>
            <ActivityDaysBadge variant={variant} />
          </div>
          {children}
        </div>
        <div className="flex shrink-0 items-center pr-2 sm:ml-6 sm:pr-0">
          {actions}
        </div>
      </div>
    </div>
  );
}
