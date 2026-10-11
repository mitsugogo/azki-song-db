"use client";

import { useTranslations } from "next-intl";
import { HiChevronRight } from "react-icons/hi";
import { Link } from "@/i18n/navigation";

export function HomeAboutAzkiLink() {
  const t = useTranslations("AboutAzki");
  return (
    <div className="mx-auto mb-8 w-full max-w-3xl px-4 sm:px-6">
      <Link
        href="/about-azki"
        className="flex items-center gap-3 rounded-xl border border-pink-200/70 bg-white/70 px-4 py-4 transition hover:border-primary dark:border-pink-900/60 dark:bg-gray-900/60"
      >
        <img
          src="/icon.png"
          width={40}
          height={40}
          alt=""
          className="shrink-0 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-bold text-primary dark:text-pink-300">
            {t("title")}
          </span>
          <p className="mt-1 text-xs leading-6 text-gray-600 dark:text-gray-300">
            {t("homeDescription")}
          </p>
        </div>
        <HiChevronRight
          className="shrink-0 text-primary dark:text-pink-300"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}
